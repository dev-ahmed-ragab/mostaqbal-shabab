-- ============================================================================
-- 2026-11-02: تقوية المصادقة (P0)
--   - منع أي تسجيل ذاتي من الحصول على صلاحية إدارية
--   - عدم إنشاء profile تلقائياً إلا للحسابات المُنشأة إدارياً
--   - تقييد قراءة profiles على صاحب الصف أو السوبر أدمن
-- ============================================================================

-- 1) دالة مساعدة لتفادي recursion داخل سياسات profiles
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

-- 2) handle_new_user: لا يُنشئ profile إلا لحساب وُسم صراحةً بأنه مُنشأ إدارياً.
--    raw_app_meta_data لا يمكن للعميل تعديله (service_role فقط).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.raw_app_meta_data->>'provisioned_by', '') <> 'admin' then
    -- تسجيل ذاتي أو حساب غير مُعتمد: لا profile، وبالتالي لا صلاحيات.
    return new;
  end if;

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

-- 3) create_admin_user: وسم الحساب الجديد حتى يمرّ من handle_new_user
create or replace function public.create_admin_user(
  p_email text,
  p_password text,
  p_full_name text default null,
  p_username text default null
)
returns jsonb
language plpgsql
security definer
set search_path = extensions, public
as $$
declare
  v_caller uuid := auth.uid();
  v_is_super boolean := false;
  v_new_id uuid;
begin
  select is_super_admin into v_is_super
  from public.profiles where id = v_caller;

  if not coalesce(v_is_super, false) then
    raise exception 'Only super admin can create users' using errcode = '42501';
  end if;

  if p_email is null or length(trim(p_email)) = 0 then
    raise exception 'Email required';
  end if;
  if p_password is null or length(p_password) < 12 then
    raise exception 'Password must be at least 12 characters';
  end if;

  if exists (
    select 1 from auth.users where lower(email) = lower(trim(p_email))
  ) then
    raise exception 'User already exists';
  end if;

  v_new_id := gen_random_uuid();

  insert into auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    role, aud, created_at, updated_at,
    raw_user_meta_data, raw_app_meta_data
  ) values (
    v_new_id,
    '00000000-0000-0000-0000-000000000000',
    trim(p_email),
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(),
    'authenticated', 'authenticated', now(), now(),
    jsonb_build_object(
      'full_name', coalesce(p_full_name, split_part(trim(p_email), '@', 1)),
      'username', p_username
    ),
    jsonb_build_object('provisioned_by', 'admin')
  );

  update public.profiles
    set full_name = coalesce(p_full_name, full_name),
        username = coalesce(p_username, username)
    where id = v_new_id;

  return jsonb_build_object('id', v_new_id, 'email', trim(p_email));
end;
$$;

revoke all on function public.create_admin_user(text, text, text, text) from public, anon;
grant execute on function public.create_admin_user(text, text, text, text) to authenticated;

-- 4) profiles: كل مستخدم يقرأ صفّه فقط، والسوبر أدمن يقرأ الجميع.
drop policy if exists profiles_select_all on public.profiles;
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_super_admin());

-- 5) إبقاء الحسابات القديمة التي لا تملك profile خارج اللوحة.
--    (لا نحذف شيئاً — فقط نضمن أن غياب profile لا يمنح صلاحية.)

-- 6) تدقيق يدوي بعد التطبيق: راجع كل حساب أُنشئ بعد تاريخ النشر.
--    select p.id, p.email, p.is_super_admin, p.created_at
--    from public.profiles p
--    order by p.created_at desc;
--
--    لحذف حساب مشبوه (استبدل <UUID>):
--    delete from auth.users where id = '<UUID>';

