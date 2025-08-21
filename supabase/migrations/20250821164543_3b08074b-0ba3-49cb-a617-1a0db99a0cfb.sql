-- Step 1: Add enum values first
COMMIT;
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';
BEGIN;