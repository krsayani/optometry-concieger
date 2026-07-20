-- Migration to sync email verification status from auth.users to public.profiles
-- This allows admins and the frontend to see if a user has confirmed their email.

-- 1. Add the column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;

-- 2. Create the sync function
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger on auth.users
-- This trigger will fire whenever the user's confirmation status changes in Supabase Auth
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.sync_user_verification();

-- 4. Update the handle_new_user function to set the initial verification status
-- (In case some providers verify instantly or it's pre-confirmed)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Backfill existing data
DO $$
BEGIN
  UPDATE public.profiles p
  SET email_verified = (u.email_confirmed_at IS NOT NULL)
  FROM auth.users u
  WHERE p.id = u.id;
END $$;
