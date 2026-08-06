-- Parse emails already listed in secondary contact blobs into proper contact rows.

-- Helper: extract first email from a string
create or replace function public._outreach_first_email(raw text)
returns text
language sql
immutable
as $$
  select nullif(
    (regexp_match(coalesce(raw, ''), '[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}'))[1],
    ''
  );
$$;

-- Clean name portion before the email
create or replace function public._outreach_name_before_email(raw text)
returns text
language plpgsql
immutable
as $$
declare
  email text;
  before text;
begin
  email := public._outreach_first_email(raw);
  if email is null then
    return nullif(trim(raw), '');
  end if;
  before := trim(split_part(raw, email, 1));
  before := regexp_replace(before, '^Student Affairs:\s*', '', 'i');
  before := regexp_replace(before, '[–—\-|:·•,]+\s*$', '', 'g');
  before := regexp_replace(before, '\s+', ' ', 'g');
  -- Drop trailing ", Role" for cleaner name when present
  if before ~ ', ' and before !~* '^dr\.?\s' then
    before := trim(split_part(before, ',', 1));
  end if;
  -- Strip common title prefixes into just the person name
  before := regexp_replace(
    before,
    '^(Interim Dean|Assoc\.?\s*Dean\/Academics|Assoc\.?\s*Dean for Students|Assoc\.?\s*Dean|Dean|President)\s+',
    '',
    'i'
  );
  return nullif(trim(before), '');
end;
$$;

create or replace function public._outreach_role_before_email(raw text)
returns text
language plpgsql
immutable
as $$
declare
  email text;
  before text;
  role text;
begin
  email := public._outreach_first_email(raw);
  before := trim(split_part(coalesce(raw, ''), coalesce(email, '@@@'), 1));
  before := regexp_replace(before, '[–—\-|:·•,]+\s*$', '', 'g');

  if before ~ ', ' then
    role := trim(substring(before from position(', ' in before) + 2));
    if role <> '' and length(role) < 80 then
      return role;
    end if;
  end if;

  if before ~* '^(Interim Dean)\b' then return 'Interim Dean'; end if;
  if before ~* '^(Assoc\.?\s*Dean\/Academics)\b' then return 'Assoc. Dean/Academics'; end if;
  if before ~* '^(Assoc\.?\s*Dean for Students)\b' then return 'Assoc. Dean for Students'; end if;
  if before ~* '^(Assoc\.?\s*Dean)\b' then return 'Assoc. Dean'; end if;
  if before ~* '^(Dean)\b' then return 'Dean'; end if;
  if before ~* '^(President)\b' then return 'President'; end if;
  return 'Secondary contact';
end;
$$;

-- Fill missing emails on non-primary contacts from name/notes
update public.school_outreach_contacts c
set
  email = public._outreach_first_email(coalesce(c.notes, c.name)),
  name = coalesce(
    public._outreach_name_before_email(coalesce(c.notes, c.name)),
    c.name
  ),
  role = case
    when c.role in ('Secondary / Dean', 'Secondary contact', null, '')
      then public._outreach_role_before_email(coalesce(c.notes, c.name))
    else c.role
  end
where c.is_primary = false
  and coalesce(nullif(trim(c.email), ''), '') = ''
  and public._outreach_first_email(coalesce(c.notes, c.name)) is not null;

-- UC Berkeley: second person listed in the secondary blob
insert into public.school_outreach_contacts (
  school_id, name, role, email, notes, is_primary, sort_order
)
select
  s.id,
  'Morgan McClure',
  'Student Affairs',
  'morgan.mcclure@berkeley.edu',
  s.secondary_contact,
  false,
  2
from public.school_outreach_schools s
where s.short_name = 'UC Berkeley'
  and coalesce(s.secondary_contact, '') ilike '%morgan.mcclure@berkeley.edu%'
  and not exists (
    select 1
    from public.school_outreach_contacts c
    where c.school_id = s.id
      and lower(c.email) = 'morgan.mcclure@berkeley.edu'
  );

-- Keep legacy secondary_contact summary in sync with first non-primary contact
update public.school_outreach_schools s
set secondary_contact = sub.summary
from (
  select distinct on (c.school_id)
    c.school_id,
    concat_ws(' · ', c.name, nullif(c.role, ''), nullif(c.email, '')) as summary
  from public.school_outreach_contacts c
  where c.is_primary = false
  order by c.school_id, c.sort_order, c.created_at
) sub
where s.id = sub.school_id;

drop function if exists public._outreach_first_email(text);
drop function if exists public._outreach_name_before_email(text);
drop function if exists public._outreach_role_before_email(text);
