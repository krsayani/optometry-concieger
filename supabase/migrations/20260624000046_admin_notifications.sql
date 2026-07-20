-- Admin Notifications System
-- This migration sets up a tracking table and triggers to notify admins
-- when professional profiles are submitted and verified.

BEGIN;

-- 1. Create admin_notifications table
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    type text NOT NULL, -- 'od_intake' or 'employer_intake'
    title text NOT NULL,
    content text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Only Admins can see notifications
CREATE POLICY "Admins can view notifications"
ON public.admin_notifications
FOR SELECT
TO authenticated
USING ((SELECT public.has_role(auth.uid(), 'super_admin')));

-- Only Admins can update notifications (mark as read)
CREATE POLICY "Admins can update notifications"
ON public.admin_notifications
FOR UPDATE
TO authenticated
USING ((SELECT public.has_role(auth.uid(), 'super_admin')))
WITH CHECK ((SELECT public.has_role(auth.uid(), 'super_admin')));


-- 2. Notification Logic Function
CREATE OR REPLACE FUNCTION public.proc_notify_admin()
RETURNS trigger AS $$
DECLARE
    v_user_verified boolean;
    v_full_name text;
    v_email text;
    v_type text;
    v_intake_exists boolean := false;
BEGIN
    -- This function handles triggers from 3 tables: profiles, od_intake_responses, employer_intake_responses

    IF (TG_TABLE_NAME = 'profiles') THEN
        -- Triggered when a profile is updated (verification status change)
        IF (NEW.email_verified = true AND (OLD.email_verified = false OR OLD.email_verified IS NULL)) THEN
            -- Check for OD intake
            IF EXISTS (SELECT 1 FROM public.od_intake_responses WHERE user_id = NEW.id) THEN
                INSERT INTO public.admin_notifications (user_id, type, title, content)
                VALUES (
                    NEW.id,
                    'od_intake',
                    'New Verified OD Profile',
                    'User ' || COALESCE(NEW.full_name, 'Unknown') || ' has verified their email and completed an OD Career Profile.'
                );
            END IF;

            -- Check for Employer intake
            IF EXISTS (SELECT 1 FROM public.employer_intake_responses WHERE user_id = NEW.id) THEN
                INSERT INTO public.admin_notifications (user_id, type, title, content)
                VALUES (
                    NEW.id,
                    'employer_intake',
                    'New Verified Employer Profile',
                    'User ' || COALESCE(NEW.full_name, 'Unknown') || ' has verified their email and completed a Practice Profile.'
                );
            END IF;
        END IF;

    ELSIF (TG_TABLE_NAME = 'od_intake_responses' OR TG_TABLE_NAME = 'employer_intake_responses') THEN
        -- Triggered when an intake form is submitted
        -- We only notify if the user is ALREADY verified. If not, the profile trigger will catch them later.
        SELECT email_verified, full_name INTO v_user_verified, v_full_name
        FROM public.profiles
        WHERE id = NEW.user_id;

        IF (v_user_verified = true) THEN
            v_type := CASE WHEN TG_TABLE_NAME = 'od_intake_responses' THEN 'od_intake' ELSE 'employer_intake' END;

            INSERT INTO public.admin_notifications (user_id, type, title, content)
            VALUES (
                NEW.user_id,
                v_type,
                'New Professional Profile (' || CASE WHEN v_type = 'od_intake' THEN 'OD' ELSE 'Employer' END || ')',
                'Verified user ' || COALESCE(v_full_name, 'Unknown') || ' has submitted a new ' || CASE WHEN v_type = 'od_intake' THEN 'Career' ELSE 'Practice' END || ' profile.'
            );
        END IF;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 3. Create Triggers
DROP TRIGGER IF EXISTS tr_notify_admin_on_verification ON public.profiles;
CREATE TRIGGER tr_notify_admin_on_verification
    AFTER UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.proc_notify_admin();

DROP TRIGGER IF EXISTS tr_notify_admin_on_od_intake ON public.od_intake_responses;
CREATE TRIGGER tr_notify_admin_on_od_intake
    AFTER INSERT ON public.od_intake_responses
    FOR EACH ROW EXECUTE FUNCTION public.proc_notify_admin();

DROP TRIGGER IF EXISTS tr_notify_admin_on_emp_intake ON public.employer_intake_responses;
CREATE TRIGGER tr_notify_admin_on_emp_intake
    AFTER INSERT ON public.employer_intake_responses
    FOR EACH ROW EXECUTE FUNCTION public.proc_notify_admin();

COMMIT;
