-- Repair Migration: Restores Profile policies and implements Suspension Lock
-- Also resolves Supabase linter warnings regarding Auth RLS performance and multiple permissive policies.

BEGIN;

-- 0. Grant USAGE on internal schema to allow authenticated users to execute helper functions
GRANT USAGE ON SCHEMA internal TO anon, authenticated;

-- 1. Create helper to check if user is active (not suspended)
CREATE OR REPLACE FUNCTION internal.is_active(uid uuid)
RETURNS boolean AS $$
BEGIN
  -- If uid is null (anon), we might want to return true for public visibility,
  -- but usually this is used for operations.
  IF uid IS NULL THEN RETURN true; END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid
    AND status = 'Active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke all from public/anon/auth to hide from API, grant to authenticated for RLS use
REVOKE ALL ON FUNCTION internal.is_active(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION internal.is_active(uuid) TO authenticated, service_role;


-- 2. Create helper for Super Admin to delete users
CREATE OR REPLACE FUNCTION internal.delete_user(target_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Check for super_admin role
  IF NOT internal.has_role((SELECT auth.uid()), 'super_admin') THEN
    RAISE EXCEPTION 'Access denied. Super admin role required.';
  END IF;

  -- Delete from auth.users (cascades to profiles, user_roles, etc.)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION internal.delete_user(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION internal.delete_user(uuid) TO authenticated, service_role;


-- 3. Restore and harden public.profiles policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users and admins can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- SELECT: Allow visibility to all (needed for matching and general identification)
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
FOR SELECT USING (true);

-- UPDATE: Combined policy for owner and admins to resolve "multiple_permissive_policies"
CREATE POLICY "Users and admins can update profiles" ON public.profiles
FOR UPDATE TO authenticated
USING (
  (((SELECT auth.uid()) = id) AND (SELECT internal.is_active((SELECT auth.uid()))))
  OR
  (SELECT internal.has_role((SELECT auth.uid()), 'super_admin'))
)
WITH CHECK (
  (((SELECT auth.uid()) = id) AND (SELECT internal.is_active((SELECT auth.uid()))))
  OR
  (SELECT internal.has_role((SELECT auth.uid()), 'super_admin'))
);


-- 4. Apply Suspension Lock to other tables & Fix Linter Warnings

-- OD Intakes
DROP POLICY IF EXISTS "Users and admins can update OD intakes" ON public.od_intake_responses;
CREATE POLICY "Users and admins can update OD intakes" ON public.od_intake_responses
FOR UPDATE TO authenticated
USING (
  (((SELECT auth.uid()) = user_id) OR (SELECT internal.has_role((SELECT auth.uid()), 'super_admin'))) AND
  (SELECT internal.is_active((SELECT auth.uid())))
)
WITH CHECK (
  (((SELECT auth.uid()) = user_id) OR (SELECT internal.has_role((SELECT auth.uid()), 'super_admin'))) AND
  (SELECT internal.is_active((SELECT auth.uid())))
);

DROP POLICY IF EXISTS "Admins can delete OD intakes" ON public.od_intake_responses;
CREATE POLICY "Admins can delete OD intakes" ON public.od_intake_responses
FOR DELETE TO authenticated
USING ((SELECT internal.has_role((SELECT auth.uid()), 'super_admin')));

DROP POLICY IF EXISTS "Enable insert for all users" ON public.od_intake_responses;
CREATE POLICY "Enable insert for all users" ON public.od_intake_responses
FOR INSERT TO authenticated
WITH CHECK (
  ((SELECT auth.uid()) IS NOT NULL AND user_id = (SELECT auth.uid()))
);


-- Employer Intakes
DROP POLICY IF EXISTS "Users and admins can update employer intakes" ON public.employer_intake_responses;
CREATE POLICY "Users and admins can update employer intakes" ON public.employer_intake_responses
FOR UPDATE TO authenticated
USING (
  (((SELECT auth.uid()) = user_id) OR (SELECT internal.has_role((SELECT auth.uid()), 'super_admin'))) AND
  (SELECT internal.is_active((SELECT auth.uid())))
)
WITH CHECK (
  (((SELECT auth.uid()) = user_id) OR (SELECT internal.has_role((SELECT auth.uid()), 'super_admin'))) AND
  (SELECT internal.is_active((SELECT auth.uid())))
);

DROP POLICY IF EXISTS "Admins can delete employer intakes" ON public.employer_intake_responses;
CREATE POLICY "Admins can delete employer intakes" ON public.employer_intake_responses
FOR DELETE TO authenticated
USING ((SELECT internal.has_role((SELECT auth.uid()), 'super_admin')));

DROP POLICY IF EXISTS "Enable insert for all users" ON public.employer_intake_responses;
CREATE POLICY "Enable insert for all users" ON public.employer_intake_responses
FOR INSERT TO authenticated
WITH CHECK (
  ((SELECT auth.uid()) IS NOT NULL AND user_id = (SELECT auth.uid()))
);


-- Concierge Matches
DROP POLICY IF EXISTS "Admins can insert matches" ON public.concierge_matches;
CREATE POLICY "Admins can insert matches" ON public.concierge_matches
FOR INSERT TO authenticated
WITH CHECK ((SELECT internal.has_role((SELECT auth.uid()), 'super_admin')));

DROP POLICY IF EXISTS "Admins can update matches" ON public.concierge_matches;
CREATE POLICY "Admins can update matches" ON public.concierge_matches
FOR UPDATE TO authenticated
USING ((SELECT internal.has_role((SELECT auth.uid()), 'super_admin')))
WITH CHECK ((SELECT internal.has_role((SELECT auth.uid()), 'super_admin')));

DROP POLICY IF EXISTS "Admins can delete matches" ON public.concierge_matches;
CREATE POLICY "Admins can delete matches" ON public.concierge_matches
FOR DELETE TO authenticated
USING ((SELECT internal.has_role((SELECT auth.uid()), 'super_admin')));


-- User Roles
DROP POLICY IF EXISTS "Users and admins can view roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;

-- Consolidate into one policy to resolve "multiple_permissive_policies"
CREATE POLICY "Admins manage and users view roles" ON public.user_roles
FOR ALL TO authenticated
USING (
  ((SELECT auth.uid()) = user_id)
  OR
  (SELECT internal.has_role((SELECT auth.uid()), 'super_admin'))
)
WITH CHECK ((SELECT internal.has_role((SELECT auth.uid()), 'super_admin')));

COMMIT;
