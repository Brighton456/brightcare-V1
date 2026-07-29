
-- Drop the old constraint
ALTER TABLE public.dropdown_options DROP CONSTRAINT IF EXISTS dropdown_options_category_value_key;

-- Add hospital-scoped uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS dropdown_options_hospital_category_value_key ON public.dropdown_options (hospital_id, category, value);
