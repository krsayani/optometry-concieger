-- Hardening trigger functions to resolve Supabase security linter warnings
-- 1. Set explicit search_path to prevent path hijacking
-- 2. Revoke public/authenticated execute permissions on internal trigger functions

-- Update sync_user_verification
CREATE OR REPLACE FUNCTION public.sync_user_verification()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles
  SET
    email_verified = (NEW.email_confirmed_at IS NOT NULL),
    updated_at = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email_verified)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    (new.email_confirmed_at IS NOT NULL)
  );

  -- Assign role if provided in metadata
  IF new.raw_user_meta_data->>'role' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, (new.raw_user_meta_data->>'role')::public.app_role);
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update has_role
CREATE OR REPLACE FUNCTION public.has_role(uid uuid, target_role text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = uid
    AND role::text = target_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke permissions to prevent these from being called via RPC
REVOKE ALL ON FUNCTION public.sync_user_verification() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, text) FROM public, anon, authenticated;

-- Re-grant execute on has_role only to authenticated/service (it's often used in RLS)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated, service_role;

