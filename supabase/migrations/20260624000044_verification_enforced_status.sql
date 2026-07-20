-- Enforce that profiles are only 'Active' when email is verified.
-- 1. Change default status to 'Pending Verification'
-- 2. Update trigger logic to promote status to 'Active' upon verification.

BEGIN;

-- 1. Update the table default
ALTER TABLE public.profiles ALTER COLUMN status SET DEFAULT 'Pending Verification';

-- 2. Update all existing unverified profiles to 'Pending Verification'
-- unless they are already 'Suspended'
UPDATE public.profiles
SET status = 'Pending Verification'
WHERE email_verified = false AND status = 'Active';

-- 3. Hardened Sync Function
CREATE OR REPLACE FUNCTION public.sync_user_verification()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles
  SET
    email_verified = (NEW.email_confirmed_at IS NOT NULL),
    status = CASE
      -- If they just verified and were pending, move to Active
      WHEN NEW.email_confirmed_at IS NOT NULL AND status = 'Pending Verification' THEN 'Active'
      -- If they were already Active or Suspended, keep that status
      ELSE status
    END,
    updated_at = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Update handle_new_user to set correct initial status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email_verified, status)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    (new.email_confirmed_at IS NOT NULL),
    CASE
      WHEN new.email_confirmed_at IS NOT NULL THEN 'Active'
      ELSE 'Pending Verification'
    END
  );

  -- Assign role if provided in metadata
  IF new.raw_user_meta_data->>'role' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, (new.raw_user_meta_data->>'role')::public.app_role);
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMIT;
