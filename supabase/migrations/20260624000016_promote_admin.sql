-- This migration provides a way to promote a user to Super Admin by their email.
-- Replace 'admin@example.com' with the email you used to sign up.

DO $$
DECLARE
  target_user_id uuid;
BEGIN
  -- 1. Find the user ID from the auth.users table
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'admin@example.com';

  -- 2. If user exists, insert the super_admin role
  IF target_user_id IS NOT NULL THEN

    -- Ensure a profile exists (it should be created by trigger, but just in case)
    INSERT INTO public.profiles (id, full_name, status)
    VALUES (target_user_id, 'Platform Admin', 'Active')
    ON CONFLICT (id) DO NOTHING;

    -- Assign the super_admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    RAISE NOTICE 'User with email admin@example.com has been promoted to super_admin';
  ELSE
    RAISE NOTICE 'User with email admin@example.com not found. Please sign up first.';
  END IF;
END $$;
