-- Add DELETE policy for admin_notifications
-- This allows administrators to clear notification history

BEGIN;

-- Policy to allow super_admins to delete notifications
CREATE POLICY "Admins can delete notifications"
ON public.admin_notifications
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

COMMIT;
