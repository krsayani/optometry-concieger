-- 1. Create the 'resumes' bucket
-- Setting public: true makes files accessible via public URL
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  true, -- Changed to true to allow public links to work
  5242880, -- 5MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET public = true; -- Ensure it's public if it already existed

-- 2. Clear existing policies
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow view" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view resumes" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload a resume" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- 3. Policy: Allow anyone (anon or authenticated) to upload resumes
CREATE POLICY "Anyone can upload a resume"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'resumes');

-- 4. Policy: Allow public viewing of files in the resumes bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'resumes');

-- 5. Policy: Super Admins can delete resumes
DROP POLICY IF EXISTS "Admins can delete resumes" ON storage.objects;
CREATE POLICY "Admins can delete resumes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'resumes' AND
  ((SELECT public.has_role(auth.uid(), 'super_admin')))
);
