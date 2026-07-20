-- 1. Allow ODs to update their own career profile
CREATE POLICY "Users can update own intake"
ON public.od_intake_responses
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- 2. Allow Employers to update their own practice details
CREATE POLICY "Users can update own request"
ON public.employer_intake_responses
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);
