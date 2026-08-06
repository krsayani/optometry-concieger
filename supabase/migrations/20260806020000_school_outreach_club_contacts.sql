-- Multiple contacts per private practice club for outreach tracker

create table if not exists public.school_outreach_club_contacts (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.school_outreach_clubs (id) on delete cascade,
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

create index if not exists school_outreach_club_contacts_club_id_idx
  on public.school_outreach_club_contacts (club_id);
create index if not exists school_outreach_club_contacts_email_idx
  on public.school_outreach_club_contacts (email);

create unique index if not exists school_outreach_club_contacts_one_primary_idx
  on public.school_outreach_club_contacts (club_id)
  where is_primary;

drop trigger if exists school_outreach_club_contacts_touch on public.school_outreach_club_contacts;
create trigger school_outreach_club_contacts_touch
  before update on public.school_outreach_club_contacts
  for each row execute function public.touch_updated_at();

alter table public.school_outreach_club_contacts enable row level security;

drop policy if exists "school_outreach_club_contacts_admin_all" on public.school_outreach_club_contacts;
create policy "school_outreach_club_contacts_admin_all" on public.school_outreach_club_contacts
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
      and tablename = 'school_outreach_club_contacts'
  ) then
    alter publication supabase_realtime add table public.school_outreach_club_contacts;
  end if;
exception
  when undefined_object then
    null;
end $$;
