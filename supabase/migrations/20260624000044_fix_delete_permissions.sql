-- Final fix for delete permissions to ensure users can delete their own records
-- regardless of previous restricted admin-only policies.

-- OD Intakes
DROP POLICY IF EXISTS "Admins can delete intakes" ON public.od_intake_responses;
DROP POLICY IF EXISTS "Admins can delete OD intakes" ON public.od_intake_responses;
DROP POLICY IF EXISTS "Users and admins can delete OD intakes" ON public.od_intake_responses;

CREATE POLICY "Users and admins can delete OD intakes"
ON public.od_intake_responses
FOR DELETE
TO authenticated
USING (
    (user_id = (SELECT auth.uid()))
    OR
    (SELECT public.has_role((SELECT auth.uid()), 'super_admin'))
);

-- Employer Intakes
DROP POLICY IF EXISTS "Admins can delete requests" ON public.employer_intake_responses;
DROP POLICY IF EXISTS "Admins can delete employer intakes" ON public.employer_intake_responses;
DROP POLICY IF EXISTS "Users and admins can delete employer intakes" ON public.employer_intake_responses;

CREATE POLICY "Users and admins can delete employer intakes"
ON public.employer_intake_responses
FOR DELETE
TO authenticated
USING (
    (user_id = (SELECT auth.uid()))
    OR
    (SELECT public.has_role((SELECT auth.uid()), 'super_admin'))
);
