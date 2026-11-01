-- ==============================================================================
-- هجرة أمنية: مصادقة Supabase + الأدوار + تشديد RLS
-- تاريخ: 2026-10-30
--
-- نفّذ هذا الملف في Supabase SQL Editor بعد إنشاء الجداول الأساسية.
-- الملف idempotent ويمكن تشغيله أكثر من مرة بأمان.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. جدول الملفات الشخصية (المصدر الوحيد للدور والصلاحيات)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'citizen'
    CHECK (role IN ('admin', 'committee_head', 'executive_member', 'member', 'citizen')),
  committee_id TEXT DEFAULT 'youth',
  committee_name TEXT DEFAULT 'لجنة رعاية الشباب',
  role_title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(lower(email));

-- ------------------------------------------------------------------------------
-- 2. جدول دعوات الصلاحيات (لا يمنح الدور إلا بعد تأكيد البريد)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.staff_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL
    CHECK (role IN ('admin', 'committee_head', 'executive_member', 'member')),
  committee_id TEXT DEFAULT 'youth',
  committee_name TEXT DEFAULT 'لجنة رعاية الشباب',
  role_title TEXT,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_invites_email ON public.staff_invites(lower(email));

-- ------------------------------------------------------------------------------
-- 3. دوال التحقق من الدور (SECURITY DEFINER لتفادي تكرار RLS)
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
-- 4. تحديث updated_at للملفات الشخصية
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

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ------------------------------------------------------------------------------
-- 5. إنشاء/تحديث الملف الشخصي تلقائياً عند تسجيل مستخدم جديد
--    الدور لا يُقرأ من user_metadata إطلاقاً.
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
  v_committee_name TEXT := 'لجنة رعاية الشباب';
  v_role_title TEXT := NULL;
  v_has_invite BOOLEAN := false;
BEGIN
  -- لا نطبّق أي دعوة قبل تأكيد البريد الإلكتروني.
  IF NEW.email_confirmed_at IS NOT NULL THEN
    SELECT * INTO v_invite
    FROM public.staff_invites
    WHERE lower(email) = lower(NEW.email)
    LIMIT 1;

    IF FOUND THEN
      v_has_invite := true;
      v_role := v_invite.role;
      v_committee_id := coalesce(v_invite.committee_id, 'youth');
      v_committee_name := coalesce(v_invite.committee_name, 'لجنة رعاية الشباب');
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
-- 6. حماية آخر مشرف عام من الإزالة أو خفض الدور
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
-- 7. تعبئة الملفات الشخصية للمستخدمين الحاليين
-- ------------------------------------------------------------------------------
INSERT INTO public.profiles (id, email, full_name)
SELECT
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- تطبيق أي دعوات سابقة على الحسابات المؤكدة فقط.
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
-- 8. دعوات تأسيسية: المشرف العام ورئيس لجنة رعاية الشباب
--    مهم: يجب أن يكون تأكيد البريد الإلكتروني مفعّلاً في Supabase Auth.
-- ------------------------------------------------------------------------------
INSERT INTO public.staff_invites
  (email, role, committee_id, committee_name, role_title)
VALUES
  (
    'admin@mostaqbal-watan.org',
    'admin',
    'all',
    'كافة لجان حزب مستقبل وطن',
    'أمين التنظيم (المشرف العام)'
  ),
  (
    'samer.talawe@mostaqbal-watan.org',
    'committee_head',
    'youth',
    'لجنة رعاية الشباب',
    'رئيس لجنة رعاية الشباب'
  )
ON CONFLICT (email) DO UPDATE
SET
  role = excluded.role,
  committee_id = excluded.committee_id,
  committee_name = excluded.committee_name,
  role_title = excluded.role_title;

DELETE FROM public.staff_invites i
USING public.profiles p
WHERE lower(i.email) = lower(p.email) AND p.role <> 'citizen';

-- ------------------------------------------------------------------------------
-- 9. ربط الشكاوى بالحساب + الأعمدة التي يستخدمها التطبيق
-- ------------------------------------------------------------------------------
ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS citizen_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS committee_id TEXT DEFAULT 'youth';
ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS committee_name TEXT DEFAULT 'لجنة رعاية الشباب';
ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS is_confidential BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';
ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS wants_promotion BOOLEAN DEFAULT false;
ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS promotion_role TEXT;
ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS public_response TEXT;

ALTER TABLE public.complaint_timeline
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true;

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

CREATE INDEX IF NOT EXISTS idx_complaints_citizen_id ON public.complaints(citizen_id);
CREATE INDEX IF NOT EXISTS idx_complaints_committee_id ON public.complaints(committee_id);

-- السجل الزمني الأولي يُضاف تلقائياً بدل السماح للعميل بالكتابة فيه.
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
-- 10. تشديد سياسات RLS
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_timeline ENABLE ROW LEVEL SECURITY;

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

-- الدعوات: للمشرف العام فقط (لا قراءة عامة، حتى لا تُكشف البدايات).
DROP POLICY IF EXISTS "staff_invites_admin_all" ON public.staff_invites;
CREATE POLICY "staff_invites_admin_all"
  ON public.staff_invites FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- الشكاوى: إزالة السياسات القديمة المفتوحة
DROP POLICY IF EXISTS "Allow public insert to complaints" ON public.complaints;
DROP POLICY IF EXISTS "Allow public select on complaints" ON public.complaints;
DROP POLICY IF EXISTS "Allow authenticated update to complaints" ON public.complaints;

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
DROP POLICY IF EXISTS "Allow public insert to complaints" ON public.complaints;
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

-- السجل الزمني
DROP POLICY IF EXISTS "Allow public select on timeline" ON public.complaint_timeline;
DROP POLICY IF EXISTS "Allow all insert on timeline" ON public.complaint_timeline;

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
-- 11. RPCs للاستعلام العام الآمن وإدارة الحسابات
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
  p_committee_name TEXT DEFAULT 'لجنة رعاية الشباب',
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
    coalesce(nullif(btrim(p_committee_name), ''), 'لجنة رعاية الشباب'),
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
-- 12. سياسات التخزين (المرفقات)
--    نُبقي الرفع متاحاً للزوار (تقديم بدون حساب) والقراءة عامة للصور المرجعية.
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

-- إعادة تحميل مخطط PostgREST حتى تظهر الجداول والدوال الجديدة فوراً في الـ API.
NOTIFY pgrst, 'reload schema';

-- ------------------------------------------------------------------------------
-- 13. (اختياري) ترقية أول حساب مشرف بعد التسجيل يدوياً:
--     UPDATE public.profiles SET role = 'admin'
--     WHERE lower(email) = lower('admin@mostaqbal-watan.org');
-- ------------------------------------------------------------------------------
