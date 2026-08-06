-- Multiple contacts per school for outreach tracker

create table if not exists public.school_outreach_contacts (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.school_outreach_schools (id) on delete cascade,
  name text not null,
  role text,
  email text,
  phone text,
  notes text,
  is_primary boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists school_outreach_contacts_school_id_idx
  on public.school_outreach_contacts (school_id);
create index if not exists school_outreach_contacts_email_idx
  on public.school_outreach_contacts (email);

-- At most one primary contact per school
create unique index if not exists school_outreach_contacts_one_primary_idx
  on public.school_outreach_contacts (school_id)
  where is_primary;

drop trigger if exists school_outreach_contacts_touch on public.school_outreach_contacts;
create trigger school_outreach_contacts_touch
  before update on public.school_outreach_contacts
  for each row execute function public.touch_updated_at();

alter table public.school_outreach_contacts enable row level security;

drop policy if exists "school_outreach_contacts_admin_all" on public.school_outreach_contacts;
create policy "school_outreach_contacts_admin_all" on public.school_outreach_contacts
  for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'school_outreach_contacts'
  ) then
    alter publication supabase_realtime add table public.school_outreach_contacts;
  end if;
exception
  when undefined_object then
    null;
end $$;

-- Backfill from existing school columns (idempotent)
insert into public.school_outreach_contacts (
  school_id, name, role, email, phone, notes, is_primary, sort_order
)
select
  s.id,
  coalesce(nullif(trim(s.primary_contact_name), ''), s.short_name || ' contact'),
  s.primary_target_role,
  s.primary_email,
  s.phone,
  null,
  true,
  0
from public.school_outreach_schools s
where (
  coalesce(nullif(trim(s.primary_contact_name), ''), '') <> ''
  or coalesce(nullif(trim(s.primary_email), ''), '') <> ''
  or coalesce(nullif(trim(s.phone), ''), '') <> ''
)
and not exists (
  select 1
  from public.school_outreach_contacts c
  where c.school_id = s.id
);

insert into public.school_outreach_contacts (
  school_id, name, role, email, phone, notes, is_primary, sort_order
)
select
  s.id,
  left(trim(s.secondary_contact), 200),
  'Secondary / Dean',
  null,
  null,
  s.secondary_contact,
  false,
  1
from public.school_outreach_schools s
where coalesce(nullif(trim(s.secondary_contact), ''), '') <> ''
and not exists (
  select 1
  from public.school_outreach_contacts c
  where c.school_id = s.id
    and c.is_primary = false
    and c.notes is not distinct from s.secondary_contact
);
