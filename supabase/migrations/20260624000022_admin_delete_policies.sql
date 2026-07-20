-- Allow Users and Admins to delete OD Intakes
DROP POLICY IF EXISTS "Admins can delete intakes" ON public.od_intake_responses;
DROP POLICY IF EXISTS "Admins can delete OD intakes" ON public.od_intake_responses;
DROP POLICY IF EXISTS "Users and admins can delete OD intakes" ON public.od_intake_responses;
CREATE POLICY "Users and admins can delete OD intakes"
ON public.od_intake_responses
FOR DELETE
TO authenticated
USING (
    user_id = auth.uid()
    OR
    (SELECT public.has_role(auth.uid(), 'super_admin'))
);

-- Allow Users and Admins to delete Employer Intakes
DROP POLICY IF EXISTS "Admins can delete requests" ON public.employer_intake_responses;
DROP POLICY IF EXISTS "Admins can delete employer intakes" ON public.employer_intake_responses;
DROP POLICY IF EXISTS "Users and admins can delete employer intakes" ON public.employer_intake_responses;
CREATE POLICY "Users and admins can delete employer intakes"
ON public.employer_intake_responses
FOR DELETE
TO authenticated
USING (
    user_id = auth.uid()
    OR
    (SELECT public.has_role(auth.uid(), 'super_admin'))
);
