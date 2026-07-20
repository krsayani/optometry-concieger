-- Ensure each user can only have one OD profile and one Employer profile
-- 1. OD Intake Responses
-- First, remove any potential duplicates (keeping the latest one)
DELETE FROM public.od_intake_responses a
USING public.od_intake_responses b
WHERE a.user_id = b.user_id
  AND a.created_at < b.created_at
  AND a.user_id IS NOT NULL;

ALTER TABLE public.od_intake_responses ADD CONSTRAINT od_intake_responses_user_id_key UNIQUE (user_id);

-- 2. Employer Intake Responses
DELETE FROM public.employer_intake_responses a
USING public.employer_intake_responses b
WHERE a.user_id = b.user_id
  AND a.created_at < b.created_at
  AND a.user_id IS NOT NULL;

ALTER TABLE public.employer_intake_responses ADD CONSTRAINT employer_intake_responses_user_id_key UNIQUE (user_id);
