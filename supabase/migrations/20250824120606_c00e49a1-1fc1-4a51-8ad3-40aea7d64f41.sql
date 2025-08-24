-- Update user roles to support granular admin permissions
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM (
  'b2c_user',
  'teacher_private', 
  'teacher_public',
  'association',
  'partner',
  'admin_spectacles',
  'admin_schools',
  'admin_partners',
  'admin_support',
  'admin_notifications',
  'admin_editor',
  'admin_full',
  'super_admin'
);

-- Create admin invitations table
CREATE TABLE public.admin_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  role user_role NOT NULL,
  invited_by UUID NOT NULL,
  invitation_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for admin invitations
CREATE POLICY "Super admins can manage invitations" 
ON public.admin_invitations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'admin_full')
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_admin_invitations_updated_at
BEFORE UPDATE ON public.admin_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update profiles table to handle admin roles properly
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS admin_permissions JSONB DEFAULT '{}';

-- Create function to check admin permissions
CREATE OR REPLACE FUNCTION public.has_admin_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND (
      role IN ('super_admin', 'admin_full') 
      OR role = ('admin_' || permission_name)::user_role
      OR (admin_permissions->permission_name)::boolean = true
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;