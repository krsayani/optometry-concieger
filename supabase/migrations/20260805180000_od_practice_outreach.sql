-- OD + Practice outreach trackers (super-admin only)

create table if not exists public.od_outreach_contacts (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null default '',
  email text,
  phone text,
  school text,
  city text,
  state text,
  class_year text,
  owner text not null default 'Bilal' check (owner in ('Bilal', 'Karim')),
  status text not null default 'Not started'
    check (status in (
      'Not started', 'Emailed', 'Follow-up sent', 'Replied',
      'Interested', 'Signed up', 'Declined', 'No response'
    )),
  date_emailed date,
  follow_up_date date,
  reply text,
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.practice_outreach_contacts (
  id uuid primary key default gen_random_uuid(),
  practice_name text not null,
  contact_name text,
  email text,
  phone text,
  location text,
  practice_type text,
  owner text not null default 'Bilal' check (owner in ('Bilal', 'Karim')),
  status text not null default 'Not started'
    check (status in (
      'Not started', 'Emailed', 'Follow-up sent', 'Replied',
      'Interested', 'Signed up', 'Declined', 'No response'
    )),
  date_emailed date,
  follow_up_date date,
  reply text,
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists od_outreach_contacts_status_idx
  on public.od_outreach_contacts (status);
create index if not exists od_outreach_contacts_owner_idx
  on public.od_outreach_contacts (owner);
create index if not exists practice_outreach_contacts_status_idx
  on public.practice_outreach_contacts (status);
create index if not exists practice_outreach_contacts_owner_idx
  on public.practice_outreach_contacts (owner);

drop trigger if exists od_outreach_contacts_touch on public.od_outreach_contacts;
create trigger od_outreach_contacts_touch
  before update on public.od_outreach_contacts
  for each row execute function public.touch_updated_at();

drop trigger if exists practice_outreach_contacts_touch on public.practice_outreach_contacts;
create trigger practice_outreach_contacts_touch
  before update on public.practice_outreach_contacts
  for each row execute function public.touch_updated_at();

alter table public.od_outreach_contacts enable row level security;
alter table public.practice_outreach_contacts enable row level security;

drop policy if exists "od_outreach_contacts_admin_all" on public.od_outreach_contacts;
create policy "od_outreach_contacts_admin_all" on public.od_outreach_contacts
  for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "practice_outreach_contacts_admin_all" on public.practice_outreach_contacts;
create policy "practice_outreach_contacts_admin_all" on public.practice_outreach_contacts
  for all
  using (public.is_super_admin())
  with check (public.is_super_admin());
