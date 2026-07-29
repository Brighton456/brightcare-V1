
-- Add password_hash and session fields to staff table
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS password_hash text DEFAULT NULL;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS must_change_password boolean DEFAULT true;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS session_token text DEFAULT NULL;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS last_login_at timestamptz DEFAULT NULL;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS failed_attempts integer DEFAULT 0;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS locked_until timestamptz DEFAULT NULL;

-- Create extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a function to hash passwords
CREATE OR REPLACE FUNCTION public.hash_password(raw_password text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT crypt(raw_password, gen_salt('bf', 10))
$$;

-- Create a function to verify passwords
CREATE OR REPLACE FUNCTION public.verify_password(raw_password text, hashed text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT hashed = crypt(raw_password, hashed)
$$;

-- Set default password 'changeme' for all existing staff
UPDATE public.staff SET password_hash = public.hash_password('changeme'), must_change_password = true WHERE password_hash IS NULL;
