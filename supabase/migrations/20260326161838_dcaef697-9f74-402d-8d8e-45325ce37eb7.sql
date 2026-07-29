
-- Financial settlements / cash transfer system
CREATE TABLE public.financial_settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES public.staff(id),
  period_type text NOT NULL DEFAULT 'daily', -- daily, weekly, monthly
  period_start timestamp with time zone NOT NULL,
  period_end timestamp with time zone NOT NULL,
  cash_total numeric DEFAULT 0,
  mpesa_total numeric DEFAULT 0,
  card_total numeric DEFAULT 0,
  credit_total numeric DEFAULT 0,
  gift_total numeric DEFAULT 0,
  account_total numeric DEFAULT 0,
  grand_total numeric DEFAULT 0,
  status text DEFAULT 'pending', -- pending, submitted, verified, rejected
  submitted_at timestamp with time zone,
  verified_by uuid REFERENCES public.staff(id),
  verified_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.financial_settlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on financial_settlements" ON public.financial_settlements FOR ALL TO public USING (true) WITH CHECK (true);

-- Staff check-in system
CREATE TABLE public.staff_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES public.staff(id) NOT NULL,
  check_in_time timestamp with time zone DEFAULT now(),
  check_out_time timestamp with time zone,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text DEFAULT 'checked_in',
  notes text,
  UNIQUE(staff_id, date)
);
ALTER TABLE public.staff_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on staff_checkins" ON public.staff_checkins FOR ALL TO public USING (true) WITH CHECK (true);

-- In-app notifications with auto-expiry
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_staff_id uuid REFERENCES public.staff(id),
  sender_staff_id uuid REFERENCES public.staff(id),
  title text NOT NULL,
  message text NOT NULL,
  module text,
  reference_id uuid,
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on notifications" ON public.notifications FOR ALL TO public USING (true) WITH CHECK (true);

-- Role-based feature permissions (300+ features)
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text NOT NULL,
  feature_key text NOT NULL,
  is_enabled boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(role_name, feature_key)
);
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on role_permissions" ON public.role_permissions FOR ALL TO public USING (true) WITH CHECK (true);

-- Payment method permissions per role
CREATE TABLE public.payment_method_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text NOT NULL,
  payment_method text NOT NULL, -- cash, mpesa, card, credit, gift, account
  is_allowed boolean DEFAULT true,
  UNIQUE(role_name, payment_method)
);
ALTER TABLE public.payment_method_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on payment_method_permissions" ON public.payment_method_permissions FOR ALL TO public USING (true) WITH CHECK (true);

-- Business hours configuration
CREATE TABLE public.business_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week integer NOT NULL, -- 0=Sun, 1=Mon...6=Sat
  is_active boolean DEFAULT true,
  open_time time NOT NULL DEFAULT '08:00',
  close_time time NOT NULL DEFAULT '17:00',
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(day_of_week)
);
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on business_hours" ON public.business_hours FOR ALL TO public USING (true) WITH CHECK (true);

-- Insert default business hours
INSERT INTO public.business_hours (day_of_week, is_active, open_time, close_time) VALUES
  (0, false, '08:00', '17:00'),
  (1, true, '08:00', '17:00'),
  (2, true, '08:00', '17:00'),
  (3, true, '08:00', '17:00'),
  (4, true, '08:00', '17:00'),
  (5, true, '08:00', '17:00'),
  (6, true, '08:00', '13:00');

-- Inactive days (holidays, closures)
CREATE TABLE public.inactive_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  reason text,
  marked_by uuid REFERENCES public.staff(id),
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.inactive_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on inactive_days" ON public.inactive_days FOR ALL TO public USING (true) WITH CHECK (true);

-- Staff salaries for profit calculation
CREATE TABLE public.staff_salaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES public.staff(id) NOT NULL UNIQUE,
  base_salary numeric DEFAULT 0,
  allowances numeric DEFAULT 0,
  deductions numeric DEFAULT 0,
  net_salary numeric DEFAULT 0,
  pay_frequency text DEFAULT 'monthly',
  effective_from date DEFAULT CURRENT_DATE,
  updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.staff_salaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on staff_salaries" ON public.staff_salaries FOR ALL TO public USING (true) WITH CHECK (true);

-- Billing strategy settings
CREATE TABLE public.billing_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_mode text DEFAULT 'realtime', -- realtime, cumulative, hybrid
  cumulative_threshold numeric DEFAULT 50000,
  auto_bill_on_discharge boolean DEFAULT true,
  auto_verify_insurance boolean DEFAULT true,
  require_payment_confirmation boolean DEFAULT true,
  checkin_required boolean DEFAULT false,
  notification_expiry_hours integer DEFAULT 3,
  updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.billing_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on billing_settings" ON public.billing_settings FOR ALL TO public USING (true) WITH CHECK (true);

INSERT INTO public.billing_settings (billing_mode) VALUES ('hybrid');
