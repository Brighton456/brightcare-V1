
-- Lab service bundles: each bundle is a single line item on the patient bill
CREATE TABLE public.lab_service_bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id UUID REFERENCES public.hospitals(id),
  service_name TEXT NOT NULL,
  service_code TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  category TEXT DEFAULT 'general',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.lab_service_bundles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on lab_service_bundles" ON public.lab_service_bundles FOR ALL USING (true) WITH CHECK (true);

-- Link consumables to each bundle
CREATE TABLE public.lab_service_consumables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_bundle_id UUID NOT NULL REFERENCES public.lab_service_bundles(id) ON DELETE CASCADE,
  consumable_id UUID REFERENCES public.lab_consumables(id),
  consumable_name TEXT NOT NULL,
  quantity_required INTEGER NOT NULL DEFAULT 1,
  hospital_id UUID REFERENCES public.hospitals(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.lab_service_consumables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on lab_service_consumables" ON public.lab_service_consumables FOR ALL USING (true) WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_lab_service_bundles_hospital ON public.lab_service_bundles(hospital_id);
CREATE INDEX idx_lab_service_consumables_bundle ON public.lab_service_consumables(service_bundle_id);
