-- Performance Optimization Migration
-- Wraps auth.uid() and has_role() calls in (SELECT ...) to prevent row-by-row re-evaluation.
-- This resolves 'Auth RLS Initialization Plan' performance warnings.

BEGIN;

-- ==========================================
-- 1. Table: public.od_intake_responses
-- ==========================================

DROP POLICY IF EXISTS "Enable insert for all users" ON public.od_intake_responses;
CREATE POLICY "Enable insert for all users" ON public.od_intake_responses
FOR INSERT WITH CHECK (
  (user_id IS NULL) OR ((SELECT auth.uid()) = user_id)
);

DROP POLICY IF EXISTS "Users and admins can view intake responses" ON public.od_intake_responses;
CREATE POLICY "Users and admins can view intake responses" ON public.od_intake_responses
FOR SELECT TO authenticated
USING (
  ((SELECT auth.uid()) = user_id) OR
  (SELECT internal.has_role((SELECT auth.uid()), 'super_admin'))
);

DROP POLICY IF EXISTS "Users and admins can update OD intakes" ON public.od_intake_responses;
CREATE POLICY "Users and admins can update OD intakes" ON public.od_intake_responses
FOR UPDATE TO authenticated
USING (
  ((SELECT auth.uid()) = user_id) OR
  (SELECT internal.has_role((SELECT auth.uid()), 'super_admin'))
)
WITH CHECK (
  ((SELECT auth.uid()) = user_id) OR
  (SELECT internal.has_role((SELECT auth.uid()), 'super_admin'))
);


-- ==========================================
-- 2. Table: public.employer_intake_responses
-- ==========================================

DROP POLICY IF EXISTS "Enable insert for all users" ON public.employer_intake_responses;
CREATE POLICY "Enable insert for all users" ON public.employer_intake_responses
FOR INSERT WITH CHECK (
  (user_id IS NULL) OR ((SELECT auth.uid()) = user_id)
);

DROP POLICY IF EXISTS "Users and admins can view employer responses" ON public.employer_intake_responses;
CREATE POLICY "Users and admins can view employer responses" ON public.employer_intake_responses
FOR SELECT TO authenticated
USING (
  ((SELECT auth.uid()) = user_id) OR
  (SELECT internal.has_role((SELECT auth.uid()), 'super_admin'))
);

DROP POLICY IF EXISTS "Users and admins can update employer intakes" ON public.employer_intake_responses;
CREATE POLICY "Users and admins can update employer intakes" ON public.employer_intake_responses
FOR UPDATE TO authenticated
USING (
  ((SELECT auth.uid()) = user_id) OR
  (SELECT internal.has_role((SELECT auth.uid()), 'super_admin'))
)
WITH CHECK (
  ((SELECT auth.uid()) = user_id) OR
  (SELECT internal.has_role((SELECT auth.uid()), 'super_admin'))
);


-- ==========================================
-- 3. Storage Policies
-- ==========================================

-- BUCKET: resumes

-- Allow anyone to upload a resume (required for signup flow where user might not be fully authenticated yet)
DROP POLICY IF EXISTS "Enable resume uploads for all" ON storage.objects;
CREATE POLICY "Enable resume uploads for all" ON storage.objects
FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'resumes');

-- Allow updates (for upsert: true)
DROP POLICY IF EXISTS "Enable resume updates" ON storage.objects;
CREATE POLICY "Enable resume updates" ON storage.objects
FOR UPDATE TO anon, authenticated
USING (bucket_id = 'resumes')
WITH CHECK (bucket_id = 'resumes');

-- Protected resume viewing (Owner or Admin)
DROP POLICY IF EXISTS "Protected resume viewing" ON storage.objects;
CREATE POLICY "Protected resume viewing" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'resumes' AND (
    (SELECT auth.uid())::text = (storage.foldername(name))[1] OR
    (SELECT internal.has_role((SELECT auth.uid()), 'super_admin'))
  )
);

-- Admin deletion
DROP POLICY IF EXISTS "Admins can delete resumes" ON storage.objects;
CREATE POLICY "Admins can delete resumes" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'resumes' AND
  (SELECT internal.has_role((SELECT auth.uid()), 'super_admin'))
);


-- BUCKET: avatars

-- Authenticated users can upload avatars
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
CREATE POLICY "Users can upload avatars" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Public viewing of avatars
DROP POLICY IF EXISTS "Allow individual avatar viewing" ON storage.objects;
DROP POLICY IF EXISTS "Allow avatar viewing" ON storage.objects;
CREATE POLICY "Allow individual avatar viewing" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'avatars');

-- Users can update own avatar
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars' AND
  (SELECT auth.uid())::text = (storage.foldername(name))[1]
);

-- Users and admins can delete avatars
DROP POLICY IF EXISTS "Users and admins can delete avatars" ON storage.objects;
CREATE POLICY "Users and admins can delete avatars" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars' AND (
    (SELECT auth.uid())::text = (storage.foldername(name))[1] OR
    (SELECT internal.has_role((SELECT auth.uid()), 'super_admin'))
  )
);

COMMIT;
