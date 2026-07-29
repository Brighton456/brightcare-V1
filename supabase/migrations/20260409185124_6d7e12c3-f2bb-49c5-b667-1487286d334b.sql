
ALTER TABLE public.announcements
ADD COLUMN IF NOT EXISTS created_by_name text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS created_by_role text DEFAULT NULL;
