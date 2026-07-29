
-- Enable RLS on all tables (allowing public read for now since no auth yet)
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_sale_items ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (will be tightened when auth is added)
CREATE POLICY "Allow all on departments" ON public.departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on patients" ON public.patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on staff" ON public.staff FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on consultations" ON public.consultations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on prescriptions" ON public.prescriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on prescription_items" ON public.prescription_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on lab_tests" ON public.lab_tests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on medicines" ON public.medicines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on bills" ON public.bills FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on bill_items" ON public.bill_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on appointments" ON public.appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on activity_log" ON public.activity_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on pharmacy_sales" ON public.pharmacy_sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on pharmacy_sale_items" ON public.pharmacy_sale_items FOR ALL USING (true) WITH CHECK (true);

-- Insert default departments
INSERT INTO public.departments (name, description) VALUES
  ('General Medicine', 'General outpatient consultations'),
  ('Pediatrics', 'Child healthcare services'),
  ('Surgery', 'Surgical procedures and care'),
  ('Obstetrics & Gynecology', 'Maternal and reproductive health'),
  ('Pharmacy', 'Medicine dispensing and management'),
  ('Laboratory', 'Diagnostic testing services'),
  ('Radiology', 'Imaging and diagnostics'),
  ('Emergency', 'Emergency medical services'),
  ('Dental', 'Dental care services'),
  ('Ophthalmology', 'Eye care services');
