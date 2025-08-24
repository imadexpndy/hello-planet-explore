-- Fix handle_new_user to match current profiles schema (admin_role instead of role)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, admin_role)
  VALUES (
    NEW.id,
    NEW.email,
    'b2c_user'
  );
  RETURN NEW;
END;
$$;

-- Update has_admin_permission to reference admin_role (text) instead of deprecated role/enum
CREATE OR REPLACE FUNCTION public.has_admin_permission(permission_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
      AND (
        admin_role IN ('super_admin', 'admin_full')
        OR admin_role = ('admin_' || permission_name)
        OR COALESCE((admin_permissions ->> permission_name)::boolean, false) = true
      )
  );
END;
$$;