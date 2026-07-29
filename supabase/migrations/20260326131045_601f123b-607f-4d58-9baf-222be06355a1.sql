
-- Inpatient & Ward Management tables
CREATE TABLE public.wards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  ward_type TEXT DEFAULT 'general',
  total_beds INTEGER DEFAULT 0,
  floor TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.wards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on wards" ON public.wards FOR ALL TO public USING (true) WITH CHECK (true);

CREATE TABLE public.beds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_id UUID REFERENCES public.wards(id) ON DELETE CASCADE NOT NULL,
  bed_number TEXT NOT NULL,
  bed_type TEXT DEFAULT 'standard',
  status TEXT DEFAULT 'available',
  daily_rate NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on beds" ON public.beds FOR ALL TO public USING (true) WITH CHECK (true);

CREATE TABLE public.admissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_no TEXT NOT NULL,
  patient_id UUID REFERENCES public.patients(id) NOT NULL,
  bed_id UUID REFERENCES public.beds(id),
  doctor_id UUID REFERENCES public.staff(id),
  admission_type TEXT DEFAULT 'planned',
  reason TEXT,
  diagnosis TEXT,
  status TEXT DEFAULT 'admitted',
  admitted_at TIMESTAMPTZ DEFAULT now(),
  discharged_at TIMESTAMPTZ,
  discharge_summary TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on admissions" ON public.admissions FOR ALL TO public USING (true) WITH CHECK (true);

CREATE TABLE public.vitals_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id UUID REFERENCES public.admissions(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) NOT NULL,
  recorded_by UUID REFERENCES public.staff(id),
  blood_pressure TEXT,
  pulse INTEGER,
  temperature NUMERIC,
  respiratory_rate INTEGER,
  spo2 INTEGER,
  weight NUMERIC,
  height NUMERIC,
  blood_sugar NUMERIC,
  pain_level INTEGER,
  notes TEXT,
  recorded_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.vitals_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on vitals_records" ON public.vitals_records FOR ALL TO public USING (true) WITH CHECK (true);

CREATE TABLE public.nursing_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id UUID REFERENCES public.admissions(id) ON DELETE CASCADE NOT NULL,
  nurse_id UUID REFERENCES public.staff(id),
  note_type TEXT DEFAULT 'general',
  content TEXT NOT NULL,
  shift TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.nursing_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on nursing_notes" ON public.nursing_notes FOR ALL TO public USING (true) WITH CHECK (true);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.admissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vitals_records;
