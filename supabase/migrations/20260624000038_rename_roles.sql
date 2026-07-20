-- Rename 'client' to 'employer' and 'provider' to 'od' in the app_role enum
-- Note: PostgreSQL 10+ supports renaming enum values

ALTER TYPE public.app_role RENAME VALUE 'client' TO 'employer';
ALTER TYPE public.app_role RENAME VALUE 'provider' TO 'od';

-- Update the has_role helper function if necessary (though it uses role::text so it should be fine)
-- But it's good practice to ensure it works with the new names.

-- Update any metadata-based role assignments in the handle_new_user trigger if they rely on old strings
-- (The existing trigger uses new.raw_user_meta_data->>'role' which will now need to provide 'employer' or 'od')
