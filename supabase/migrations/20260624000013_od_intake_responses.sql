CREATE TABLE public.od_intake_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  school text NOT NULL,
  other_school text,
  grad_year text NOT NULL,
  license_status text NOT NULL,
  years_in_practice text NOT NULL,
  completed_residency text NOT NULL,
  residency_type text,
  preferred_states text[] NOT NULL,
  preferred_cities text,
  open_to_relocation text NOT NULL,
  practice_setting text[] NOT NULL,
  practice_type_preference text NOT NULL,
  clinical_interests text[] NOT NULL,
  salary_expectation text NOT NULL,
  target_start_date text NOT NULL,
  job_priorities text[] NOT NULL,
  interest_in_ownership text NOT NULL,
  anything_else text,
  resume_url text,
  position_type text NOT NULL,
  consent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.od_intake_responses ENABLE ROW LEVEL SECURITY;

-- Anyone can submit (even without login)
CREATE POLICY "Enable insert for all" ON public.od_intake_responses FOR INSERT WITH CHECK (true);

-- Owners and admins can see responses
DROP POLICY IF EXISTS "Admins can see everything" ON public.od_intake_responses;
DROP POLICY IF EXISTS "Users can see their own intake responses" ON public.od_intake_responses;
DROP POLICY IF EXISTS "Users and admins can view intake responses" ON public.od_intake_responses;
CREATE POLICY "Users and admins can view intake responses" ON public.od_intake_responses FOR SELECT TO authenticated USING (
  (select auth.uid()) = user_id OR
  (SELECT public.has_role(auth.uid(), 'super_admin'))
);

-- Admins can update
DROP POLICY IF EXISTS "Admins can update intakes" ON public.od_intake_responses;
CREATE POLICY "Admins can update intakes" ON public.od_intake_responses FOR UPDATE TO authenticated USING ((SELECT public.has_role(auth.uid(), 'super_admin')));

-- Admins can delete
DROP POLICY IF EXISTS "Admins can delete intakes" ON public.od_intake_responses;
CREATE POLICY "Admins can delete intakes" ON public.od_intake_responses FOR DELETE TO authenticated USING ((SELECT public.has_role(auth.uid(), 'super_admin')));

GRANT ALL ON public.od_intake_responses TO anon, authenticated, service_role;
