-- Fix: Admin Delete User RPC
-- Moves the delete_user function to the public schema so it can be called via the standard Supabase RPC API.
-- Also ensures strict security checks.

BEGIN;

-- 1. Create the public version of delete_user
CREATE OR REPLACE FUNCTION public.delete_user(target_user_id uuid)
RETURNS void AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Security check: Must be super_admin to delete users
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  ) INTO is_admin;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Access denied. Only Super Admins can delete users.';
  END IF;

  -- Delete from auth.users
  -- This requires the function to be SECURITY DEFINER and owned by a high-privilege role (default in Supabase)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- 2. Security: Revoke execute from public/anon, grant only to authenticated and service_role
REVOKE ALL ON FUNCTION public.delete_user(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user(uuid) TO authenticated, service_role;

-- 3. Cleanup: Remove the old internal version if it exists to avoid confusion
DROP FUNCTION IF EXISTS internal.delete_user(uuid);

COMMIT;
