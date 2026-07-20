-- Allow Admins to update OD Intakes
DROP POLICY IF EXISTS "Admins can update intakes" ON public.od_intake_responses;
DROP POLICY IF EXISTS "Admins can update OD intakes" ON public.od_intake_responses;
CREATE POLICY "Admins can update OD intakes"
ON public.od_intake_responses
FOR UPDATE
TO authenticated
USING ((SELECT public.has_role(auth.uid(), 'super_admin')))
WITH CHECK ((SELECT public.has_role(auth.uid(), 'super_admin')));

-- Allow Admins to update Employer Intakes
DROP POLICY IF EXISTS "Admins can update requests" ON public.employer_intake_responses;
DROP POLICY IF EXISTS "Admins can update employer intakes" ON public.employer_intake_responses;
CREATE POLICY "Admins can update employer intakes"
ON public.employer_intake_responses
FOR UPDATE
TO authenticated
USING ((SELECT public.has_role(auth.uid(), 'super_admin')))
WITH CHECK ((SELECT public.has_role(auth.uid(), 'super_admin')));
