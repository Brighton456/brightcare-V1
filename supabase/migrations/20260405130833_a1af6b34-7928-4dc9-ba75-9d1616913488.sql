
CREATE TABLE public.credit_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id UUID REFERENCES public.hospitals(id),
  sale_id UUID,
  bill_id UUID,
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT,
  amount_credited NUMERIC NOT NULL DEFAULT 0,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on credit_sales" ON public.credit_sales FOR ALL USING (true) WITH CHECK (true);
