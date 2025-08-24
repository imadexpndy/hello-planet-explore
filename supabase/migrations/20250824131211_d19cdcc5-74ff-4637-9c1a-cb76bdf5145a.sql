-- Create a super admin user by updating the first user that exists or creating a placeholder
-- This is the proper way to bootstrap the admin access

-- First, let's create a function to safely create admin access
CREATE OR REPLACE FUNCTION create_initial_admin()
RETURNS void AS $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Try to find any existing user to make admin
    SELECT user_id INTO admin_user_id FROM profiles LIMIT 1;
    
    IF admin_user_id IS NULL THEN
        -- Generate a UUID for the admin user
        admin_user_id := gen_random_uuid();
    END IF;
    
    -- Insert or update the profile with super admin privileges
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
        admin_user_id,
        'admin@expndy.com',
        'super_admin',
        'System Administrator',
        'approved',
        true,
        true,
        true,
        now(),
        now()
    ) ON CONFLICT (user_id) DO UPDATE SET
        admin_role = 'super_admin',
        email = 'admin@expndy.com',
        verification_status = 'approved',
        is_verified = true,
        updated_at = now();
        
    RAISE NOTICE 'Admin user created/updated with user_id: %', admin_user_id;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT create_initial_admin();

-- Clean up the function
DROP FUNCTION create_initial_admin();