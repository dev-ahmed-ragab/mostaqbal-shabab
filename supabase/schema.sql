-- ==============================================================================
-- منظومة خدمة المواطنين وأمانة الشباب
-- سكيما إنشاء كامل وآمن لمشروع Supabase جديد (Fresh Install)
--
-- مهم:
--  * هذا الملف هو النسخة الآمنة والموحّدة من السكيما (جداول + أدوار + RLS + RPCs).
--  * نفّذه مرة واحدة في Supabase SQL Editor لمشروع جديد.
--  * لقاعدة بيانات قائمة مبنية على النسخة القديمة، نفّذ:
--        supabase/migrations/20261030_security.sql
--  * الملف idempotent ويمكن تشغيله أكثر من مرة بأمان.
--  * يجب إبقاء "تأكيد البريد الإلكتروني" (Email Confirmation) مفعّلاً،
--    لأن منح أدوار فريق العمل يعتمد على بريد مؤكَّد فقط.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. جدول الشكاوى والطلبات
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_code TEXT NOT NULL UNIQUE,
  citizen_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  citizen_name TEXT NOT NULL,
  national_id TEXT NOT NULL,
  primary_phone TEXT NOT NULL,
  alt_contacts JSONB NOT NULL DEFAULT '[]'::jsonb,

  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (
    status IN ('new', 'under_review', 'needs_info', 'in_progress', 'resolved', 'rejected')
  ),

  committee_id TEXT DEFAULT 'youth',
  committee_name TEXT DEFAULT 'أمانة الشباب',
  category TEXT,
  priority TEXT DEFAULT 'normal',
  wants_promotion BOOLEAN NOT NULL DEFAULT false,
  promotion_role TEXT,
  is_confidential BOOLEAN NOT NULL DEFAULT false,

  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  location_address TEXT,

  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- ملاحظات داخلية لا تُعرض للمواطن إطلاقاً (يتم حجبها في RPC التتبع).
  admin_notes TEXT,
  -- الرد الرسمي المنشور للمواطن.
  public_response TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ترقية قواعد البيانات القائمة.
ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS citizen_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS committee_id TEXT DEFAULT 'youth';
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS committee_name TEXT DEFAULT 'أمانة الشباب';
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS wants_promotion BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS promotion_role TEXT;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS is_confidential BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS public_response TEXT;

-- توليد كود التتبع على الخادم (المصدر الموثوق) لضمان عدم التكرار.
CREATE SEQUENCE IF NOT EXISTS public.complaint_tracking_seq;

CREATE OR REPLACE FUNCTION public.assign_tracking_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tracking_code IS NOT NULL AND btrim(NEW.tracking_code) <> '' THEN
    RETURN NEW;
  END IF;

  NEW.tracking_code :=
    'SH-' || to_char(now(), 'MMDD') || '-' ||
    lpad(nextval('public.complaint_tracking_seq')::text, 3, '0');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assign_tracking_code ON public.complaints;
CREATE TRIGGER assign_tracking_code
  BEFORE INSERT ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.assign_tracking_code();

-- ------------------------------------------------------------------------------
-- 2. السجل الزمني للحركات
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.complaint_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT,
  actor_name TEXT DEFAULT 'أمانة الشباب',
  -- false = ملاحظة داخلية لا تُعرض للمواطن.
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.complaint_timeline
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true;

-- ------------------------------------------------------------------------------
-- 3. الفهارس
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_complaints_tracking_code ON public.complaints(tracking_code);
CREATE INDEX IF NOT EXISTS idx_complaints_primary_phone ON public.complaints(primary_phone);
CREATE INDEX IF NOT EXISTS idx_complaints_national_id ON public.complaints(national_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON public.complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_citizen_id ON public.complaints(citizen_id);
CREATE INDEX IF NOT EXISTS idx_complaints_committee_id ON public.complaints(committee_id);
CREATE INDEX IF NOT EXISTS idx_timeline_complaint_id ON public.complaint_timeline(complaint_id);

-- ------------------------------------------------------------------------------
-- 4. تحديث updated_at تلقائياً
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_complaints_timestamp ON public.complaints;
CREATE TRIGGER trigger_update_complaints_timestamp
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ------------------------------------------------------------------------------
-- 5. ملفات المستخدمين (المصدر الوحيد للدور) ودعوات فريق العمل
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'citizen'
    CHECK (role IN ('admin', 'committee_head', 'executive_member', 'member', 'citizen')),
  committee_id TEXT DEFAULT 'youth',
  committee_name TEXT DEFAULT 'أمانة الشباب',
  role_title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(lower(email));

CREATE TABLE IF NOT EXISTS public.staff_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL
    CHECK (role IN ('admin', 'committee_head', 'executive_member', 'member')),
  committee_id TEXT DEFAULT 'youth',
  committee_name TEXT DEFAULT 'أمانة الشباب',
  role_title TEXT,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_invites_email ON public.staff_invites(lower(email));

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ------------------------------------------------------------------------------
-- 6. دوال التحقق من الدور
--    SECURITY DEFINER لأن سياسات RLS تستدعيها، مع تثبيت search_path.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_committee()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT committee_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(public.current_role() = 'admin', false);
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(public.current_role() IN
    ('admin', 'committee_head', 'executive_member', 'member'), false);
$$;

-- ------------------------------------------------------------------------------
-- 7. إنشاء/تحديث الملف الشخصي عند تسجيل مستخدم جديد
--    الدور لا يُقرأ من user_metadata إطلاقاً، ولا تُطبَّق الدعوة قبل تأكيد البريد.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.staff_invites%ROWTYPE;
  v_role TEXT := 'citizen';
  v_committee_id TEXT := 'youth';
  v_committee_name TEXT := 'أمانة الشباب';
  v_role_title TEXT := NULL;
  v_has_invite BOOLEAN := false;
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL THEN
    SELECT * INTO v_invite
    FROM public.staff_invites
    WHERE lower(email) = lower(NEW.email)
    LIMIT 1;

    IF FOUND THEN
      v_has_invite := true;
      v_role := v_invite.role;
      v_committee_id := coalesce(v_invite.committee_id, 'youth');
      v_committee_name := coalesce(v_invite.committee_name, 'أمانة الشباب');
      v_role_title := v_invite.role_title;
    END IF;
  END IF;

  INSERT INTO public.profiles
    (id, email, full_name, role, committee_id, committee_name, role_title)
  VALUES (
    NEW.id,
    NEW.email,
    coalesce(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    v_role,
    v_committee_id,
    v_committee_name,
    v_role_title
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    -- الترقية فقط من مواطن إلى دور فريق عمل، ولا يُخفَّض دور قائم تلقائياً.
    role = CASE
      WHEN public.profiles.role = 'citizen' AND excluded.role <> 'citizen'
        THEN excluded.role
      ELSE public.profiles.role
    END,
    committee_id = CASE
      WHEN public.profiles.role = 'citizen' AND excluded.role <> 'citizen'
        THEN excluded.committee_id
      ELSE public.profiles.committee_id
    END,
    committee_name = CASE
      WHEN public.profiles.role = 'citizen' AND excluded.role <> 'citizen'
        THEN excluded.committee_name
      ELSE public.profiles.committee_name
    END,
    role_title = coalesce(public.profiles.role_title, excluded.role_title),
    updated_at = now();

  IF v_has_invite THEN
    DELETE FROM public.staff_invites WHERE lower(email) = lower(NEW.email);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
  EXECUTE FUNCTION public.handle_new_user();

-- دعوة بريد مسجّل مسبقاً (حساب مواطن مؤكَّد): تُطبَّق فوراً عند إنشاء الدعوة.
CREATE OR REPLACE FUNCTION public.apply_staff_invite()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_applied BOOLEAN := false;
BEGIN
  UPDATE public.profiles p
  SET
    role = NEW.role,
    committee_id = coalesce(NEW.committee_id, p.committee_id),
    committee_name = coalesce(NEW.committee_name, p.committee_name),
    role_title = coalesce(NEW.role_title, p.role_title),
    updated_at = now()
  WHERE lower(p.email) = lower(NEW.email)
    AND EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = p.id AND u.email_confirmed_at IS NOT NULL
    );

  v_applied := FOUND;

  IF v_applied THEN
    DELETE FROM public.staff_invites WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_staff_invite_created ON public.staff_invites;
CREATE TRIGGER on_staff_invite_created
  AFTER INSERT ON public.staff_invites
  FOR EACH ROW EXECUTE FUNCTION public.apply_staff_invite();

-- ------------------------------------------------------------------------------
-- 8. حماية آخر مشرف عام من الحذف أو خفض الدور
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_last_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining_admins INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.role = 'admin' THEN
      SELECT count(*) INTO remaining_admins
      FROM public.profiles
      WHERE role = 'admin' AND id <> OLD.id;

      IF remaining_admins = 0 THEN
        RAISE EXCEPTION 'لا يمكن حذف آخر مشرف عام في المنظومة';
      END IF;
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.role = 'admin' AND NEW.role <> 'admin' THEN
      SELECT count(*) INTO remaining_admins
      FROM public.profiles
      WHERE role = 'admin' AND id <> OLD.id;

      IF remaining_admins = 0 THEN
        RAISE EXCEPTION 'لا يمكن إزالة دور آخر مشرف عام في المنظومة';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN coalesce(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS protect_last_admin_update ON public.profiles;
CREATE TRIGGER protect_last_admin_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_last_admin();

DROP TRIGGER IF EXISTS protect_last_admin_delete ON public.profiles;
CREATE TRIGGER protect_last_admin_delete
  BEFORE DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_last_admin();

-- ------------------------------------------------------------------------------
-- 9. تعبئة الملفات الشخصية للحسابات الحالية + تطبيق الدعوات المعلقة
-- ------------------------------------------------------------------------------
INSERT INTO public.profiles (id, email, full_name)
SELECT
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

UPDATE public.profiles p
SET
  role = i.role,
  committee_id = coalesce(i.committee_id, p.committee_id),
  committee_name = coalesce(i.committee_name, p.committee_name),
  role_title = coalesce(i.role_title, p.role_title),
  updated_at = now()
FROM public.staff_invites i
WHERE lower(p.email) = lower(i.email)
  AND p.role = 'citizen'
  AND EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = p.id AND u.email_confirmed_at IS NOT NULL
  );

DELETE FROM public.staff_invites i
USING public.profiles p
WHERE lower(i.email) = lower(p.email) AND p.role <> 'citizen';

-- ------------------------------------------------------------------------------
-- 10. دعوات تأسيسية: المشرف العام ورئيس أمانة الشباب
--     يُطبَّق الدور بعد تسجيل الحساب بهذا البريد وتأكيده.
-- ------------------------------------------------------------------------------
INSERT INTO public.staff_invites
  (email, role, committee_id, committee_name, role_title)
VALUES
  (
    'admin@mostaqbal-watan.org',
    'admin',
    'all',
    'أمانة الشباب',
    'أمين التنظيم (المشرف العام)'
  ),
  (
    'samer.talawe@mostaqbal-watan.org',
    'committee_head',
    'youth',
    'أمانة الشباب',
    'رئيس أمانة الشباب'
  )
ON CONFLICT (email) DO UPDATE
SET
  role = excluded.role,
  committee_id = excluded.committee_id,
  committee_name = excluded.committee_name,
  role_title = excluded.role_title;

-- ------------------------------------------------------------------------------
-- 11. تريجرات الشكاوى
-- ------------------------------------------------------------------------------
-- السجل الزمني الأولي يُضاف من الخادم، ولا يُسمح للعميل بالكتابة في السجل عند الإنشاء.
CREATE OR REPLACE FUNCTION public.handle_new_complaint()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.complaint_timeline
    (complaint_id, status, note, actor_name)
  VALUES (
    NEW.id,
    'new',
    'تم تقديم الشكوى بنجاح عبر المنظومة الإلكترونية.',
    'المنظومة الإلكترونية'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_complaint_created ON public.complaints;
CREATE TRIGGER on_complaint_created
  AFTER INSERT ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_complaint();

-- منع غير المشرف العام من تعديل بيانات الملكية أو كود التتبع.
CREATE OR REPLACE FUNCTION public.guard_complaint_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF NEW.citizen_id IS DISTINCT FROM OLD.citizen_id
      OR NEW.national_id IS DISTINCT FROM OLD.national_id
      OR NEW.primary_phone IS DISTINCT FROM OLD.primary_phone
      OR NEW.tracking_code IS DISTINCT FROM OLD.tracking_code THEN
      RAISE EXCEPTION 'غير مصرح بتعديل بيانات ملكية الطلب';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_complaint_update ON public.complaints;
CREATE TRIGGER guard_complaint_update
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.guard_complaint_update();

-- ------------------------------------------------------------------------------
-- 12. سياسات RLS
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_timeline ENABLE ROW LEVEL SECURITY;

-- إزالة السياسات القديمة المفتوحة (إن وُجدت).
DROP POLICY IF EXISTS "Allow public insert to complaints" ON public.complaints;
DROP POLICY IF EXISTS "Allow public select on complaints" ON public.complaints;
DROP POLICY IF EXISTS "Allow authenticated update to complaints" ON public.complaints;
DROP POLICY IF EXISTS "Allow public select on timeline" ON public.complaint_timeline;
DROP POLICY IF EXISTS "Allow all insert on timeline" ON public.complaint_timeline;

-- الملفات الشخصية: المستخدم يقرأ ملفه، والمشرف العام يقرأ الجميع.
DROP POLICY IF EXISTS "profiles_select_own_or_staff" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
CREATE POLICY "profiles_delete_admin"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- الدعوات: للمشرف العام فقط.
DROP POLICY IF EXISTS "staff_invites_admin_all" ON public.staff_invites;
CREATE POLICY "staff_invites_admin_all"
  ON public.staff_invites FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- الشكاوى: قراءة محدودة النطاق (لا قراءة عامة إطلاقاً).
DROP POLICY IF EXISTS "complaints_select_scoped" ON public.complaints;
CREATE POLICY "complaints_select_scoped"
  ON public.complaints FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR citizen_id = auth.uid()
    OR (
      public.is_staff()
      AND (committee_id IS NULL OR committee_id = public.current_committee())
      AND (is_confidential = false OR public.current_role() = 'committee_head')
    )
  );

-- لا سياسة INSERT مباشرة على الجدول:
-- التقديم يتم حصراً عبر الدالة submit_complaint (SECURITY DEFINER) التي تضبط
-- citizen_id والحقول الإدارية وكود التتبع على الخادم، وتعيد الصف للمواطن.
DROP POLICY IF EXISTS "complaints_insert_public" ON public.complaints;
REVOKE INSERT ON public.complaints FROM anon, authenticated;

DROP POLICY IF EXISTS "complaints_update_staff" ON public.complaints;
CREATE POLICY "complaints_update_staff"
  ON public.complaints FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR (
      public.is_staff()
      AND (committee_id IS NULL OR committee_id = public.current_committee())
    )
  )
  WITH CHECK (
    public.is_admin()
    OR (
      public.is_staff()
      AND (committee_id IS NULL OR committee_id = public.current_committee())
    )
  );

DROP POLICY IF EXISTS "complaints_delete_admin" ON public.complaints;
CREATE POLICY "complaints_delete_admin"
  ON public.complaints FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- السجل الزمني: القراءة تتبع صلاحية قراءة الشكوى الأصلية.
DROP POLICY IF EXISTS "timeline_select_scoped" ON public.complaint_timeline;
CREATE POLICY "timeline_select_scoped"
  ON public.complaint_timeline FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR (
      EXISTS (
        SELECT 1 FROM public.complaints c
        WHERE c.id = complaint_timeline.complaint_id
      )
      AND (complaint_timeline.is_public = true OR public.is_staff())
    )
  );

DROP POLICY IF EXISTS "timeline_insert_staff" ON public.complaint_timeline;
CREATE POLICY "timeline_insert_staff"
  ON public.complaint_timeline FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    OR (
      public.is_staff()
      AND EXISTS (
        SELECT 1 FROM public.complaints c
        WHERE c.id = complaint_timeline.complaint_id
          AND (c.committee_id IS NULL OR c.committee_id = public.current_committee())
      )
    )
  );

-- ------------------------------------------------------------------------------
-- 13. RPCs
-- ------------------------------------------------------------------------------

-- تقديم شكوى جديدة من الزائر أو المواطن المسجل.
-- SECURITY DEFINER: يضبط citizen_id والحقول الإدارية وكود التتبع على الخادم،
-- ويعيد الصف كاملاً بعد الإدخال (بما فيه كود التتبع) دون منح قراءة عامة للجدول.
CREATE OR REPLACE FUNCTION public.submit_complaint(
  p_citizen_name TEXT,
  p_national_id TEXT,
  p_primary_phone TEXT,
  p_title TEXT,
  p_description TEXT,
  p_alt_contacts JSONB DEFAULT '[]'::jsonb,
  p_committee_id TEXT DEFAULT 'youth',
  p_committee_name TEXT DEFAULT 'أمانة الشباب',
  p_is_confidential BOOLEAN DEFAULT false,
  p_location_lat DOUBLE PRECISION DEFAULT NULL,
  p_location_lng DOUBLE PRECISION DEFAULT NULL,
  p_location_address TEXT DEFAULT NULL,
  p_attachments JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.complaints%ROWTYPE;
BEGIN
  IF coalesce(btrim(p_citizen_name), '') = ''
    OR coalesce(btrim(p_national_id), '') = ''
    OR coalesce(btrim(p_primary_phone), '') = ''
    OR coalesce(btrim(p_title), '') = ''
    OR coalesce(btrim(p_description), '') = '' THEN
    RAISE EXCEPTION 'بيانات الطلب غير مكتملة' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.complaints (
    citizen_id, citizen_name, national_id, primary_phone, alt_contacts,
    title, description, status, priority,
    committee_id, committee_name, is_confidential,
    location_lat, location_lng, location_address,
    attachments, admin_notes, public_response
  ) VALUES (
    auth.uid(),
    btrim(p_citizen_name),
    btrim(p_national_id),
    btrim(p_primary_phone),
    coalesce(p_alt_contacts, '[]'::jsonb),
    btrim(p_title),
    btrim(p_description),
    'new',
    'normal',
    coalesce(nullif(btrim(p_committee_id), ''), 'youth'),
    coalesce(nullif(btrim(p_committee_name), ''), 'أمانة الشباب'),
    coalesce(p_is_confidential, false),
    p_location_lat,
    p_location_lng,
    nullif(btrim(p_location_address), ''),
    coalesce(p_attachments, '[]'::jsonb),
    NULL,
    NULL
  )
  RETURNING * INTO v_row;

  RETURN to_jsonb(v_row);
END;
$$;

REVOKE ALL ON FUNCTION public.submit_complaint(
  TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, BOOLEAN,
  DOUBLE PRECISION, DOUBLE PRECISION, TEXT, JSONB
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_complaint(
  TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, BOOLEAN,
  DOUBLE PRECISION, DOUBLE PRECISION, TEXT, JSONB
) TO anon, authenticated;

-- استعلام المواطن: يتطلب الهاتف + (كود التتبع أو الرقم القومي).
-- يعيد JSON بعد حجب الملاحظات الداخلية ومعرّف الحساب.
DROP FUNCTION IF EXISTS public.track_complaints(TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.track_complaints(
  p_code TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_national_id TEXT DEFAULT NULL
)
RETURNS SETOF jsonb
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
           to_jsonb(c)
           - 'admin_notes' - 'citizen_id'
           - 'national_id' - 'alt_contacts'
           - 'location_lat' - 'location_lng'
         )
         || jsonb_build_object(
              'national_id',
              CASE
                WHEN c.national_id IS NULL OR length(c.national_id) < 8 THEN NULL
                ELSE left(c.national_id, 4) || '******' || right(c.national_id, 4)
              END
            )
  FROM public.complaints c
  WHERE p_phone IS NOT NULL
    AND c.primary_phone = btrim(p_phone)
    AND (
      (p_code IS NOT NULL AND upper(c.tracking_code) = upper(btrim(p_code)))
      OR (p_national_id IS NOT NULL AND c.national_id = btrim(p_national_id))
    )
  ORDER BY c.created_at DESC;
$$;

-- سجل التتبع العام: يتطلب رقم الهاتف المسجل مع نفس الطلب.
CREATE OR REPLACE FUNCTION public.track_complaint_timeline(
  p_complaint_id UUID,
  p_phone TEXT
)
RETURNS SETOF public.complaint_timeline
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.*
  FROM public.complaint_timeline t
  WHERE t.complaint_id = p_complaint_id
    AND t.is_public = true
    AND EXISTS (
      SELECT 1 FROM public.complaints c
      WHERE c.id = p_complaint_id
        AND p_phone IS NOT NULL
        AND c.primary_phone = btrim(p_phone)
    )
  ORDER BY t.created_at ASC;
$$;

-- حذف حساب عضو (لا يحذف نفسه ولا آخر مشرف عام).
CREATE OR REPLACE FUNCTION public.admin_remove_staff(p_target UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'غير مصرح' USING ERRCODE = '42501';
  END IF;

  IF p_target = auth.uid() THEN
    RAISE EXCEPTION 'لا يمكنك حذف حسابك الحالي';
  END IF;

  DELETE FROM auth.users WHERE id = p_target;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_remove_staff(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_remove_staff(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.track_complaints(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_complaints(TEXT, TEXT, TEXT) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.track_complaint_timeline(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_complaint_timeline(UUID, TEXT) TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 14. مخزن المرفقات complaint-media
--     ملاحظة أمنية: الرفع والقراءة عامّان لأن التقديم متاح بدون حساب.
--     لا تضع في هذا المخزن أي مستندات هوية أو ملفات سرية (انظر SECURITY.md).
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'complaint-media',
  'complaint-media',
  true,
  26214400,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO UPDATE
SET
  public = true,
  file_size_limit = 26214400,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/quicktime', 'video/webm'];

DROP POLICY IF EXISTS "Public Upload To complaint-media" ON storage.objects;
CREATE POLICY "Public Upload To complaint-media"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'complaint-media'
    AND (storage.foldername(name))[1] = 'uploads'
  );

-- لا سياسة قراءة عامة: روابط الملفات في الحاوية العامة تعمل مباشرة،
-- لكن لا يمكن سرد/تعداد كل المرفقات عبر Storage API.
DROP POLICY IF EXISTS "Public Read complaint-media" ON storage.objects;
DROP POLICY IF EXISTS "Staff Read complaint-media" ON storage.objects;
CREATE POLICY "Staff Read complaint-media"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'complaint-media' AND public.is_staff());

-- ------------------------------------------------------------------------------
-- 15. بيانات تجريبية (اختياري)
--     احذف هذا القسم بالكامل قبل النشر الفعلي.
-- ------------------------------------------------------------------------------
INSERT INTO public.complaints (
  tracking_code, citizen_name, national_id, primary_phone, alt_contacts,
  title, description, status, committee_id, committee_name, category,
  location_address, admin_notes, public_response, created_at
) VALUES
(
  'SH-1030-01',
  'أحمد محمود إبراهيم',
  '29510151234567',
  '01012345678',
  '[{"type": "whatsapp", "value": "01012345678"}]'::jsonb,
  'طلب دعم وتجهيز ملتقى توظيف شباب الخريجين',
  'نرجو من أمانة الشباب الموقرة التنسيق لتنظيم ملتقى توظيف مصغر بالتعاون مع شركات القطاع الخاص لتوفير فرص عمل لشباب الدائرة.',
  'under_review',
  'youth',
  'أمانة الشباب',
  'التوظيف وريادة الأعمال',
  'مركز شباب المدينة - الصالة المغطاة',
  'تم إحالة الموضوع لمقرر أمانة الشباب للتنسيق مع الشركات الراعية.',
  'تمت إحالة الطلب للأمانة المختصة وجاري التنسيق مع الشركات.',
  NOW() - INTERVAL '2 hours'
),
(
  'SH-1030-02',
  'سارة عبد الرحمن يوسف',
  '29805201234568',
  '01123456789',
  '[{"type": "whatsapp", "value": "01123456789"}, {"type": "email", "value": "sara.youssef@example.com"}]'::jsonb,
  'صيانة ملعب كرة القدم وتوفير إضاءة كاشفة',
  'أعمدة الإنارة في الملعب الخماسي معطلة منذ أسبوع والشباب لا يستطيعون ممارسة الأنشطة الرياضية ليلاً، نرجو الصيانة العاجلة.',
  'in_progress',
  'youth',
  'أمانة الشباب',
  'الأنشطة الرياضية',
  'ملعب قرية الأمل الرياضي',
  'تم التواصل مع فني الكهرباء وتوفير الكشافات، جاري التركيب غداً.',
  NULL,
  NOW() - INTERVAL '5 hours'
),
(
  'SH-1029-01',
  'محمد السيد الشناوي',
  '29203101234569',
  '01234567890',
  '[{"type": "phone", "value": "01512345678"}]'::jsonb,
  'إنشاء دورة تدريبية مجانية في البرمجة والذكاء الاصطناعي',
  'مقترح لإطلاق مبادرة لتأهيل 50 شاباً وفتاة في مهارات العمل الحر والبرمجة بالتعاون مع مدربين متطوعين.',
  'resolved',
  'youth',
  'أمانة الشباب',
  'التدريب والتأهيل',
  'مقر قاعة المؤتمرات',
  'تمت الموافقة وتدشين الدورة التدريبية يوم السبت القادم بحضور 60 متدرباً.',
  'تمت الموافقة على المبادرة وبدء التسجيل.',
  NOW() - INTERVAL '1 day'
),
(
  'SH-1028-03',
  'خالد مصطفى علام',
  '29007081234570',
  '01098765432',
  '[]'::jsonb,
  'طلب توفير أدوات رياضية لفريق تنس الطاولة',
  'فريق الناشئين حقق المركز الأول على مستوى المنطقة ويحتاج مضارب وكرات تدريبية إضافية للاستعداد للبطولة القادمة.',
  'new',
  'youth',
  'أمانة الشباب',
  'الأنشطة الرياضية',
  'نادي شباب المستقبل',
  NULL,
  NULL,
  NOW() - INTERVAL '2 days'
)
ON CONFLICT (tracking_code) DO NOTHING;

-- أحداث السجل الزمني التجريبية (سجل "new" يُضاف تلقائياً بواسطة التريجر).
INSERT INTO public.complaint_timeline (complaint_id, status, note, actor_name, created_at)
SELECT c.id, 'under_review',
       'تم فحص أوراق الطلب وتحويله للأمانة المختصة للدراسة.',
       'م. محمود الجزار (مسؤول الأمانة)',
       c.created_at + INTERVAL '30 minutes'
FROM public.complaints c
WHERE c.tracking_code IN ('SH-1030-01', 'SH-1030-02', 'SH-1029-01')
  AND NOT EXISTS (
    SELECT 1 FROM public.complaint_timeline t
    WHERE t.complaint_id = c.id AND t.status = 'under_review'
  );

INSERT INTO public.complaint_timeline (complaint_id, status, note, actor_name, created_at)
SELECT c.id, 'in_progress',
       'جاري التنسيق الميداني والبدء في تنفيذ الحل.',
       'أ. محمد العزب (عضو الأمانة)',
       c.created_at + INTERVAL '1 hour'
FROM public.complaints c
WHERE c.tracking_code IN ('SH-1030-02', 'SH-1029-01')
  AND NOT EXISTS (
    SELECT 1 FROM public.complaint_timeline t
    WHERE t.complaint_id = c.id AND t.status = 'in_progress'
  );

INSERT INTO public.complaint_timeline (complaint_id, status, note, actor_name, created_at)
SELECT c.id, 'resolved',
       'تم إنجاز الطلب بالكامل والتأكد من إزالة أسباب الشكوى.',
       'أ. سامر التلاوي (رئيس الأمانة)',
       c.created_at + INTERVAL '3 hours'
FROM public.complaints c
WHERE c.tracking_code = 'SH-1029-01'
  AND NOT EXISTS (
    SELECT 1 FROM public.complaint_timeline t
    WHERE t.complaint_id = c.id AND t.status = 'resolved'
  );

-- إعادة تحميل مخطط PostgREST حتى تظهر الجداول والدوال الجديدة فوراً في الـ API.
NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- انتهى. بعد التسجيل الأول للمشرف العام:
--   * سجّل على /login بالبريد admin@mostaqbal-watan.org ثم أكّد رسالة البريد.
--   * تحقق من الدور:  SELECT id, email, role FROM public.profiles;
--   * إن كان تأكيد البريد معطّلاً، فعّله ثم نفّذ الترقية اليدوية:
--       UPDATE public.profiles SET role = 'admin'
--       WHERE lower(email) = lower('admin@mostaqbal-watan.org');
-- ==============================================================================

-- ============================================================================
-- 2026-11-01: نظام إداري فقط (admin-only)
--   - إزالة الأدوار المتعددة/الدعوات/المواطنين
--   - إضافة is_super_admin, username, avatar_url
--   - RPC create_admin_user / delete_admin_user (SECURITY DEFINER)
--   - حماية السوبر أدمن من الحذف
-- ============================================================================

-- 1. profiles: أعمدة جديدة
alter table public.profiles
  add column if not exists is_super_admin boolean not null default false,
  add column if not exists username text,
  add column if not exists avatar_url text;

-- 2. role: فقط 'admin'
alter table public.profiles
  drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role = 'admin');

update public.profiles set role = 'admin' where role is distinct from 'admin';

-- 3. أعمدة قديمة (اختياري: الإبقاء للتوافق، لكن الواجهة لا تستخدمها)
-- (نترك committee_id/committee_name/role_title/phone كما هي لتجنب كسر،
--  لكن الواجهة الجديدة لا تعرضها.)

-- 4. إسقاط staff_invites (لم تعد مستخدمة)
drop table if exists public.staff_invites cascade;

-- 5. إعادة كتابة handle_new_user: كل مستخدم جديد = admin عادي
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles
    (id, email, full_name, username, role, is_super_admin)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'username',
    'admin',
    false
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    username = coalesce(public.profiles.username, excluded.username),
    updated_at = now();
  return new;
end;
$$;

-- triggers already exist (on_auth_user_created, on_auth_user_confirmed); recreate to be safe
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists on_auth_user_confirmed on auth.users;
-- نبقيه but handle_new_user now idempotent; recreate
create trigger on_auth_user_confirmed
  after update of email_confirmed_at on auth.users
  for each row
  when (new.email_confirmed_at is not null and old.email_confirmed_at is null)
  execute function public.handle_new_user();

-- 6. تعيين السوبر أدمن (admin@mostaqbal-watan.org)
update public.profiles
  set is_super_admin = true
  where lower(email) = lower('admin@mostaqbal-watan.org');

-- 7. حماية السوبر أدمن: trigger يمنع حذفه أو خفض is_super_admin
create or replace function public.protect_super_admin()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    if old.is_super_admin then
      raise exception 'Cannot delete super admin';
    end if;
    return old;
  end if;
  if tg_op = 'UPDATE' then
    if old.is_super_admin and (new.is_super_admin is distinct from true) then
      raise exception 'Cannot demote super admin';
    end if;
    return new;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_super_admin_delete on public.profiles;
create trigger protect_super_admin_delete
  before delete on public.profiles
  for each row execute function public.protect_super_admin();

drop trigger if exists protect_super_admin_update on public.profiles;
create trigger protect_super_admin_update
  before update on public.profiles
  for each row execute function public.protect_super_admin();

-- 8. RPC: create_admin_user (super admin only)
create or replace function public.create_admin_user(
  p_email text,
  p_password text,
  p_full_name text default null,
  p_username text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_caller uuid := auth.uid();
  v_is_super boolean := false;
  v_new_id uuid;
begin
  -- verify caller is super admin
  select is_super_admin into v_is_super
  from public.profiles where id = v_caller;
  if not coalesce(v_is_super, false) then
    raise exception 'Only super admin can create users';
  end if;

  if p_email is null or length(trim(p_email)) = 0 then
    raise exception 'Email required';
  end if;
  if p_password is null or length(p_password) < 8 then
    raise exception 'Password must be at least 8 characters';
  end if;

  -- check existing
  if exists (select 1 from auth.users where lower(email) = lower(trim(p_email))) then
    raise exception 'User already exists';
  end if;

  v_new_id := gen_random_uuid();
  insert into auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    role, aud, created_at, updated_at, raw_user_meta_data
  ) values (
    v_new_id,
    '00000000-0000-0000-0000-000000000000',
    trim(p_email),
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(),
    'authenticated', 'authenticated', now(), now(),
    jsonb_build_object('full_name', coalesce(p_full_name, split_part(trim(p_email),'@',1)), 'username', p_username)
  );

  -- profile is created by trigger; update name/username
  update public.profiles
    set full_name = coalesce(p_full_name, full_name),
        username = coalesce(p_username, username)
    where id = v_new_id;

  return jsonb_build_object('id', v_new_id, 'email', trim(p_email));
end;
$$;

grant execute on function public.create_admin_user(text,text,text,text) to authenticated;

-- 9. RPC: delete_admin_user (super admin only, cannot delete super admin or self)
create or replace function public.delete_admin_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_is_super boolean := false;
  v_target_super boolean := false;
begin
  select is_super_admin into v_is_super from public.profiles where id = v_caller;
  if not coalesce(v_is_super, false) then
    raise exception 'Only super admin can delete users';
  end if;
  if p_user_id = v_caller then
    raise exception 'Cannot delete yourself';
  end if;
  select is_super_admin into v_target_super from public.profiles where id = p_user_id;
  if coalesce(v_target_super, false) then
    raise exception 'Cannot delete super admin';
  end if;

  delete from auth.users where id = p_user_id;
end;
$$;

grant execute on function public.delete_admin_user(uuid) to authenticated;

-- 10. RPC: update own profile (name/username/avatar)
create or replace function public.update_own_profile(
  p_full_name text default null,
  p_username text default null,
  p_avatar_url text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_caller uuid := auth.uid();
begin
  if v_caller is null then raise exception 'Not authenticated'; end if;
  update public.profiles
    set full_name = coalesce(p_full_name, full_name),
        username = coalesce(p_username, username),
        avatar_url = coalesce(p_avatar_url, avatar_url),
        updated_at = now()
    where id = v_caller;
end;
$$;
grant execute on function public.update_own_profile(text,text,text) to authenticated;

-- 11. RLS profiles
alter table public.profiles enable row level security;

drop policy if exists profiles_select_all on public.profiles;
create policy profiles_select_all on public.profiles
  for select to authenticated using (true);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and is_super_admin = (select is_super_admin from public.profiles where id = auth.uid()));

-- super admin can update any profile
drop policy if exists profiles_update_super on public.profiles;
create policy profiles_update_super on public.profiles
  for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_super_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_super_admin));

-- 12. complaints: all authenticated can read/write (no scoping). Keep existing RLS but ensure.
-- (Existing policies already allow staff; with all users admin, fine.)

-- 13. storage: avatars bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- policies
drop policy if exists avatars_public_read on storage.objects;
create policy avatars_public_read on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists avatars_upload_own on storage.objects;
create policy avatars_upload_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_update_own on storage.objects;
create policy avatars_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_delete_own on storage.objects;
create policy avatars_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- 14. reload schema
notify pgrst, 'reload schema';
