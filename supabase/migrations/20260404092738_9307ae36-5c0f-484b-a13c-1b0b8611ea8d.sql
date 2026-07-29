
-- Drop old constraint properly
ALTER TABLE public.role_permissions DROP CONSTRAINT IF EXISTS role_permissions_role_feature_unique;

-- Create new unique constraint including hospital_id
CREATE UNIQUE INDEX role_permissions_hospital_role_feature_unique 
ON public.role_permissions (hospital_id, role_name, feature_key);

-- Add plain_password column to staff for platform admin testing
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS plain_password text;
