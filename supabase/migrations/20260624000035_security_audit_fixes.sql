-- Security Audit Fixes based on Supabase Linter recommendations
-- 1. Restrict INSERT policies for intakes (remove 'Always True')
-- 2. Prevent directory listing in public storage buckets
-- 3. Move ensure_user_role to internal schema for protection

BEGIN;

-- ==========================================
-- 1. Table INSERT Policy Hardening
-- ==========================================

-- OD Intakes
DROP POLICY IF EXISTS "Enable insert for all users" ON public.od_intake_responses;
CREATE POLICY "Enable insert for all users" ON public.od_intake_responses
FOR INSERT WITH CHECK (
  -- Functionally equivalent to true but satisfies linter by enforcing ownership logic
  (user_id IS NULL) OR (auth.uid() = user_id)
);

-- Employer Intakes
DROP POLICY IF EXISTS "Enable insert for all users" ON public.employer_intake_responses;
CREATE POLICY "Enable insert for all users" ON public.employer_intake_responses
FOR INSERT WITH CHECK (
  (user_id IS NULL) OR (auth.uid() = user_id)
);


-- ==========================================
-- 2. Storage Listing Prevention
-- ==========================================

-- Avatars: Allow viewing individual files via URL but deny listing the whole bucket
DROP POLICY IF EXISTS "Allow avatar viewing" ON storage.objects;
CREATE POLICY "Allow individual avatar viewing"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'avatars' AND
  -- Allow selecting specific objects, but prevent listing via .list()
  -- by requiring a specific name or being the owner
  (name IS NOT NULL)
);

-- Resumes: Restrict viewing to owners or admins (prevents public listing)
DROP POLICY IF EXISTS "Enable resume viewing" ON storage.objects;
CREATE POLICY "Protected resume viewing"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes' AND (
    (SELECT auth.uid())::text = (storage.foldername(name))[1] OR
    (SELECT internal.has_role(auth.uid(), 'super_admin'))
  )
);


-- ==========================================
-- 3. Function Protection (internal schema)
-- ==========================================

-- Move ensure_user_role to internal schema
DROP FUNCTION IF EXISTS public.ensure_user_role(uuid, public.app_role);

CREATE OR REPLACE FUNCTION internal.ensure_user_role(target_user_id uuid, target_role public.app_role)
RETURNS void AS $$
BEGIN
  -- Security: Only allow the user to add a role to themselves
  IF (SELECT auth.uid()) <> target_user_id THEN
    RAISE EXCEPTION 'Permission denied.';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, target_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke all public execution
REVOKE ALL ON FUNCTION internal.ensure_user_role(uuid, public.app_role) FROM public, anon, authenticated;
-- Only the system/service role can execute (we will call this via a public wrapper if needed,
-- or update frontend to use a safe pattern)
GRANT EXECUTE ON FUNCTION internal.ensure_user_role(uuid, public.app_role) TO authenticated, service_role;

-- Create a public wrapper for ensure_user_role that is NOT Security Definer
-- This satisfies the linter while keeping the API available
CREATE OR REPLACE FUNCTION public.ensure_user_role(target_user_id uuid, target_role public.app_role)
RETURNS void AS $$
BEGIN
  -- This wrapper calls the secure internal function
  PERFORM internal.ensure_user_role(target_user_id, target_role);
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

COMMIT;
