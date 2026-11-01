# الأمان والمصادقة (Security)

هذا الملف يوثّق نموذج المصادقة والصلاحيات، وخطوات التهيئة الإلزامية، والمخاطر
المتبقية المعروفة. اقرأه قبل النشر على أي بيئة حقيقية.

---

## 1. نموذج المصادقة الحالي

- **هوية واحدة فقط:** المهندس / محمد العزب. لا توجد أدوار متعددة
  (لا `staff` ولا `citizen`) ولا حسابات مواطنين.
- **الدخول بكلمة سر واحدة:** لا بريد إلكتروني ولا اسم مستخدم.
  الواجهة `src/app/login/page.tsx` فيها حقل واحد فقط.
- **كلمة السر على الخادم فقط:** تُقرأ من `ADMIN_LOGIN_PASSWORD` في
  `src/lib/adminSession.ts`، وتُقارن بمقارنة ثابتة الزمن. لا توجد كلمة سر
  مكتوبة في الكود أو في حزمة العميل.
- **الجلسة:** كوكي `mostaqbal_admin_session` تحتوي توكن
  `payload.signature` موقّعاً بـ HMAC-SHA256 باستخدام `ADMIN_SESSION_SECRET`.
  - `HttpOnly` + `Secure` في الإنتاج + `SameSite=Lax` + `path=/`.
  - مدة افتراضية 168 ساعة (`ADMIN_SESSION_TTL_HOURS`).
  - التحقق يتم في `src/proxy.ts` و`getSessionProfile()` في
    `src/lib/supabase/server.ts`، ويشمل التوقيع والموضوع (`sub`) وتاريخ
    الانتهاء (`exp`).
- **لا Supabase Auth:** لا `signInWithPassword` ولا `/auth/callback` ولا
  جلسات Supabase. Supabase مستخدمة للبيانات والتخزين فقط.
- **الحراس:**
  - `src/proxy.ts` يحمي `/admin/:path*` و`/account/:path*`.
  - `src/app/admin/layout.tsx` → `requireAdmin()`
  - `src/app/admin/users/layout.tsx` → `requireAdmin()`
  - `src/app/account/page.tsx` → `requireUser()`
- **فشل مغلق:** إن لم تُضبط متغيرات البيئة، يعيد `/api/auth/login` الحالة 503
  ولا تُفتح المنطقة المحمية.

### مسارات المصادقة

| المسار | الوظيفة |
|---|---|
| `POST /api/auth/login` | يتحقق من كلمة السر، ينشئ التوكن الموقّع، ويضبط الكوكي. |
| `POST /api/auth/logout` | يحذف الكوكي. |
| `GET /api/auth/session` | يعيد المستخدم بعد التحقق من الكوكي أو `null`. |

جميعها ترجع `Cache-Control: no-store`.

---

## 2. خطوات التهيئة الإلزامية

### أ) متغيرات البيئة

أضف إلى `.env.local` (خادمية فقط، بدون `NEXT_PUBLIC_`):

```env
ADMIN_LOGIN_PASSWORD=كلمة-سر-قوية-وفريدة
ADMIN_SESSION_SECRET=مفتاح-توقيع-عشوائي-بطول-32-حرفاً-على-الأقل
ADMIN_SESSION_TTL_HOURS=168
```

- لا تضع `ADMIN_LOGIN_PASSWORD` أو `ADMIN_SESSION_SECRET` في أي متغير
  `NEXT_PUBLIC_*`.
- اعتبر أي كلمة سر قديمة (مثل `azab12345`) وأي توكن قديم **محروقين نهائياً**.
- لتغيير كلمة السر: حدّث `ADMIN_LOGIN_PASSWORD` وأعد تشغيل الخادم.
- لتغيير `ADMIN_SESSION_SECRET`: كل الجلسات الحالية تُصبح غير صالحة فوراً.

### ب) قاعدة البيانات

1. **مشروع جديد:** نفّذ `supabase/schema.sql` كاملاً في SQL Editor.
2. **قاعدة قائمة:** نفّذ بالترتيب:
   - `supabase/migrations/20261102_p0_auth_hardening.sql`
   - `supabase/migrations/20261103_p1_p2_hardening.sql`
3. **إغلاق التسجيل في Supabase** إلزامي حتى لو لم يعد النظام يستخدم
   Supabase Auth:
   - Dashboard → Authentication → Sign In / Providers → Email →
     عطّل **Enable sign up**.
   - عطّل **Anonymous Sign-ins** إن كانت مفعّلة.
   - أو عبر Management API:
     `PATCH /v1/projects/{ref}/config/auth` بـ `{"disable_signup": true}`.

### ج) لا حاجة لإنشاء حساب أدمن

لا يوجد حساب Supabase Auth للأدمن. الدخول يتم بكلمة السر فقط بعد ضبط
متغيرات البيئة. إن كانت هناك حسابات Supabase Auth قديمة، راجعها واحذف غير
المعروف منها.

---

## 3. ما تم تشديده في الكود

- إزالة الباب الخلفي القديم (كوكي ثابت + كلمة سر مكتوبة في الكود).
- توقيع الجلسة والتحقق منها على الخادم؛ لا يمكن تزويرها بدون
  `ADMIN_SESSION_SECRET`.
- حذف مسار Supabase Auth بالكامل (`src/app/auth/callback`).
- تقليل الأدوار إلى دور واحد `admin` وإزالة `staff`/`citizen`.
- حراس `/admin` و`/admin/users` يستخدمون `requireAdmin` على الخادم.
- تهريب HTML مركزي (`src/lib/escapeHtml.ts`) على كل حقول الشكوى في
  `generateSinglePdf.ts` و`generateBulkPdf.ts` لمنع XSS المخزّن.
- حذف بيانات المواطنين التجريبية من حزمة العميل (`complaintsService.ts`)
  ومن `supabase/schema.sql`، وتنظيف مفاتيح `localStorage` القديمة.
- تنظيف `localStorage` عند تسجيل الخروج.
- `privacyAgreed` يبدأ `false`، ويُفرض التحقق منه قبل الإرسال.
- تحقق عميل من نوع/حجم المرفقات، وأسماء ملفات عشوائية بدلاً من اسم المستخدم.
- ترويسات أمان: CSP أوسع، `no-store` و`noindex` على `/admin` و`/account`
  و`/login` و`/api/auth/*`.
- `admin_remove_staff` يتطلب `is_super_admin()` وليس `is_admin()`.
- منع `UPDATE` المباشر على `profiles` من `authenticated`.
- حدود طول وتحقق صيغ الهاتف/الرقم القومي وعدد المرفقات في
  `submit_complaint`.

---

## 4. ملاحظة مهمة عن الوصول للبيانات

سياسات RLS الحالية في `complaints`/`complaint_timeline`/`profiles` تعتمد على
`auth.uid()` من Supabase Auth. وبما أن الدخول أصبح بكلمة سر فقط بدون جلسة
Supabase Auth:

- **القراءة/الكتابة من العميل بصلاحية الأدمن لم تعد تعمل عبر RLS.**
  `complaintsService` يعيد البيانات المحلية المحفوظة على الجهاز عند تعذّر
  الجلب، والتحديثات تُطبَّق محلياً فقط.
- **تقديم الشكاوى ما زال يعمل** لأن `submit_complaint` ممنوحة لـ `anon` ولا
  تشترط جلسة.
- **التتبع العام ما زال يعمل** عبر `track_complaints`.

للوصول الحقيقي للبيانات الإدارية في الإنتاج، يجب اختيار أحد الحلول التالية:

1. مسارات خادمية (`Route Handlers`) تستخدم مفتاح `service_role` على الخادم
   فقط، مع تحقق `getSessionProfile()` قبل كل عملية.
2. إبقاء Supabase Auth كجلسة داخلية تُدار من الخادم بعد التحقق من كلمة
   السر، دون إظهار بريد/كلمة مرور للمستخدم.
3. تصميم RLS بديل لا يعتمد على `auth.uid()` (غير مُوصى به).

هذا القرار مؤجّل ولم يُنفَّذ في هذه المرحلة.

---

## 5. مخاطر متبقية يجب معالجتها قبل الإنتاج

1. **مخزن المرفقات عام:** الحاوية `complaint-media` عامة للقراءة والرفع لأن
   التقديم متاح بدون حساب. الحل الأمثل: حاوية خاصة + روابط موقّعة قصيرة
   العمر عبر Route Handler مصادَق + سياسات ربط الملف بالشكوى.
2. **لا يوجد Rate Limiting موزّع:** حدّ المحاولات في `/api/auth/login` داخل
   الذاكرة (best-effort) ولا يكفي في بيئة Serverless. أضف Upstash/WAF.
   وكذلك `/track` وتقديم الشكاوى.
3. **`xlsx`:** ثغرة معروفة (Prototype Pollution/ReDoS). الاستخدام الحالي
   كتابة فقط. انتقل إلى `exceljs` أو `write-excel-file` قبل أي استيراد.
4. **CSP:** تحتوي `'unsafe-inline'` لسكربتات Next.js. الانتقال إلى nonce
   عبر middleware يقوّي الحماية أكثر.
5. **لا يوجد سجل تدقيق أمني:** السجل الزمني يوثّق تغييرات الحالة فقط، وليس
   محاولات الدخول الفاشلة أو القراءات.
6. **البيانات المحلية:** أي شكوى تُحفظ في `localStorage` تبقى على الجهاز
   حتى تسجيل الخروج أو مسح المتصفح. لا تُستخدم على أجهزة مشتركة.
7. **رفع الملفات قبل إنشاء الشكوى:** يمكن رفع ملفات دون تقديم شكوى. أضف
   مهمة تنظيف دورية للملفات اليتيمة.
8. **`admin_notes`:** سياسات RLS على مستوى الصف وليس العمود. الحل الأمثل نقل
   الملاحظات الداخلية إلى جدول منفصل.

---

## 6. الإبلاغ عن ثغرة

لا تفتح Issue عاماً يحتوي تفاصيل ثغرة. أرسل التفاصيل إلى مسؤول المنظومة
داخل الحزب، مع خطوات إعادة الإنتاج والأثر المتوقع.
