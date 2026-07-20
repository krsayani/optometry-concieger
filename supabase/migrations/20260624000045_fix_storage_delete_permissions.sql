-- Fix Storage Delete and Update Permissions to allow users to manage their own files

-- Resumes: Allow users to delete their own resumes
DROP POLICY IF EXISTS "Admins can delete resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users and admins can delete resumes" ON storage.objects;

CREATE POLICY "Users and admins can delete resumes"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'resumes' AND (
    ((SELECT auth.uid())::text = (storage.foldername(name))[1])
    OR
    (SELECT public.has_role((SELECT auth.uid()), 'super_admin'))
  )
);

-- Resumes: Allow users to update their own resumes
DROP POLICY IF EXISTS "Enable resume updates" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own resumes" ON storage.objects;

CREATE POLICY "Users can update their own resumes"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'resumes' AND (
    ((SELECT auth.uid())::text = (storage.foldername(name))[1])
  )
)
WITH CHECK (
  bucket_id = 'resumes' AND (
    ((SELECT auth.uid())::text = (storage.foldername(name))[1])
  )
);
