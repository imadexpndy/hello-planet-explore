-- Create admin user with credentials
-- First, we'll insert a test admin user directly into auth.users (this is handled by the auth system)
-- We'll create the profile for admin access

-- Insert admin profile (the auth user will be created via the application)
INSERT INTO public.profiles (
  user_id,
  email,
  role,
  full_name,
  verification_status,
  is_verified,
  privacy_accepted,
  terms_accepted,
  admin_role
) VALUES (
  'admin-uuid-placeholder', -- This will be replaced with actual user_id after signup
  'admin@theatreapp.com',
  'admin',
  'Administrateur Principal',
  'approved',
  true,
  true,
  true,
  'super_admin'
) ON CONFLICT (user_id) DO NOTHING;

-- Create a function to easily create admin users
CREATE OR REPLACE FUNCTION public.create_admin_user(
  p_email TEXT,
  p_full_name TEXT DEFAULT 'Administrateur',
  p_admin_role TEXT DEFAULT 'admin'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_uuid UUID;
BEGIN
  -- Generate a UUID for the user
  user_uuid := gen_random_uuid();
  
  -- Insert into profiles (the auth user should be created separately via signup)
  INSERT INTO public.profiles (
    user_id,
    email,
    role,
    full_name,
    verification_status,
    is_verified,
    privacy_accepted,
    terms_accepted,
    admin_role
  ) VALUES (
    user_uuid,
    p_email,
    'admin',
    p_full_name,
    'approved',
    true,
    true,
    true,
    p_admin_role
  );
  
  RETURN 'Admin user profile created with UUID: ' || user_uuid::TEXT || '. Use this email to sign up: ' || p_email;
END;
$$;

-- Create the main admin user profile
SELECT public.create_admin_user('admin@theatreapp.com', 'Super Administrateur', 'super_admin');