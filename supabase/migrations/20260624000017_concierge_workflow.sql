-- Add status and notes to OD Intakes
ALTER TABLE public.od_intake_responses
ADD COLUMN IF NOT EXISTS status text DEFAULT 'Profile Created',
ADD COLUMN IF NOT EXISTS admin_notes text,
ADD COLUMN IF NOT EXISTS verified_profile_data jsonb;

-- Add status and notes to Employer Intakes
ALTER TABLE public.employer_intake_responses
ADD COLUMN IF NOT EXISTS status text DEFAULT 'Request Received',
ADD COLUMN IF NOT EXISTS admin_notes text;

-- Create Matching Table
CREATE TABLE IF NOT EXISTS public.concierge_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  od_intake_id uuid REFERENCES public.od_intake_responses(id) ON DELETE CASCADE,
  employer_intake_id uuid REFERENCES public.employer_intake_responses(id) ON DELETE CASCADE,
  status text DEFAULT 'Potential Match', -- 'Potential Match', 'Introduced', 'Interviewing', 'Hired', 'Declined'
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(od_intake_id, employer_intake_id)
);

-- RLS for Matches
ALTER TABLE public.concierge_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage matches" ON public.concierge_matches;
CREATE POLICY "Admins can manage matches"
ON public.concierge_matches
FOR INSERT, UPDATE, DELETE
TO authenticated
USING ((SELECT public.has_role(auth.uid(), 'super_admin')));

-- Allow users involved in a match to see it
DROP POLICY IF EXISTS "Users can see their matches" ON public.concierge_matches;
DROP POLICY IF EXISTS "Users and admins can view matches" ON public.concierge_matches;
CREATE POLICY "Users and admins can view matches"
ON public.concierge_matches
FOR SELECT
TO authenticated
USING (
  (SELECT public.has_role(auth.uid(), 'super_admin')) OR
  EXISTS (SELECT 1 FROM public.od_intake_responses WHERE id = od_intake_id AND user_id = (select auth.uid())) OR
  EXISTS (SELECT 1 FROM public.employer_intake_responses WHERE id = employer_intake_id AND user_id = (select auth.uid()))
);

GRANT ALL ON public.concierge_matches TO anon, authenticated, service_role;
