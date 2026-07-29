
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS username text;

-- Generate default usernames from first_name.last_name (lowercase)
UPDATE public.staff SET username = LOWER(first_name || '.' || last_name) WHERE username IS NULL;

-- Make username unique and not null
ALTER TABLE public.staff ALTER COLUMN username SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS staff_username_unique ON public.staff (username);

-- Update Super Admin username
UPDATE public.staff SET username = 'admin' WHERE staff_no = 'SA-001';
