-- Update intake table relationships to use CASCADE delete.
-- This ensures that when a user/profile is deleted, their intake responses
-- and associated matches are automatically removed from the database.

BEGIN;

-- 1. Update OD Intake Responses
ALTER TABLE public.od_intake_responses
DROP CONSTRAINT IF EXISTS od_intake_responses_user_id_fkey;

ALTER TABLE public.od_intake_responses
ADD CONSTRAINT od_intake_responses_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


-- 2. Update Employer Intake Responses
ALTER TABLE public.employer_intake_responses
DROP CONSTRAINT IF EXISTS employer_intake_responses_user_id_fkey;

ALTER TABLE public.employer_intake_responses
ADD CONSTRAINT employer_intake_responses_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

COMMIT;
