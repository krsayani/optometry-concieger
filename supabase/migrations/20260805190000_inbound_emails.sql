-- Inbound email inbox (Resend receiving webhooks → admin UI)

create table if not exists public.inbound_emails (
  id uuid primary key default gen_random_uuid(),
  resend_email_id text not null unique,
  message_id text,
  from_email text not null,
  from_name text,
  to_emails text[] not null default '{}',
  cc_emails text[] not null default '{}',
  subject text,
  text_body text,
  html_body text,
  attachments jsonb not null default '[]'::jsonb,
  is_read boolean not null default false,
  replied_at timestamptz,
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inbound_emails_received_at_idx
  on public.inbound_emails (received_at desc);
create index if not exists inbound_emails_is_read_idx
  on public.inbound_emails (is_read);
create index if not exists inbound_emails_from_email_idx
  on public.inbound_emails (from_email);

drop trigger if exists inbound_emails_touch on public.inbound_emails;
create trigger inbound_emails_touch
  before update on public.inbound_emails
  for each row execute function public.touch_updated_at();

alter table public.inbound_emails enable row level security;

drop policy if exists "inbound_emails_admin_all" on public.inbound_emails;
create policy "inbound_emails_admin_all" on public.inbound_emails
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
      and tablename = 'inbound_emails'
  ) then
    alter publication supabase_realtime add table public.inbound_emails;
  end if;
exception
  when undefined_object then
    null;
end $$;
