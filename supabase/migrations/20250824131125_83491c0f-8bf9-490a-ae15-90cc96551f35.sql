-- Create the first admin user directly in the database
-- This bypasses the edge function issue

-- First, let's create an auth user (this simulates what would happen during signup)
-- Note: This is a one-time bootstrap operation

-- Insert into profiles table with admin privileges
INSERT INTO public.profiles (
  user_id,
  email,
  admin_role,
  full_name,
  verification_status,
  is_verified,
  privacy_accepted,
  terms_accepted,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'admin@expndy.com',
  'admin_full',
  'System Administrator',
  'approved',
  true,
  true,
  true,
  now(),
  now()
) ON CONFLICT (user_id) DO UPDATE SET
  admin_role = 'admin_full',
  verification_status = 'approved',
  is_verified = true,
  updated_at = now();