
CREATE OR REPLACE FUNCTION public.hash_password(raw_password text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, extensions
AS $$
  SELECT extensions.crypt(raw_password, extensions.gen_salt('bf', 10))
$$;

CREATE OR REPLACE FUNCTION public.verify_password(raw_password text, hashed text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public, extensions
AS $$
  SELECT hashed = extensions.crypt(raw_password, hashed)
$$;
