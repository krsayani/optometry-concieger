-- Update RLS policies to allow intake submissions without active sessions
-- This is necessary because signUp does not immediately log in a user if email confirmation is required.

BEGIN;

-- OD Intake Responses
DROP POLICY IF EXISTS "Enable insert for all users" ON public.od_intake_responses;
CREATE POLICY "Enable insert for all users" ON public.od_intake_responses
FOR INSERT
WITH CHECK (true); -- Allow all inserts, ownership is enforced via SELECT/UPDATE policies

-- Employer Intake Responses
DROP POLICY IF EXISTS "Enable insert for all users" ON public.employer_intake_responses;
CREATE POLICY "Enable insert for all users" ON public.employer_intake_responses
FOR INSERT
WITH CHECK (true);

COMMIT;
