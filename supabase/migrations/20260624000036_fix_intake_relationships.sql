-- Fix relationships between intake responses and profiles to allow API joins
-- This resolves the 400 Bad Request error in the Admin Dashboard

BEGIN;

-- 1. Update OD Intake Responses
-- Remove the old reference to auth.users
ALTER TABLE public.od_intake_responses
DROP CONSTRAINT IF EXISTS od_intake_responses_user_id_fkey;

-- Add new reference to public.profiles
ALTER TABLE public.od_intake_responses
ADD CONSTRAINT od_intake_responses_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


-- 2. Update Employer Intake Responses
ALTER TABLE public.employer_intake_responses
DROP CONSTRAINT IF EXISTS employer_intake_responses_user_id_fkey;

ALTER TABLE public.employer_intake_responses
ADD CONSTRAINT employer_intake_responses_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMIT;
