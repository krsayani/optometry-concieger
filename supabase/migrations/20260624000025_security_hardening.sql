-- Security hardening migration to resolve Supabase linter warnings
-- 1. Security: Set search_path for SECURITY DEFINER functions to prevent search_path hijacking.
-- 2. Security: Restricted overly permissive INSERT policies for intake responses.
-- 3. Security: Restricted broad SELECT policies on public storage buckets to prevent directory listing.

BEGIN;

-- ==========================================
-- 1. Function Hardening (Search Path)
-- ==========================================

-- Fix search_path for has_role to satisfy SECURITY DEFINER requirements
ALTER FUNCTION public.has_role(uuid, text) SET search_path = public;

-- Fix search_path for handle_new_user
ALTER FUNCTION public.handle_new_user() SET search_path = public;
-- Revoke execution from public as this is a trigger-only function
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Fix search_path for update_updated_at_column
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
-- Revoke execution from public as this is a trigger-only function
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM public;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;


-- ==========================================
-- 2. Table: public.od_intake_responses (Restrict INSERT)
-- ==========================================
-- The linter warns about "Enable insert for all" having WITH CHECK (true).
-- We'll restrict it so that if a user is logged in, they can only set their own user_id.
DROP POLICY IF EXISTS "Enable insert for all" ON public.od_intake_responses;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.od_intake_responses;
CREATE POLICY "Enable insert for all users" ON public.od_intake_responses
FOR INSERT
WITH CHECK (
  -- If user_id is provided, it must match the authenticated user
  (user_id IS NULL) OR ((SELECT auth.uid()) = user_id)
);


-- ==========================================
-- 3. Table: public.employer_intake_responses (Restrict INSERT)
-- ==========================================
DROP POLICY IF EXISTS "Enable insert for all" ON public.employer_intake_responses;
CREATE POLICY "Enable insert for all users" ON public.employer_intake_responses
FOR INSERT
WITH CHECK (
  (user_id IS NULL) OR ((SELECT auth.uid()) = user_id)
);


-- ==========================================
-- 4. Storage: Prevent bucket listing
-- ==========================================

-- In Supabase, 'public' buckets allow file access via URL without SELECT policies.
-- Broad SELECT policies allow listing the entire bucket, which the linter warns against.

-- For 'avatars' bucket:
DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;
-- We can add a more specific SELECT policy if listing is still needed but restricted,
-- but for a public bucket, usually you don't need SELECT at all for public URLs.

-- For 'resumes' bucket:
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- If your frontend specifically uses .list() or needs to download via API (not public URL),
-- you would need to add back more restrictive SELECT policies.

COMMIT;
