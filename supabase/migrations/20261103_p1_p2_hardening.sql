-- ============================================================================
-- 2026-11-03: تقوية P1/P2 (بدون تغيير نموذج الدخول)
--   - تقييد admin_remove_staff على المشرف العام
--   - منع التعديل المباشر على profiles
--   - حدود طول وتحقق صيغ في submit_complaint
--   - السماح بعدم إدخال الرقم القومي (اختياري في الواجهة)
-- ============================================================================

-- 1) دالة مساعدة (موجودة من هجرة P0، نعيد إنشاءها بأمان).
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_super_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_super_admin() from public, anon;
grant execute on function public.is_super_admin() to authenticated;

-- 2) حذف الحسابات: للمشرف العام فقط.
create or replace function public.admin_remove_staff(p_target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'غير مصرح: صلاحية المشرف العام مطلوبة' using errcode = '42501';
  end if;

  if p_target = auth.uid() then
    raise exception 'لا يمكنك حذف حسابك الحالي';
  end if;

  delete from auth.users where id = p_target;
end;
$$;

revoke all on function public.admin_remove_staff(uuid) from public, anon;
grant execute on function public.admin_remove_staff(uuid) to authenticated;

-- 3) منع تعديل profiles مباشرة عبر PostgREST (التعديل عبر RPC فقط).
revoke update on public.profiles from authenticated;

-- 4) الرقم القومي اختياري (الواجهة تسمح بتركه فارغاً).
alter table public.complaints alter column national_id drop not null;

-- 5) submit_complaint: حدود طول + تحقق هاتف/رقم قومي + حد للمرفقات.
create or replace function public.submit_complaint(
  p_citizen_name text,
  p_national_id text,
  p_primary_phone text,
  p_title text,
  p_description text,
  p_alt_contacts jsonb default '[]'::jsonb,
  p_committee_id text default 'youth',
  p_committee_name text default 'أمانة الشباب',
  p_is_confidential boolean default false,
  p_location_lat double precision default null,
  p_location_lng double precision default null,
  p_location_address text default null,
  p_attachments jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.complaints%rowtype;
begin
  if coalesce(btrim(p_citizen_name), '') = ''
    or coalesce(btrim(p_primary_phone), '') = ''
    or coalesce(btrim(p_title), '') = ''
    or coalesce(btrim(p_description), '') = '' then
    raise exception 'بيانات الطلب غير مكتملة' using errcode = '22023';
  end if;

  -- حدود الطول: تمنع إغراق الجدول بحقول ضخمة أو JSONB غير محدود.
  if length(btrim(p_citizen_name)) > 150
    or length(btrim(p_title)) > 300
    or length(btrim(p_description)) > 10000
    or length(coalesce(btrim(p_location_address), '')) > 300
    or length(btrim(p_primary_phone)) > 20
    or length(coalesce(btrim(p_national_id), '')) > 14 then
    raise exception 'تجاوز أحد الحقول الحد الأقصى للطول' using errcode = '22001';
  end if;

  if btrim(p_primary_phone) !~ '^01[0125][0-9]{8}$' then
    raise exception 'رقم الهاتف غير صالح' using errcode = '22023';
  end if;

  if coalesce(btrim(p_national_id), '') <> ''
    and btrim(p_national_id) !~ '^[0-9]{14}$' then
    raise exception 'الرقم القومي غير صالح' using errcode = '22023';
  end if;

  if jsonb_typeof(coalesce(p_alt_contacts, '[]'::jsonb)) <> 'array'
    or jsonb_array_length(coalesce(p_alt_contacts, '[]'::jsonb)) > 5 then
    raise exception 'بيانات التواصل الإضافية غير صالحة' using errcode = '22023';
  end if;

  if jsonb_typeof(coalesce(p_attachments, '[]'::jsonb)) <> 'array'
    or jsonb_array_length(coalesce(p_attachments, '[]'::jsonb)) > 5 then
    raise exception 'عدد المرفقات غير صالح' using errcode = '22023';
  end if;

  insert into public.complaints (
    citizen_id, citizen_name, national_id, primary_phone, alt_contacts,
    title, description, status, priority,
    committee_id, committee_name, is_confidential,
    location_lat, location_lng, location_address,
    attachments, admin_notes, public_response
  ) values (
    auth.uid(),
    btrim(p_citizen_name),
    nullif(btrim(p_national_id), ''),
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
    null,
    null
  )
  returning * into v_row;

  return to_jsonb(v_row);
end;
$$;

revoke all on function public.submit_complaint(
  text, text, text, text, text, jsonb, text, text, boolean,
  double precision, double precision, text, jsonb
) from public;
grant execute on function public.submit_complaint(
  text, text, text, text, text, jsonb, text, text, boolean,
  double precision, double precision, text, jsonb
) to anon, authenticated;

notify pgrst, 'reload schema';
