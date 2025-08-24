-- Allow Supabase Auth system to insert profiles during user creation
CREATE POLICY IF NOT EXISTS "Auth can insert profiles"
ON public.profiles
FOR INSERT
TO supabase_auth_admin
WITH CHECK (true);

-- Additionally, allow service role to insert profiles if needed by backend jobs
CREATE POLICY IF NOT EXISTS "Service can insert profiles"
ON public.profiles
FOR INSERT
TO service_role
WITH CHECK (true);
