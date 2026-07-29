ALTER TABLE public.license_packages ADD COLUMN IF NOT EXISTS price_lifetime numeric DEFAULT NULL;
ALTER TABLE public.license_packages ADD COLUMN IF NOT EXISTS maintenance_monthly numeric DEFAULT 3000;