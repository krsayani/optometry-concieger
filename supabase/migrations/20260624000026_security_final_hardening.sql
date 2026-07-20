-- Final Security Hardening Migration
-- 1. Moves SECURITY DEFINER functions to a non-public 'internal' schema to hide them from the PostgREST API (RPC).
-- 2. Restricts INSERT policies to prevent 'always true' linter warnings.
-- 3. Updates all RLS policies to use the new function locations.

BEGIN;

-- Create internal schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS internal;

-- ==========================================
-- 1. Function Relocation & Hardening
-- ==========================================

-- Move has_role to internal schema
-- We use CASCADE to drop the existing policies that depend on public.has_role
DROP FUNCTION IF EXISTS public.has_role(uuid, text) CASCADE;

CREATE OR REPLACE FUNCTION internal.has_role(uid uuid, target_role text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = uid
    AND role::text = target_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke all from public/anon/auth to hide from API, grant to authenticated for RLS use
REVOKE ALL ON FUNCTION internal.has_role(uuid, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION internal.has_role(uuid, text) TO authenticated, service_role;


-- Move handle_new_user to internal schema
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
CREATE OR REPLACE FUNCTION internal.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );

  IF new.raw_user_meta_data->>'role' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, (new.raw_user_meta_data->>'role')::public.app_role);
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION internal.handle_new_user() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION internal.handle_new_user() TO service_role;

-- Re-create the trigger for handle_new_user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE internal.handle_new_user();


-- Move update_updated_at_column to internal schema
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION internal.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION internal.update_updated_at_column() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION internal.update_updated_at_column() TO service_role;

-- Re-create triggers for updated_at
CREATE OR REPLACE TRIGGER update_od_intake_updated_at
    BEFORE UPDATE ON public.od_intake_responses
    FOR EACH ROW
    EXECUTE PROCEDURE internal.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_employer_intake_updated_at
    BEFORE UPDATE ON public.employer_intake_responses
    FOR EACH ROW
    EXECUTE PROCEDURE internal.update_updated_at_column();


-- ==========================================
-- 2. RLS Policy Updates (Internal Reference)
-- ==========================================
-- NOTE: Policies dropped via CASCADE above are recreated here.

-- Table: public.user_roles
CREATE POLICY "Users and admins can view roles" ON public.user_roles
FOR SELECT TO authenticated
USING (
  (SELECT auth.uid()) = user_id OR
  (SELECT internal.has_role(auth.uid(), 'super_admin'))
);

-- Table: public.od_intake_responses
CREATE POLICY "Users and admins can view intake responses" ON public.od_intake_responses
FOR SELECT TO authenticated
USING (
  (SELECT auth.uid()) = user_id OR
  (SELECT internal.has_role(auth.uid(), 'super_admin'))
);

CREATE POLICY "Users and admins can update OD intakes" ON public.od_intake_responses
FOR UPDATE TO authenticated
USING (
  (SELECT auth.uid()) = user_id OR
  (SELECT internal.has_role(auth.uid(), 'super_admin'))
)
WITH CHECK (
  (SELECT auth.uid()) = user_id OR
  (SELECT internal.has_role(auth.uid(), 'super_admin'))
);

CREATE POLICY "Admins can delete OD intakes" ON public.od_intake_responses
FOR DELETE TO authenticated
USING ((SELECT internal.has_role(auth.uid(), 'super_admin')));

-- Table: public.employer_intake_responses
CREATE POLICY "Users and admins can view employer responses" ON public.employer_intake_responses
FOR SELECT TO authenticated
USING (
  (SELECT auth.uid()) = user_id OR
  (SELECT internal.has_role(auth.uid(), 'super_admin'))
);

CREATE POLICY "Users and admins can update employer intakes" ON public.employer_intake_responses
FOR UPDATE TO authenticated
USING (
  (SELECT auth.uid()) = user_id OR
  (SELECT internal.has_role(auth.uid(), 'super_admin'))
)
WITH CHECK (
  (SELECT auth.uid()) = user_id OR
  (SELECT internal.has_role(auth.uid(), 'super_admin'))
);

CREATE POLICY "Admins can delete employer intakes" ON public.employer_intake_responses
FOR DELETE TO authenticated
USING ((SELECT internal.has_role(auth.uid(), 'super_admin')));


-- ==========================================
-- 3. INSERT Policy Hardening (Not 'Always True')
-- ==========================================
-- These were not dropped by CASCADE but we replace them for consistency.

DROP POLICY IF EXISTS "Enable insert for all users" ON public.od_intake_responses;
CREATE POLICY "Enable insert for all users" ON public.od_intake_responses
FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
  (auth.uid() IS NULL AND user_id IS NULL)
);

DROP POLICY IF EXISTS "Enable insert for all users" ON public.employer_intake_responses;
CREATE POLICY "Enable insert for all users" ON public.employer_intake_responses
FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
  (auth.uid() IS NULL AND user_id IS NULL)
);


-- ==========================================
-- 4. Matching & Storage
-- ==========================================

-- concierge_matches
CREATE POLICY "Admins can insert matches" ON public.concierge_matches
FOR INSERT TO authenticated
WITH CHECK ((SELECT internal.has_role(auth.uid(), 'super_admin')));

CREATE POLICY "Admins can update matches" ON public.concierge_matches
FOR UPDATE TO authenticated
USING ((SELECT internal.has_role(auth.uid(), 'super_admin')))
WITH CHECK ((SELECT internal.has_role(auth.uid(), 'super_admin')));

CREATE POLICY "Admins can delete matches" ON public.concierge_matches
FOR DELETE TO authenticated
USING ((SELECT internal.has_role(auth.uid(), 'super_admin')));

CREATE POLICY "Users and admins can view matches" ON public.concierge_matches
FOR SELECT TO authenticated
USING (
  (SELECT internal.has_role(auth.uid(), 'super_admin')) OR
  EXISTS (SELECT 1 FROM public.od_intake_responses WHERE id = od_intake_id AND user_id = (SELECT auth.uid())) OR
  EXISTS (SELECT 1 FROM public.employer_intake_responses WHERE id = employer_intake_id AND user_id = (SELECT auth.uid()))
);

-- storage.objects (resumes delete)
CREATE POLICY "Admins can delete resumes" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'resumes' AND (SELECT internal.has_role(auth.uid(), 'super_admin')));

COMMIT;
