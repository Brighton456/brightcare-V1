
-- License packages (tiers)
CREATE TABLE public.license_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  price_monthly numeric NOT NULL DEFAULT 0,
  price_yearly numeric,
  stripe_price_id_monthly text,
  stripe_price_id_yearly text,
  allowed_modules text[] NOT NULL DEFAULT '{}',
  max_staff integer DEFAULT 50,
  max_patients integer,
  description text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Hospitals (tenants)
CREATE TABLE public.hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  address text,
  city text,
  country text DEFAULT 'Kenya',
  phone text,
  email text,
  website text,
  license_package_id uuid REFERENCES public.license_packages(id),
  license_status text NOT NULL DEFAULT 'trial',
  license_started_at timestamptz,
  license_expires_at timestamptz,
  trial_ends_at timestamptz DEFAULT (now() + interval '14 days'),
  stripe_customer_id text,
  stripe_subscription_id text,
  grace_period_days integer DEFAULT 7,
  is_active boolean DEFAULT true,
  created_by uuid,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- License audit log
CREATE TABLE public.license_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid REFERENCES public.hospitals(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL,
  details text,
  performed_by uuid,
  old_package text,
  new_package text,
  created_at timestamptz DEFAULT now()
);

-- Add-ons
CREATE TABLE public.hospital_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid REFERENCES public.hospitals(id) ON DELETE CASCADE NOT NULL,
  addon_type text NOT NULL,
  addon_name text NOT NULL,
  quantity integer DEFAULT 1,
  price numeric DEFAULT 0,
  stripe_subscription_item_id text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Add hospital_id to all core tables
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.medicines ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.prescription_items ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.lab_tests ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.lab_consumables ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.lab_test_consumables ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.pharmacy_sales ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.pharmacy_sale_items ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.bill_items ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.beds ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.wards ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.internal_messages ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.activity_log ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.role_permissions ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.module_settings ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.dropdown_options ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.business_hours ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.billing_settings ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.financial_settlements ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.staff_checkins ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.staff_salaries ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.nursing_notes ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.vitals_records ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.inactive_days ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.payment_method_permissions ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);

-- Enable RLS on new tables
ALTER TABLE public.license_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on license_packages" ON public.license_packages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on hospitals" ON public.hospitals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on license_audit_log" ON public.license_audit_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on hospital_addons" ON public.hospital_addons FOR ALL USING (true) WITH CHECK (true);
