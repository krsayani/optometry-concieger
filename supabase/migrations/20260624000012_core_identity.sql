-- 1. Create custom roles enum
CREATE TYPE public.app_role AS ENUM ('client', 'provider', 'super_admin');

-- 2. Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  status text DEFAULT 'Active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- 4. Create has_role helper function
CREATE OR REPLACE FUNCTION public.has_role(uid uuid, target_role text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = uid
    AND role::text = target_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );

  -- Assign role if provided in metadata
  IF new.raw_user_meta_data->>'role' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, (new.raw_user_meta_data->>'role')::public.app_role);
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create the trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 8. Policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((select auth.uid()) = id);

CREATE POLICY "Users and admins can view roles" ON public.user_roles FOR SELECT TO authenticated USING (
  (select auth.uid()) = user_id OR
  (SELECT public.has_role(auth.uid(), 'super_admin'))
);

DROP POLICY IF EXISTS "Roles are viewable by admins" ON public.user_roles;
DROP POLICY IF EXISTS "Users can see own roles" ON public.user_roles;

GRANT ALL ON public.profiles TO anon, authenticated, service_role;
GRANT ALL ON public.user_roles TO anon, authenticated, service_role;
