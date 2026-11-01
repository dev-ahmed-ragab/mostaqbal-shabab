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
