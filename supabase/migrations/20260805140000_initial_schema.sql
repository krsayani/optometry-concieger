-- Optometry Concierge — initial schema for fresh Supabase projects
-- Idempotent where practical (safe to re-run).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Roles enum
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('employer', 'od', 'super_admin');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  email_verified boolean not null default false,
  status text not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email_verified)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.email_confirmed_at is not null, false)
  )
  on conflict (id) do update
    set full_name = coalesce(excluded.full_name, public.profiles.full_name),
        email_verified = excluded.email_verified,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_user_email_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email_confirmed_at is not null
     and (old.email_confirmed_at is distinct from new.email_confirmed_at) then
    update public.profiles
      set email_verified = true,
          updated_at = now()
    where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_confirmed on auth.users;
create trigger on_auth_user_email_confirmed
  after update of email_confirmed_at on auth.users
  for each row execute function public.handle_user_email_confirmed();

-- ---------------------------------------------------------------------------
-- User roles
-- ---------------------------------------------------------------------------
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create index if not exists user_roles_user_id_idx on public.user_roles (user_id);

-- ---------------------------------------------------------------------------
-- Helper: is current user a super admin / active?
-- ---------------------------------------------------------------------------
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'super_admin'
  );
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select status = 'Active'
      from public.profiles
      where id = auth.uid()
    ),
    true
  );
$$;

-- ---------------------------------------------------------------------------
-- OD intake
-- ---------------------------------------------------------------------------
create table if not exists public.od_intake_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade,
  first_name text,
  last_name text,
  email text,
  phone text,
  school text,
  other_school text,
  grad_year text,
  license_status text,
  license_states text,
  years_in_practice text,
  completed_residency text,
  residency_type text,
  preferred_states text[],
  preferred_cities text,
  open_to_relocation text,
  practice_setting text[],
  practice_type_preference text,
  clinical_interests text[],
  salary_expectation text,
  target_start_date text,
  job_priorities text[],
  interest_in_ownership text,
  anything_else text,
  position_type text,
  consent boolean default false,
  resume_url text,
  status text not null default 'Profile Created',
  admin_notes text,
  status_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists od_intake_user_id_idx on public.od_intake_responses (user_id);
create index if not exists od_intake_created_at_idx on public.od_intake_responses (created_at desc);

-- ---------------------------------------------------------------------------
-- Employer / practice intake
-- ---------------------------------------------------------------------------
create table if not exists public.employer_intake_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade,
  contact_name text,
  practice_name text,
  email text,
  phone text,
  location text,
  practice_type text,
  num_ods text,
  position_type text,
  salary_range text,
  production_bonus text,
  sign_on_bonus text,
  relocation_assistance text,
  benefits text[],
  schedule text,
  patient_volume text,
  primary_care_type text[],
  new_grad_friendly text,
  mentorship_available text,
  equipment_tech text,
  ownership_track text,
  urgency text,
  anything_else text,
  consent boolean default false,
  status text not null default 'Request Received',
  admin_notes text,
  status_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employer_intake_user_id_idx on public.employer_intake_responses (user_id);
create index if not exists employer_intake_created_at_idx on public.employer_intake_responses (created_at desc);

-- ---------------------------------------------------------------------------
-- Concierge matches
-- ---------------------------------------------------------------------------
create table if not exists public.concierge_matches (
  id uuid primary key default gen_random_uuid(),
  od_intake_id uuid not null references public.od_intake_responses (id) on delete cascade,
  employer_intake_id uuid not null references public.employer_intake_responses (id) on delete cascade,
  status text not null default 'Potential Match',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (od_intake_id, employer_intake_id)
);

create index if not exists concierge_matches_created_at_idx
  on public.concierge_matches (created_at desc);

-- ---------------------------------------------------------------------------
-- Admin notifications
-- ---------------------------------------------------------------------------
create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  is_read boolean not null default false,
  user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists admin_notifications_created_at_idx
  on public.admin_notifications (created_at desc);

-- ---------------------------------------------------------------------------
-- Legacy jobs / applications (still referenced by services)
-- ---------------------------------------------------------------------------
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  category text,
  date date,
  location text,
  rate numeric,
  status text not null default 'Open',
  created_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  provider_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'Pending',
  applied_at timestamptz not null default now(),
  unique (job_id, provider_id)
);

-- ---------------------------------------------------------------------------
-- Status / updated_at helpers
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.touch_status_updated_at()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    new.status_updated_at = now();
  end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists od_intake_status_touch on public.od_intake_responses;
create trigger od_intake_status_touch
  before update on public.od_intake_responses
  for each row execute function public.touch_status_updated_at();

drop trigger if exists employer_intake_status_touch on public.employer_intake_responses;
create trigger employer_intake_status_touch
  before update on public.employer_intake_responses
  for each row execute function public.touch_status_updated_at();

drop trigger if exists matches_touch on public.concierge_matches;
create trigger matches_touch
  before update on public.concierge_matches
  for each row execute function public.touch_updated_at();

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Admin notification triggers on intake insert
-- ---------------------------------------------------------------------------
create or replace function public.notify_admin_od_intake()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admin_notifications (title, content, user_id)
  values (
    'New OD profile submitted',
    coalesce(new.first_name, '') || ' ' || coalesce(new.last_name, '')
      || ' submitted a career profile'
      || case when new.email is not null then ' (' || new.email || ')' else '' end
      || '.',
    new.user_id
  );
  return new;
end;
$$;

create or replace function public.notify_admin_employer_intake()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admin_notifications (title, content, user_id)
  values (
    'New practice hiring request',
    coalesce(new.practice_name, 'A practice')
      || ' submitted a hiring request'
      || case when new.email is not null then ' (' || new.email || ')' else '' end
      || '.',
    new.user_id
  );
  return new;
end;
$$;

drop trigger if exists od_intake_notify on public.od_intake_responses;
create trigger od_intake_notify
  after insert on public.od_intake_responses
  for each row execute function public.notify_admin_od_intake();

drop trigger if exists employer_intake_notify on public.employer_intake_responses;
create trigger employer_intake_notify
  after insert on public.employer_intake_responses
  for each row execute function public.notify_admin_employer_intake();

-- ---------------------------------------------------------------------------
-- RPCs used by the app
-- ---------------------------------------------------------------------------
create or replace function public.ensure_user_role(
  target_user_id uuid,
  target_role public.app_role
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is distinct from target_user_id and not public.is_super_admin() then
    raise exception 'Not allowed to assign roles for other users';
  end if;

  insert into public.user_roles (user_id, role)
  values (target_user_id, target_role)
  on conflict (user_id, role) do nothing;
end;
$$;

create or replace function public.check_auth_user_exists(email_input text)
returns boolean
language sql
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from auth.users
    where lower(email) = lower(trim(email_input))
  );
$$;

create or replace function public.delete_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Only super admins can delete users';
  end if;

  delete from auth.users where id = target_user_id;
end;
$$;

grant execute on function public.ensure_user_role(uuid, public.app_role) to authenticated;
grant execute on function public.check_auth_user_exists(text) to anon, authenticated;
grant execute on function public.delete_user(uuid) to authenticated;
grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.is_active_user() to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.od_intake_responses enable row level security;
alter table public.employer_intake_responses enable row level security;
alter table public.concierge_matches enable row level security;
alter table public.admin_notifications enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;

-- Profiles
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_super_admin());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
  for update to authenticated
  using ((id = auth.uid() and public.is_active_user()) or public.is_super_admin())
  with check ((id = auth.uid() and public.is_active_user()) or public.is_super_admin());

-- User roles
drop policy if exists "roles_select_own_or_admin" on public.user_roles;
create policy "roles_select_own_or_admin" on public.user_roles
  for select to authenticated
  using (user_id = auth.uid() or public.is_super_admin());

drop policy if exists "roles_insert_admin" on public.user_roles;
create policy "roles_insert_admin" on public.user_roles
  for insert to authenticated
  with check (public.is_super_admin() or user_id = auth.uid());

drop policy if exists "roles_delete_admin" on public.user_roles;
create policy "roles_delete_admin" on public.user_roles
  for delete to authenticated
  using (public.is_super_admin());

-- OD intakes
drop policy if exists "od_intake_select" on public.od_intake_responses;
create policy "od_intake_select" on public.od_intake_responses
  for select to authenticated
  using (user_id = auth.uid() or public.is_super_admin());

drop policy if exists "od_intake_insert" on public.od_intake_responses;
create policy "od_intake_insert" on public.od_intake_responses
  for insert to authenticated
  with check ((user_id = auth.uid() and public.is_active_user()) or public.is_super_admin());

drop policy if exists "od_intake_update" on public.od_intake_responses;
create policy "od_intake_update" on public.od_intake_responses
  for update to authenticated
  using ((user_id = auth.uid() and public.is_active_user()) or public.is_super_admin())
  with check ((user_id = auth.uid() and public.is_active_user()) or public.is_super_admin());

drop policy if exists "od_intake_delete" on public.od_intake_responses;
create policy "od_intake_delete" on public.od_intake_responses
  for delete to authenticated
  using (user_id = auth.uid() or public.is_super_admin());

-- Employer intakes
drop policy if exists "employer_intake_select" on public.employer_intake_responses;
create policy "employer_intake_select" on public.employer_intake_responses
  for select to authenticated
  using (user_id = auth.uid() or public.is_super_admin());

drop policy if exists "employer_intake_insert" on public.employer_intake_responses;
create policy "employer_intake_insert" on public.employer_intake_responses
  for insert to authenticated
  with check ((user_id = auth.uid() and public.is_active_user()) or public.is_super_admin());

drop policy if exists "employer_intake_update" on public.employer_intake_responses;
create policy "employer_intake_update" on public.employer_intake_responses
  for update to authenticated
  using ((user_id = auth.uid() and public.is_active_user()) or public.is_super_admin())
  with check ((user_id = auth.uid() and public.is_active_user()) or public.is_super_admin());

drop policy if exists "employer_intake_delete" on public.employer_intake_responses;
create policy "employer_intake_delete" on public.employer_intake_responses
  for delete to authenticated
  using (user_id = auth.uid() or public.is_super_admin());

-- Matches — admin only
drop policy if exists "matches_admin_all" on public.concierge_matches;
create policy "matches_admin_all" on public.concierge_matches
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- Notifications — admin only
drop policy if exists "notifications_admin_all" on public.admin_notifications;
create policy "notifications_admin_all" on public.admin_notifications
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- Jobs
drop policy if exists "jobs_select_authenticated" on public.jobs;
create policy "jobs_select_authenticated" on public.jobs
  for select to authenticated
  using (true);

drop policy if exists "jobs_insert_own" on public.jobs;
create policy "jobs_insert_own" on public.jobs
  for insert to authenticated
  with check (client_id = auth.uid() and public.is_active_user());

drop policy if exists "jobs_update_own_or_admin" on public.jobs;
create policy "jobs_update_own_or_admin" on public.jobs
  for update to authenticated
  using (client_id = auth.uid() or public.is_super_admin())
  with check (client_id = auth.uid() or public.is_super_admin());

drop policy if exists "jobs_delete_own_or_admin" on public.jobs;
create policy "jobs_delete_own_or_admin" on public.jobs
  for delete to authenticated
  using (client_id = auth.uid() or public.is_super_admin());

-- Applications
drop policy if exists "applications_select" on public.applications;
create policy "applications_select" on public.applications
  for select to authenticated
  using (
    provider_id = auth.uid()
    or public.is_super_admin()
    or exists (
      select 1 from public.jobs j
      where j.id = applications.job_id and j.client_id = auth.uid()
    )
  );

drop policy if exists "applications_insert_own" on public.applications;
create policy "applications_insert_own" on public.applications
  for insert to authenticated
  with check (provider_id = auth.uid() and public.is_active_user());

drop policy if exists "applications_update" on public.applications;
create policy "applications_update" on public.applications
  for update to authenticated
  using (
    public.is_super_admin()
    or exists (
      select 1 from public.jobs j
      where j.id = applications.job_id and j.client_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
do $$
begin
  begin
    alter publication supabase_realtime add table public.profiles;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.user_roles;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.od_intake_responses;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.employer_intake_responses;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.concierge_matches;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.admin_notifications;
  exception when duplicate_object then null;
  end;
end $$;

-- ---------------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('resumes', 'resumes', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_auth_upload" on storage.objects;
create policy "avatars_auth_upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_auth_update" on storage.objects;
create policy "avatars_auth_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_auth_delete" on storage.objects;
create policy "avatars_auth_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_super_admin())
  );

drop policy if exists "resumes_public_read" on storage.objects;
create policy "resumes_public_read" on storage.objects
  for select
  using (bucket_id = 'resumes');

drop policy if exists "resumes_auth_upload" on storage.objects;
create policy "resumes_auth_upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "resumes_auth_update" on storage.objects;
create policy "resumes_auth_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "resumes_auth_delete" on storage.objects;
create policy "resumes_auth_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'resumes'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_super_admin())
  );
