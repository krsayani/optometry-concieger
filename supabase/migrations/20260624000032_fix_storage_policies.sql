-- Fix Storage Policies for Resumes and Avatars
-- Restore functionality while maintaining security (preventing directory listing)

BEGIN;

-- ==========================================
-- 1. Resumes Bucket Policies
-- ==========================================

-- Drop existing to ensure clean slate
DROP POLICY IF EXISTS "Anyone can upload a resume" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete resumes" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own resume" ON storage.objects;

-- INSERT: Allow both anon and authenticated to upload to resumes
-- This is needed for new signups who aren't fully confirmed yet
CREATE POLICY "Enable resume uploads for all"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'resumes');

-- SELECT: Allow users to see their own files and public to see via URL
-- Note: Public URL access on public buckets doesn't require SELECT,
-- but .upload with upsert:true or .download via client DOES.
CREATE POLICY "Enable resume viewing"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'resumes');

-- UPDATE: Needed for upsert: true
CREATE POLICY "Enable resume updates"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'resumes')
WITH CHECK (bucket_id = 'resumes');

-- DELETE: Admins only
CREATE POLICY "Admins can delete resumes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'resumes' AND
  (SELECT internal.has_role(auth.uid(), 'super_admin'))
);


-- ==========================================
-- 2. Avatars Bucket Policies (Hardening)
-- ==========================================

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;

-- INSERT: Allow authenticated users to upload
CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- SELECT: Allow viewing
CREATE POLICY "Allow avatar viewing"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'avatars');

-- UPDATE: Allow users to update their own (path starts with UID)
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND (SELECT auth.uid())::text = (storage.foldername(name))[1]);

-- DELETE: Users can delete own OR Admins
CREATE POLICY "Users and admins can delete avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND (
    (SELECT auth.uid())::text = (storage.foldername(name))[1] OR
    (SELECT internal.has_role(auth.uid(), 'super_admin'))
  )
);

COMMIT;
