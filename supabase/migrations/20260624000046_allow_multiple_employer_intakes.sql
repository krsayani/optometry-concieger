-- Allow employers to submit multiple hiring requests
-- Remove the unique constraint on user_id for employer_intake_responses
ALTER TABLE public.employer_intake_responses DROP CONSTRAINT IF EXISTS employer_intake_responses_user_id_key;

-- Remove the unique constraint on email for employer_intake_responses
ALTER TABLE public.employer_intake_responses DROP CONSTRAINT IF EXISTS employer_intake_responses_email_key;

-- Note: We keep the unique constraint for ODs as they should only have one career profile.
