
-- Add unique constraint for proper upsert on role_permissions
ALTER TABLE public.role_permissions 
ADD CONSTRAINT role_permissions_unique_key UNIQUE (hospital_id, role_name, feature_key);
