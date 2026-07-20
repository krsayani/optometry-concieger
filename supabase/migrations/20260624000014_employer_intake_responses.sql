CREATE TABLE public.employer_intake_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_name text NOT NULL,
  practice_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  location text NOT NULL,
  practice_type text NOT NULL,
  num_ods text NOT NULL,
  position_type text NOT NULL,
  salary_range text NOT NULL,
  production_bonus text NOT NULL,
  sign_on_bonus text,
  relocation_assistance text NOT NULL,
  benefits text[] NOT NULL,
  schedule text NOT NULL,
  patient_volume text NOT NULL,
  primary_care_type text[] NOT NULL,
  new_grad_friendly text NOT NULL,
  mentorship_available text NOT NULL,
  equipment_tech text,
  ownership_track text NOT NULL,
  urgency text NOT NULL,
  anything_else text,
  consent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.employer_intake_responses ENABLE ROW LEVEL SECURITY;

-- Anyone can submit
CREATE POLICY "Enable insert for all" ON public.employer_intake_responses FOR INSERT WITH CHECK (true);

-- Owners and admins can see responses
DROP POLICY IF EXISTS "Admins can see everything" ON public.employer_intake_responses;
DROP POLICY IF EXISTS "Users can see their own response" ON public.employer_intake_responses;
DROP POLICY IF EXISTS "Users and admins can view employer responses" ON public.employer_intake_responses;
CREATE POLICY "Users and admins can view employer responses" ON public.employer_intake_responses FOR SELECT TO authenticated USING (
  (select auth.uid()) = user_id OR
  (SELECT public.has_role(auth.uid(), 'super_admin'))
);

-- Admins can update (Note: Also defined in later migrations, consider consolidating)
DROP POLICY IF EXISTS "Admins can update requests" ON public.employer_intake_responses;
CREATE POLICY "Admins can update requests" ON public.employer_intake_responses FOR UPDATE TO authenticated USING ((SELECT public.has_role(auth.uid(), 'super_admin')));

-- Admins can delete (Note: Also defined in later migrations, consider consolidating)
DROP POLICY IF EXISTS "Admins can delete requests" ON public.employer_intake_responses;
CREATE POLICY "Admins can delete requests" ON public.employer_intake_responses FOR DELETE TO authenticated USING ((SELECT public.has_role(auth.uid(), 'super_admin')));

GRANT ALL ON public.employer_intake_responses TO anon, authenticated, service_role;
