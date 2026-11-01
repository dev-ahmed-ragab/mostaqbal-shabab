-- ============================================================================
-- 2026-11-01: توحيد المنظومة حول "أمانة الشباب"
--   - إعادة تسمية لجنة رعاية الشباب / لجنة الشباب إلى أمانة الشباب.
--   - توحيد كافة السجلات على أمانة واحدة (committee_id = 'youth').
-- ============================================================================

-- 1. القيم الافتراضية للأعمدة
alter table public.profiles
  alter column committee_name set default 'أمانة الشباب';

alter table public.complaints
  alter column committee_name set default 'أمانة الشباب';

alter table public.complaint_timeline
  alter column actor_name set default 'أمانة الشباب';

-- 2. الملفات الشخصية: أمانة واحدة فقط
update public.profiles
set
  committee_id = 'youth',
  committee_name = 'أمانة الشباب',
  role_title = case
    when role_title in ('رئيس لجنة رعاية الشباب', 'رئيس لجنة الشباب', 'أمين رعاية الشباب') then 'رئيس أمانة الشباب'
    when role_title in ('مقرر لجنة رعاية الشباب', 'مقرر لجنة الشباب', 'أمين مساعد تنفيذي') then 'مقرر أمانة الشباب'
    when role_title in ('عضو لجنة رعاية الشباب', 'عضو لجنة الشباب') then 'عضو أمانة الشباب'
    else role_title
  end
where committee_id is distinct from 'youth'
   or committee_name is distinct from 'أمانة الشباب'
   or role_title in (
     'رئيس لجنة رعاية الشباب', 'رئيس لجنة الشباب', 'أمين رعاية الشباب',
     'مقرر لجنة رعاية الشباب', 'مقرر لجنة الشباب', 'أمين مساعد تنفيذي',
     'عضو لجنة رعاية الشباب', 'عضو لجنة الشباب'
   );

-- 3. الشكاوى: توحيد الأمانة والأسماء القديمة
update public.complaints
set committee_name = 'أمانة الشباب'
where committee_name is null
   or committee_name in (
     'لجنة رعاية الشباب',
     'لجنة الشباب',
     'أمانة رعاية الشباب',
     'لجنة خدمة المواطنين والتضامن الاجتماعي'
   );

update public.complaints
set committee_id = 'youth'
where committee_id is distinct from 'youth';

-- 4. السجل الزمني: تحديث أسماء الفاعلين القديمة
update public.complaint_timeline
set actor_name = replace(
      replace(
        replace(actor_name, 'لجنة رعاية الشباب', 'أمانة الشباب'),
        'أمانة رعاية الشباب',
        'أمانة الشباب'
      ),
      'اللجنة',
      'أمانة الشباب'
    )
where actor_name like '%لجنة%' or actor_name like '%اللجنة%' or actor_name like '%أمانة رعاية الشباب%';

notify pgrst, 'reload schema';
