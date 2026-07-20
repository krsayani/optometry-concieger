-- Fix RLS policies to allow intake submissions during the signup flow.
-- The previous restrictive policy (user_id IS NULL OR auth.uid() = user_id)
-- blocked new signups because the user is not yet "authenticated" in the Postgres session
-- if email confirmation is required.

BEGIN;

-- 1. OD Intake Responses
DROP POLICY IF EXISTS "Enable insert for all users" ON public.od_intake_responses;
CREATE POLICY "Enable insert for all users" ON public.od_intake_responses
FOR INSERT
WITH CHECK (true); -- Allow all inserts. Data integrity is handled by unique constraints on email.

-- 2. Employer Intake Responses
DROP POLICY IF EXISTS "Enable insert for all users" ON public.employer_intake_responses;
CREATE POLICY "Enable insert for all users" ON public.employer_intake_responses
FOR INSERT
WITH CHECK (true);

COMMIT;
