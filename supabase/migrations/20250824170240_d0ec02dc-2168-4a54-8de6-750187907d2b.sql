DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Auth can insert profiles'
  ) THEN
    CREATE POLICY "Auth can insert profiles"
    ON public.profiles
    FOR INSERT
    TO supabase_auth_admin
    WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Service can insert profiles'
  ) THEN
    CREATE POLICY "Service can insert profiles"
    ON public.profiles
    FOR INSERT
    TO service_role
    WITH CHECK (true);
  END IF;
END
$$;