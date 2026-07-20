-- Enable Realtime for core tables to support instant UI updates
-- This allows the Supabase Realtime engine to broadcast changes to the frontend.

BEGIN;

-- 1. Create the supabase_realtime publication if it doesn't exist
-- Note: In most Supabase projects this exists by default, but we ensure it here.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- 2. Add core tables to the publication
-- We use ALTER PUBLICATION to add them individually to avoid overwriting existing tables in the publication.

ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.od_intake_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.employer_intake_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.concierge_matches;

COMMIT;
