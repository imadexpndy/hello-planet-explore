-- Create the auth user for admin access
-- This requires using the service role to create the user directly

-- First get the user_id from the profile we created
DO $$
DECLARE
    admin_profile_id uuid;
BEGIN
    SELECT user_id INTO admin_profile_id FROM profiles WHERE email = 'admin@expndy.com';
    
    IF admin_profile_id IS NOT NULL THEN
        RAISE NOTICE 'Profile found with user_id: %', admin_profile_id;
        RAISE NOTICE 'You can now create this user in Supabase Auth with email: admin@expndy.com';
        RAISE NOTICE 'Or use the edge function with the correct token';
    END IF;
END $$;