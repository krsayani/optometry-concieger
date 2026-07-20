-- Optimization and consolidation migration to resolve Supabase linter warnings
-- 1. Performance: Wrapped auth.uid() and has_role() in subqueries (SELECT ...) to prevent row-by-row re-evaluation.
-- 2. Redundancy: Consolidated multiple permissive SELECT and UPDATE policies.

BEGIN;

-- ==========================================
-- 1. Table: public.profiles
-- ==========================================
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = id)
WITH CHECK ((SELECT auth.uid()) = id);


-- ==========================================
-- 2. Table: public.user_roles
-- ==========================================
DROP POLICY IF EXISTS "Roles are viewable by admins" ON public.user_roles;
DROP POLICY IF EXISTS "Users can see own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users and admins can view roles" ON public.user_roles;
CREATE POLICY "Users and admins can view roles" ON public.user_roles
FOR SELECT TO authenticated
USING (
  (SELECT auth.uid()) = user_id OR
  (SELECT public.has_role((SELECT auth.uid()), 'super_admin'))
);


-- ==========================================
-- 3. Table: public.od_intake_responses
-- ==========================================
-- Consolidate SELECT
DROP POLICY IF EXISTS "Users can see their own intake responses" ON public.od_intake_responses;
DROP POLICY IF EXISTS "Admins can see everything" ON public.od_intake_responses;
DROP POLICY IF EXISTS "Users and admins can view intake responses" ON public.od_intake_responses;
CREATE POLICY "Users and admins can view intake responses" ON public.od_intake_responses
FOR SELECT TO authenticated
USING (
  (SELECT auth.uid()) = user_id OR
  (SELECT public.has_role((SELECT auth.uid()), 'super_admin'))
);

-- Consolidate UPDATE
DROP POLICY IF EXISTS "Admins can update intakes" ON public.od_intake_responses;
DROP POLICY IF EXISTS "Admins can update OD intakes" ON public.od_intake_responses;
DROP POLICY IF EXISTS "Users can update own intake" ON public.od_intake_responses;
DROP POLICY IF EXISTS "Users and admins can update OD intakes" ON public.od_intake_responses;
CREATE POLICY "Users and admins can update OD intakes" ON public.od_intake_responses
FOR UPDATE TO authenticated
USING (
  (SELECT auth.uid()) = user_id OR
  (SELECT public.has_role((SELECT auth.uid()), 'super_admin'))
)
WITH CHECK (
  (SELECT auth.uid()) = user_id OR
  (SELECT public.has_role((SELECT auth.uid()), 'super_admin'))
);

-- Optimize DELETE
DROP POLICY IF EXISTS "Admins can delete intakes" ON public.od_intake_responses;
DROP POLICY IF EXISTS "Admins can delete OD intakes" ON public.od_intake_responses;
CREATE POLICY "Admins can delete OD intakes" ON public.od_intake_responses
FOR DELETE TO authenticated
USING ((SELECT public.has_role((SELECT auth.uid()), 'super_admin')));


-- ==========================================
-- 4. Table: public.employer_intake_responses
-- ==========================================
-- Consolidate SELECT
DROP POLICY IF EXISTS "Users can see their own response" ON public.employer_intake_responses;
DROP POLICY IF EXISTS "Admins can see everything" ON public.employer_intake_responses;
DROP POLICY IF EXISTS "Users and admins can view employer responses" ON public.employer_intake_responses;
CREATE POLICY "Users and admins can view employer responses" ON public.employer_intake_responses
FOR SELECT TO authenticated
USING (
  (SELECT auth.uid()) = user_id OR
  (SELECT public.has_role((SELECT auth.uid()), 'super_admin'))
);

-- Consolidate UPDATE
DROP POLICY IF EXISTS "Admins can update employer intakes" ON public.employer_intake_responses;
DROP POLICY IF EXISTS "Admins can update requests" ON public.employer_intake_responses;
DROP POLICY IF EXISTS "Users can update own request" ON public.employer_intake_responses;
DROP POLICY IF EXISTS "Users and admins can update employer intakes" ON public.employer_intake_responses;
CREATE POLICY "Users and admins can update employer intakes" ON public.employer_intake_responses
FOR UPDATE TO authenticated
USING (
  (SELECT auth.uid()) = user_id OR
  (SELECT public.has_role((SELECT auth.uid()), 'super_admin'))
)
WITH CHECK (
  (SELECT auth.uid()) = user_id OR
  (SELECT public.has_role((SELECT auth.uid()), 'super_admin'))
);

-- Optimize DELETE
DROP POLICY IF EXISTS "Admins can delete employer intakes" ON public.employer_intake_responses;
DROP POLICY IF EXISTS "Admins can delete requests" ON public.employer_intake_responses;
CREATE POLICY "Admins can delete employer intakes" ON public.employer_intake_responses
FOR DELETE TO authenticated
USING ((SELECT public.has_role((SELECT auth.uid()), 'super_admin')));


-- ==========================================
-- 5. Table: public.concierge_matches
-- ==========================================
-- Optimize INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Admins can manage matches" ON public.concierge_matches;
DROP POLICY IF EXISTS "Admins can insert matches" ON public.concierge_matches;
DROP POLICY IF EXISTS "Admins can update matches" ON public.concierge_matches;
DROP POLICY IF EXISTS "Admins can delete matches" ON public.concierge_matches;

CREATE POLICY "Admins can insert matches" ON public.concierge_matches
FOR INSERT TO authenticated
WITH CHECK ((SELECT public.has_role((SELECT auth.uid()), 'super_admin')));

CREATE POLICY "Admins can update matches" ON public.concierge_matches
FOR UPDATE TO authenticated
USING ((SELECT public.has_role((SELECT auth.uid()), 'super_admin')))
WITH CHECK ((SELECT public.has_role((SELECT auth.uid()), 'super_admin')));

CREATE POLICY "Admins can delete matches" ON public.concierge_matches
FOR DELETE TO authenticated
USING ((SELECT public.has_role((SELECT auth.uid()), 'super_admin')));

-- Consolidate SELECT
DROP POLICY IF EXISTS "Users can see their matches" ON public.concierge_matches;
DROP POLICY IF EXISTS "Users and admins can view matches" ON public.concierge_matches;
CREATE POLICY "Users and admins can view matches" ON public.concierge_matches
FOR SELECT TO authenticated
USING (
  (SELECT public.has_role((SELECT auth.uid()), 'super_admin')) OR
  EXISTS (SELECT 1 FROM public.od_intake_responses WHERE id = od_intake_id AND user_id = (SELECT auth.uid())) OR
  EXISTS (SELECT 1 FROM public.employer_intake_responses WHERE id = employer_intake_id AND user_id = (SELECT auth.uid()))
);


-- ==========================================
-- 6. Storage: avatars & resumes (storage.objects)
-- ==========================================
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (SELECT auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'avatars' AND (SELECT auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (SELECT auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Admins can delete resumes" ON storage.objects;
CREATE POLICY "Admins can delete resumes" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'resumes' AND (SELECT public.has_role((SELECT auth.uid()), 'super_admin')));

COMMIT;
