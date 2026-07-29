
ALTER TABLE public.prescription_items 
ADD COLUMN IF NOT EXISTS item_type text NOT NULL DEFAULT 'medicine',
ADD COLUMN IF NOT EXISTS service_bundle_id uuid REFERENCES public.lab_service_bundles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS unit_price numeric DEFAULT 0;
