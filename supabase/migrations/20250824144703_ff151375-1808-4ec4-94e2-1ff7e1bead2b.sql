-- Fix the RLS policy for admin_invitations table
-- The current policy incorrectly checks the invited user's role instead of the inviting user's role

-- Drop the existing incorrect policy
DROP POLICY IF EXISTS "Super admins can manage invitations" ON public.admin_invitations;

-- Create the correct policy that checks if the current user has super_admin or admin_full role
CREATE POLICY "Super admins can manage invitations" 
ON public.admin_invitations 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.admin_role IN ('super_admin', 'admin_full')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.admin_role IN ('super_admin', 'admin_full')
  )
);