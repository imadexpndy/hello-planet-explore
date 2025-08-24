
-- Fix: do not set a non-admin value in admin_role, keep it NULL for normal users.
-- This avoids violating the profiles_admin_role_check constraint.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  insert into public.profiles (user_id, email, admin_role)
  values (
    new.id,
    new.email,
    null  -- keep admin_role null for non-admin users
  );
  return new;
end;
$$;
