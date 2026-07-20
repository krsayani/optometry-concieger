-- Add unique constraints to email columns in intake tables to prevent duplicate entries at the database level.

BEGIN;

-- 1. Table: public.od_intake_responses
-- We first clean up potential duplicates by keeping only the latest entry if any exist.
-- (In a production environment, you might want to merge data instead)
DELETE FROM public.od_intake_responses
WHERE id NOT IN (
  SELECT DISTINCT ON (LOWER(email)) id
  FROM public.od_intake_responses
  ORDER BY LOWER(email), created_at DESC
);

ALTER TABLE public.od_intake_responses ADD CONSTRAINT od_intake_responses_email_key UNIQUE (email);


-- 2. Table: public.employer_intake_responses
DELETE FROM public.employer_intake_responses
WHERE id NOT IN (
  SELECT DISTINCT ON (LOWER(email)) id
  FROM public.employer_intake_responses
  ORDER BY LOWER(email), created_at DESC
);

ALTER TABLE public.employer_intake_responses ADD CONSTRAINT employer_intake_responses_email_key UNIQUE (email);

COMMIT;
