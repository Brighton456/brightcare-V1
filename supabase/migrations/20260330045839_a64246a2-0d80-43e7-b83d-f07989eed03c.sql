ALTER TABLE public.hospitals
ADD COLUMN IF NOT EXISTS license_payment_mode text NOT NULL DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS maintenance_due_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS maintenance_last_paid_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS maintenance_warning_days integer NOT NULL DEFAULT 7;

CREATE INDEX IF NOT EXISTS idx_hospitals_maintenance_due_at
ON public.hospitals (maintenance_due_at);