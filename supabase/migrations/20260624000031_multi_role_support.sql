-- Function to safely add a role to a user
-- Hardened with search_path and ownership checks to satisfy Supabase security linting
CREATE OR REPLACE FUNCTION public.ensure_user_role(target_user_id uuid, target_role public.app_role)
RETURNS void AS $$
BEGIN
  -- Security: Only allow the user to add a role to themselves
  -- This prevents malicious users from assigning roles to others.
  IF (SELECT auth.uid()) <> target_user_id THEN
    RAISE EXCEPTION 'Permission denied. You can only assign roles to your own account.';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, target_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke permissions from unauthenticated users
REVOKE ALL ON FUNCTION public.ensure_user_role(uuid, public.app_role) FROM public, anon;
-- Only allow logged-in users and the system to execute this
GRANT EXECUTE ON FUNCTION public.ensure_user_role(uuid, public.app_role) TO authenticated, service_role;
