
CREATE TABLE public.license_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key text NOT NULL UNIQUE,
  hospital_id uuid REFERENCES public.hospitals(id) ON DELETE SET NULL,
  package_id uuid REFERENCES public.license_packages(id),
  status text NOT NULL DEFAULT 'unused',
  duration_months integer NOT NULL DEFAULT 1,
  generated_by uuid,
  activated_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  notes text
);

ALTER TABLE public.license_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on license_keys" ON public.license_keys FOR ALL TO public USING (true) WITH CHECK (true);

-- Add hospital settings columns we need
ALTER TABLE public.hospitals 
  ADD COLUMN IF NOT EXISTS license_key text,
  ADD COLUMN IF NOT EXISTS tax_rate numeric DEFAULT 16,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'KES',
  ADD COLUMN IF NOT EXISTS invoice_prefix text DEFAULT 'BILL-',
  ADD COLUMN IF NOT EXISTS receipt_prefix text DEFAULT 'RCT-',
  ADD COLUMN IF NOT EXISTS default_consultation_fee numeric DEFAULT 500,
  ADD COLUMN IF NOT EXISTS default_followup_fee numeric DEFAULT 300,
  ADD COLUMN IF NOT EXISTS default_emergency_fee numeric DEFAULT 1500;
