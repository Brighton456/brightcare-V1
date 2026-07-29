
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL DEFAULT '',
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on platform_settings" ON public.platform_settings FOR ALL USING (true) WITH CHECK (true);

-- Seed default values
INSERT INTO public.platform_settings (key, value) VALUES
  ('support_email', 'support@brightcare.co.ke'),
  ('support_phone', '+254 720363215'),
  ('support_phone_2', '+254 742758711'),
  ('whatsapp_number', '+254 720363215'),
  ('emergency_phone', '+254 742758711'),
  ('website_url', 'https://brightcare.co.ke'),
  ('office_address', 'Nairobi, Kenya'),
  ('working_hours', 'Mon-Fri, 8:00 AM - 6:00 PM EAT')
ON CONFLICT (key) DO NOTHING;
