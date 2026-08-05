-- School Outreach Tracker (from OptometryConcierge School Outreach Tracker.xlsx)
-- Super-admin only.

create table if not exists public.school_outreach_schools (
  id uuid primary key default gen_random_uuid(),
  region text not null,
  school text not null,
  short_name text not null,
  city text,
  state text,
  program_website text,
  directory_page text,
  primary_target_role text,
  primary_contact_name text,
  primary_email text,
  phone text,
  secondary_contact text,
  owner text not null default 'Bilal' check (owner in ('Bilal', 'Karim')),
  status text not null default 'Not started'
    check (status in (
      'Not started', 'Emailed', 'Follow-up sent', 'Replied',
      'Sharing with students', 'Declined', 'No response'
    )),
  date_emailed date,
  follow_up_date date,
  reply text,
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (short_name)
);

create table if not exists public.school_outreach_clubs (
  id uuid primary key default gen_random_uuid(),
  school text not null,
  club_name text not null,
  reach_notes text,
  owner text not null default 'Bilal' check (owner in ('Bilal', 'Karim')),
  status text not null default 'Not started'
    check (status in (
      'Not started', 'Emailed', 'Follow-up sent', 'Replied',
      'Sharing with students', 'Declined', 'No response'
    )),
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists school_outreach_schools_status_idx
  on public.school_outreach_schools (status);
create index if not exists school_outreach_schools_owner_idx
  on public.school_outreach_schools (owner);
create index if not exists school_outreach_clubs_status_idx
  on public.school_outreach_clubs (status);

drop trigger if exists school_outreach_schools_touch on public.school_outreach_schools;
create trigger school_outreach_schools_touch
  before update on public.school_outreach_schools
  for each row execute function public.touch_updated_at();

drop trigger if exists school_outreach_clubs_touch on public.school_outreach_clubs;
create trigger school_outreach_clubs_touch
  before update on public.school_outreach_clubs
  for each row execute function public.touch_updated_at();

alter table public.school_outreach_schools enable row level security;
alter table public.school_outreach_clubs enable row level security;

drop policy if exists "school_outreach_schools_admin_all" on public.school_outreach_schools;
create policy "school_outreach_schools_admin_all" on public.school_outreach_schools
  for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "school_outreach_clubs_admin_all" on public.school_outreach_clubs;
create policy "school_outreach_clubs_admin_all" on public.school_outreach_clubs
  for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- Seed schools once (idempotent)
insert into public.school_outreach_schools (
  region, school, short_name, city, state, program_website, directory_page,
  primary_target_role, primary_contact_name, primary_email, phone,
  secondary_contact, owner, status, date_emailed, follow_up_date, reply, notes, sort_order
)
select * from (values

  ('South Central', 'University of the Incarnate Word – Rosenberg School of Optometry', 'UIW / RSO', 'San Antonio', 'TX', 'https://www.uiw.edu/optometry', 'https://optometry.uiw.edu/faculty-and-research/facultystaff/', 'Interim Asst. Dean, Student Affairs', 'Rochelle Valera', 'rvalera@uiwtx.edu', '(210) 883-1190', 'Dean Dr. Stephanie Schmiedecke Barbieri – schmiede@uiwtx.edu', 'Bilal', 'Not started', NULL::date, NULL::date, NULL, 'OUR SCHOOL — lead here, warm personal note. Dept line: optometry@uiwtx.edu', 1),
  ('Southeast', 'Southern College of Optometry', 'SCO', 'Memphis', 'TN', 'https://www.sco.edu', 'https://www.sco.edu/contact-us', 'VP, Student Services', 'Joe Hauser', 'jhauser@sco.edu', '(901) 722-3241', 'Rebecca Smietana, Assoc. Dir. Admissions & Student Services – rsmietana@sco.edu', 'Karim', 'Not started', NULL::date, NULL::date, NULL, 'Large class — high priority.', 2),
  ('Southeast', 'Nova Southeastern University – College of Optometry', 'NSU', 'Fort Lauderdale', 'FL', 'https://optometry.nova.edu', 'https://optometry.nova.edu/people/index.html', 'Assoc. Dean / Academic Affairs', 'Dr. Cristina Law', 'lcristin@nova.edu', NULL, 'Confirm Student Affairs officer via college contact form', 'Karim', 'Not started', NULL::date, NULL::date, NULL, 'Only OD program in FL. Ask Dr. Law to route to Student Affairs.', 3),
  ('Northeast', 'Pennsylvania College of Optometry at Drexel (Salus)', 'PCO / Salus', 'Elkins Park', 'PA', 'https://www.salus.edu/optometry', 'https://www.salus.edu/optometry', 'Dean of Student Affairs', 'Dr. James Caldwell', 'jc4793@drexel.edu', NULL, 'Dean Dr. Josephine Ibironke – Josephine.Ibironke@Drexel.edu', 'Bilal', 'Not started', NULL::date, NULL::date, NULL, 'Now part of Drexel.', 4),
  ('Northeast', 'State University of New York – College of Optometry', 'SUNY', 'New York', 'NY', 'https://www.sunyopt.edu', 'https://www.sunyopt.edu/about/leadership/', 'VP, Student Affairs', 'Dr. Gui Albieri', 'galbieri@sunyopt.edu', NULL, 'Dean Dr. Melissa Trego – mtrego@sunyopt.edu', 'Bilal', 'Not started', NULL::date, NULL::date, NULL, 'NYC campus.', 5),
  ('Midwest', 'The Ohio State University – College of Optometry', 'OSU', 'Columbus', 'OH', 'https://optometry.osu.edu', 'https://optometry.osu.edu/directory', 'Director, Student Affairs', 'Jennifer Bennett', 'bennett.1075@osu.edu', '(614) 292-2973', 'Dean Dr. Jeffrey Walline – walline.1@osu.edu', 'Karim', 'Not started', NULL::date, NULL::date, NULL, 'Has a dedicated Career Management office. Dept line: admissions@optometry.osu.edu', 6),
  ('Midwest', 'Indiana University – School of Optometry', 'IU', 'Bloomington', 'IN', 'https://www.optometry.iu.edu', 'https://optometry.iu.edu/people-directory/', 'Director, Student Administration', 'Cindy Vance', 'csvance@indiana.edu', '(812) 855-0081', 'Assoc. Dean for Students Dr. Kimberly Kohne – kkohne@iu.edu', 'Karim', 'Not started', NULL::date, NULL::date, NULL, NULL, 7),
  ('Southeast', 'University of Alabama at Birmingham – School of Optometry', 'UAB', 'Birmingham', 'AL', 'https://www.uab.edu/optometry', 'https://www.uab.edu/optometry/home/about/contact-us', 'Director, Student Affairs', 'Dr. Gerald Simon', 'gsimonod@uab.edu', '(205) 996-4923', 'Dean Dr. Kelly Nichols – nicholsk@uab.edu', 'Karim', 'Not started', NULL::date, NULL::date, NULL, NULL, 8),
  ('Southeast', 'University of Pikeville – Kentucky College of Optometry', 'KYCO', 'Pikeville', 'KY', 'https://www.upike.edu/KYCO', 'https://www.upike.edu/optometry/program-overview/kyco-faculty-new/', 'Dir., Student Affairs & Academic Excellence', 'Joshua Justice', 'joshuajustice00@upike.edu', '(606) 218-5251', 'Dean Dr. Renée Reeder – reneereeder@upike.edu', 'Karim', 'Not started', NULL::date, NULL::date, NULL, 'Feeds Appalachia / high-demand markets.', 9),
  ('Northeast', 'New England College of Optometry', 'NECO', 'Boston', 'MA', 'https://www.neco.edu', 'https://www.neco.edu', 'Associate Dean of Student Affairs', 'Kristen Tobin', 'tobink@neco.edu', NULL, 'President Dr. Howard Purcell – purcellh@neco.edu', 'Bilal', 'Not started', NULL::date, NULL::date, NULL, NULL, 10),
  ('Northeast', 'MCPHS – School of Optometry', 'MCPHS', 'Worcester', 'MA', 'https://www.mcphs.edu/academics/school-of-optometry/optometry/optometry-od', 'https://www.mcphs.edu', 'Director of Admission / Student Affairs', 'Andrew Rosabianca', 'andrew.rosabianca@mcphs.edu', NULL, NULL, 'Bilal', 'Not started', NULL::date, NULL::date, NULL, NULL, 11),
  ('Midwest', 'Michigan College of Optometry at Ferris State University', 'MCO / Ferris', 'Big Rapids', 'MI', 'https://www.ferris.edu/mco', 'https://www.ferris.edu/mco', 'Student Affairs (Health Colleges)', 'Amy Parks', 'amyparks@ferris.edu', NULL, 'Assoc. Dean/Academics Dr. Lillian Kalaczinski – lilliankalaczinski@ferris.edu', 'Karim', 'Not started', NULL::date, NULL::date, NULL, NULL, 12),
  ('Midwest', 'University of Detroit Mercy – School of Optometry', 'Detroit Mercy', 'Novi', 'MI', 'https://optometry.udmercy.edu', 'https://optometry.udmercy.edu', 'Assoc. Dean, Student Services & Enrollment', 'Dr. Juliette Daniels', 'danieljc@udmercy.edu', NULL, NULL, 'Karim', 'Not started', NULL::date, NULL::date, NULL, NULL, 13),
  ('West', 'Arizona College of Optometry – Midwestern University', 'AZCOPT / MWU', 'Glendale', 'AZ', 'https://www.midwestern.edu/academics/degrees-programs/doctor-optometry-program/arizona-college-optometry', 'https://www.midwestern.edu', 'Senior Admissions Counselor', 'Beka Godsil', 'rgodsi@midwestern.edu', NULL, 'Dean Dr. Alicia Feis – afeis@midwestern.edu', 'Bilal', 'Not started', NULL::date, NULL::date, NULL, NULL, 14),
  ('West', 'Southern California College of Optometry – Marshall B. Ketchum Univ.', 'SCCO / MBKU', 'Fullerton', 'CA', 'https://www.ketchum.edu/optometry', 'https://www.ketchum.edu', 'Director of Admissions', 'Tom Rainey', 'trainey@ketchum.edu', NULL, NULL, 'Bilal', 'Not started', NULL::date, NULL::date, NULL, NULL, 15),
  ('West', 'UC Berkeley – Herbert Wertheim School of Optometry & Vision Science', 'UC Berkeley', 'Berkeley', 'CA', 'https://optometry.berkeley.edu', 'https://optometry.berkeley.edu/people/', 'Asst. Dean, Admissions & Student Affairs', 'Dr. Mike Hoffshire', 'mhoffshire@berkeley.edu', NULL, 'Dean Dr. Sharon Bentley – sbentley@berkeley.edu  ·  Student Affairs: Morgan McClure – morgan.mcclure@berkeley.edu', 'Bilal', 'Not started', NULL::date, NULL::date, NULL, NULL, 16),
  ('West', 'Western University of Health Sciences – College of Optometry', 'WesternU', 'Pomona', 'CA', 'https://www.westernu.edu/optometry', 'https://www.westernu.edu/optometry', 'Associate Director of Admissions', 'Jessica Alberts', 'jalberts@westernu.edu', NULL, NULL, 'Bilal', 'Not started', NULL::date, NULL::date, NULL, NULL, 17),
  ('Midwest', 'Chicago College of Optometry – Midwestern University', 'CCO / MWU', 'Downers Grove', 'IL', 'https://www.midwestern.edu/academics/degrees-programs/doctor-optometry-program/chicago-college-optometry', 'https://www.midwestern.edu', 'Dean (route to Student Affairs)', 'Dr. Brianne Hobbs', 'bhobbs@midwestern.edu', NULL, 'Confirm Student Affairs officer via Midwestern directory', 'Karim', 'Not started', NULL::date, NULL::date, NULL, NULL, 18),
  ('Midwest', 'Illinois College of Optometry', 'ICO', 'Chicago', 'IL', 'https://www.ico.edu', 'https://www.ico.edu', 'Dean of Student Affairs', 'Dr. Erik Mothersbaugh', 'EMothersbaugh@ico.edu', NULL, 'Assoc. Dean/Academics Dr. Stephanie Messner – smessner@ico.edu', 'Karim', 'Not started', NULL::date, NULL::date, NULL, NULL, 19),
  ('Midwest', 'University of Missouri – St. Louis – College of Optometry', 'UMSL', 'St. Louis', 'MO', 'https://www.umsl.edu/divisions/optometry', 'https://www.umsl.edu/divisions/optometry', 'Assoc. Dean, Student Services & Alumni', 'Dr. Angel Simmons', 'novela@umsl.edu', NULL, NULL, 'Karim', 'Not started', NULL::date, NULL::date, NULL, NULL, 20),
  ('South Central', 'Northeastern State University – Oklahoma College of Optometry', 'NSUOCO', 'Tahlequah', 'OK', 'https://optometry.nsuok.edu', 'https://optometry.nsuok.edu', 'Dir., Student & Alumni Affairs', 'Mindy Latty', 'lattym@nsuok.edu', NULL, 'Dean Dr. Nathan Lighthizer – lighthiz@nsuok.edu', 'Bilal', 'Not started', NULL::date, NULL::date, NULL, NULL, 21),
  ('West', 'Pacific University – College of Optometry', 'Pacific', 'Forest Grove', 'OR', 'https://www.pacificu.edu/optometry', 'https://www.pacificu.edu/optometry', 'Asst. Dir., Grad & Professional Admissions', 'Julie Carlson', 'juliecarlson@pacificu.edu', NULL, 'Dean Dr. Bisant Labib – blabib@pacific.edu', 'Bilal', 'Not started', NULL::date, NULL::date, NULL, NULL, 22),
  ('South Central', 'University of Houston – College of Optometry', 'UH', 'Houston', 'TX', 'https://www.opt.uh.edu', 'https://www.opt.uh.edu', 'Dir., Admissions, Recruiting & Advising', 'Lyle Tate', 'ltate@central.uh.edu', NULL, 'Assoc. Dean/Academics Dr. Kimberly Lambreghts – klambreghts@uh.edu', 'Bilal', 'Not started', NULL::date, NULL::date, NULL, NULL, 23),
  ('West', 'Rocky Mountain University – College of Optometric Medicine', 'RMU', 'Provo', 'UT', 'https://rm.edu/od/', 'https://rm.edu/od/', 'Admissions Coordinator', 'Chelsea Saaga', 'chelsea.saaga@rm.edu', NULL, 'Interim Dean Dr. Donnie Akers – donnie.akers@rm.edu', 'Bilal', 'Not started', NULL::date, NULL::date, NULL, 'Newer program.', 24),
  ('Territory', 'Inter American University of Puerto Rico – School of Optometry', 'IAUPR', 'Bayamón', 'PR', 'https://www.optonet.inter.edu', 'https://www.optonet.inter.edu', 'Dean of Student Affairs', 'Dr. Iris Cabello', 'icabello@opto.inter.edu', NULL, NULL, 'Karim', 'Not started', NULL::date, NULL::date, NULL, 'U.S. territory, Spanish-language — consider a Spanish email + video.', 25)
) as v(
  region, school, short_name, city, state, program_website, directory_page,
  primary_target_role, primary_contact_name, primary_email, phone,
  secondary_contact, owner, status, date_emailed, follow_up_date, reply, notes, sort_order
)
where not exists (select 1 from public.school_outreach_schools limit 1);

-- Seed clubs once
insert into public.school_outreach_clubs (
  school, club_name, reach_notes, owner, status, notes, sort_order
)
select * from (values

  ('UIW – Rosenberg (RSO)', 'Private Practice Club / SOLN home', 'SOLN is based here — start with SOLN, then RSO''s own club via Rochelle Valera (School Tracker).', 'Bilal', 'Not started', 'Your school + SOLN HQ. Strongest starting point.', 1),
  ('Southern College of Optometry', 'Private Practice Club', 'Ask the school''s Student Affairs contact (see ''School Tracker'' tab) to intro you to the PPC president, or DM the club on Instagram.', 'Karim', 'Not started', NULL, 2),
  ('The Ohio State University', 'Doctor of Optometry Private Practice Club', 'Ask the school''s Student Affairs contact (see ''School Tracker'' tab) to intro you to the PPC president, or DM the club on Instagram.', 'Karim', 'Not started', 'Listed in OSU student orgs.', 3),
  ('MCPHS', 'Private Practice Club (PPC)', 'Ask the school''s Student Affairs contact (see ''School Tracker'' tab) to intro you to the PPC president, or DM the club on Instagram.', 'Bilal', 'Not started', 'Won campus Organization of the Year.', 4),
  ('Illinois College of Optometry', 'Private Practice Club', 'Ask the school''s Student Affairs contact (see ''School Tracker'' tab) to intro you to the PPC president, or DM the club on Instagram.', 'Karim', 'Not started', NULL, 5),
  ('Pacific University', 'Private Practice Club', 'Ask the school''s Student Affairs contact (see ''School Tracker'' tab) to intro you to the PPC president, or DM the club on Instagram.', 'Bilal', 'Not started', NULL, 6),
  ('UAB', 'Private Practice Club', 'Ask the school''s Student Affairs contact (see ''School Tracker'' tab) to intro you to the PPC president, or DM the club on Instagram.', 'Karim', 'Not started', 'Recent Preston Cup winner — very active.', 7),
  ('University of Houston', 'SOPMA (Student Optometric Practice Mgmt Assoc.)', 'Ask the school''s Student Affairs contact (see ''School Tracker'' tab) to intro you to the PPC president, or DM the club on Instagram.', 'Bilal', 'Not started', '2019 Preston Cup winner.', 8),
  ('Inter American (PR)', 'Private Practice Club (VSP-sponsored)', 'Ask the school''s Student Affairs contact (see ''School Tracker'' tab) to intro you to the PPC president, or DM the club on Instagram.', 'Karim', 'Not started', 'Spanish-language.', 9),
  ('NSU – Oklahoma College', 'Private Practice Club', 'Ask the school''s Student Affairs contact (see ''School Tracker'' tab) to intro you to the PPC president, or DM the club on Instagram.', 'Bilal', 'Not started', 'Preston Cup named for an NSUOCO student.', 10),
  ('SUNY', 'Private Practice Club (confirm)', 'Ask the school''s Student Affairs contact (see ''School Tracker'' tab) to intro you to the PPC president, or DM the club on Instagram.', 'Bilal', 'Not started', NULL, 11),
  ('Indiana University', 'Private Practice Club (confirm)', 'Ask the school''s Student Affairs contact (see ''School Tracker'' tab) to intro you to the PPC president, or DM the club on Instagram.', 'Karim', 'Not started', NULL, 12),
  ('PCO / Salus at Drexel', 'Private Practice Club (confirm)', 'Ask the school''s Student Affairs contact (see ''School Tracker'' tab) to intro you to the PPC president, or DM the club on Instagram.', 'Bilal', 'Not started', NULL, 13),
  ('Kentucky (KYCO)', 'Private Practice Club (confirm)', 'Ask the school''s Student Affairs contact (see ''School Tracker'' tab) to intro you to the PPC president, or DM the club on Instagram.', 'Karim', 'Not started', NULL, 14),
  ('New England (NECO)', 'Private Practice Club (confirm)', 'Ask the school''s Student Affairs contact (see ''School Tracker'' tab) to intro you to the PPC president, or DM the club on Instagram.', 'Bilal', 'Not started', NULL, 15),
  ('Michigan College / Ferris', 'Private Practice Club (confirm)', 'Ask the school''s Student Affairs contact (see ''School Tracker'' tab) to intro you to the PPC president, or DM the club on Instagram.', 'Karim', 'Not started', NULL, 16),
  ('Detroit Mercy', 'Private Practice Club (confirm)', 'Ask the school''s Student Affairs contact (see ''School Tracker'' tab) to intro you to the PPC president, or DM the club on Instagram.', 'Karim', 'Not started', NULL, 17),
  ('Arizona College / Midwestern', 'Private Practice Club (confirm)', 'Ask the school''s Student Affairs contact (see ''School Tracker'' tab) to intro you to the PPC president, or DM the club on Instagram.', 'Bilal', 'Not started', NULL, 18),
  ('SCCO / MBKU', 'Private Practice Club (confirm)', 'Ask the school''s Student Affairs contact (see ''School Tracker'' tab) to intro you to the PPC president, or DM the club on Instagram.', 'Bilal', 'Not started', NULL, 19),
  ('UC Berkeley', 'Private Practice Club (confirm)', 'Ask the school''s Student Affairs contact (see ''School Tracker'' tab) to intro you to the PPC president, or DM the club on Instagram.', 'Bilal', 'Not started', NULL, 20),
  ('Western University', 'Private Practice Club (confirm)', 'Ask the school''s Student Affairs contact (see ''School Tracker'' tab) to intro you to the PPC president, or DM the club on Instagram.', 'Bilal', 'Not started', NULL, 21),
  ('Chicago College / Midwestern', 'Private Practice Club (confirm)', 'Ask the school''s Student Affairs contact (see ''School Tracker'' tab) to intro you to the PPC president, or DM the club on Instagram.', 'Karim', 'Not started', NULL, 22),
  ('UMSL', 'Private Practice Club (confirm)', 'Ask the school''s Student Affairs contact (see ''School Tracker'' tab) to intro you to the PPC president, or DM the club on Instagram.', 'Karim', 'Not started', NULL, 23),
  ('Rocky Mountain (RMU)', 'Private Practice Club (confirm)', 'Ask the school''s Student Affairs contact (see ''School Tracker'' tab) to intro you to the PPC president, or DM the club on Instagram.', 'Bilal', 'Not started', 'Newer program.', 24)
) as v(school, club_name, reach_notes, owner, status, notes, sort_order)
where not exists (select 1 from public.school_outreach_clubs limit 1);
