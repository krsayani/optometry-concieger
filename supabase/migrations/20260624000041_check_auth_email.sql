-- Function to check if an email exists in Supabase Auth directly
-- This is more reliable than checking intake tables because it covers users who signed up but didn't finish the form.

CREATE OR REPLACE FUNCTION public.check_auth_user_exists(email_input text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users WHERE email = LOWER(email_input)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = auth, public;

-- Security: Revoke execute from public/anon, grant only to authenticated and service_role
-- Actually, for signup forms, we need 'anon' to be able to check availability.
-- If you are worried about email enumeration, you can remove 'anon' and only check on submit.
-- But for UX, we will allow 'anon' for now.
REVOKE ALL ON FUNCTION public.check_auth_user_exists(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_auth_user_exists(text) TO anon, authenticated, service_role;
