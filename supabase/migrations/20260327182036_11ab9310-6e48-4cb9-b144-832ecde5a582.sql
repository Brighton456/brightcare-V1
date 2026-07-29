
-- Lab consumables/equipment catalog
CREATE TABLE public.lab_consumables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  unit TEXT DEFAULT 'piece',
  size_or_type TEXT,
  cost_per_unit NUMERIC DEFAULT 0,
  stock INTEGER DEFAULT 0,
  reorder_level INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.lab_consumables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on lab_consumables" ON public.lab_consumables FOR ALL TO public USING (true) WITH CHECK (true);

-- Link consumables to specific test types
CREATE TABLE public.lab_test_consumables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name TEXT NOT NULL,
  consumable_id UUID REFERENCES public.lab_consumables(id) ON DELETE CASCADE,
  quantity_per_test INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.lab_test_consumables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on lab_test_consumables" ON public.lab_test_consumables FOR ALL TO public USING (true) WITH CHECK (true);

-- Dynamic dropdown options table for system-wide configurable dropdowns
CREATE TABLE public.dropdown_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(category, value)
);
ALTER TABLE public.dropdown_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on dropdown_options" ON public.dropdown_options FOR ALL TO public USING (true) WITH CHECK (true);

-- Seed default dropdown options
INSERT INTO public.dropdown_options (category, label, value, sort_order) VALUES
-- Frequencies
('prescription_frequency', 'Once daily (OD)', 'once_daily', 1),
('prescription_frequency', 'Twice daily (BD)', 'twice_daily', 2),
('prescription_frequency', 'Three times daily (TDS)', 'three_times_daily', 3),
('prescription_frequency', 'Four times daily (QDS)', 'four_times_daily', 4),
('prescription_frequency', 'Every 4 hours', 'every_4_hours', 5),
('prescription_frequency', 'Every 6 hours', 'every_6_hours', 6),
('prescription_frequency', 'Every 8 hours', 'every_8_hours', 7),
('prescription_frequency', 'Every 12 hours', 'every_12_hours', 8),
('prescription_frequency', 'At bedtime (Nocte)', 'at_bedtime', 9),
('prescription_frequency', 'As needed (PRN)', 'as_needed', 10),
('prescription_frequency', 'Weekly', 'weekly', 11),
('prescription_frequency', 'STAT (Immediately)', 'stat', 12),
-- Durations
('prescription_duration', '3 days', '3_days', 1),
('prescription_duration', '5 days', '5_days', 2),
('prescription_duration', '7 days', '7_days', 3),
('prescription_duration', '10 days', '10_days', 4),
('prescription_duration', '14 days', '14_days', 5),
('prescription_duration', '21 days', '21_days', 6),
('prescription_duration', '30 days', '30_days', 7),
('prescription_duration', '60 days', '60_days', 8),
('prescription_duration', '90 days', '90_days', 9),
('prescription_duration', 'Continuous', 'continuous', 10),
-- Dosage forms
('dosage_form', 'Tablet', 'tablet', 1),
('dosage_form', 'Capsule', 'capsule', 2),
('dosage_form', 'Syrup', 'syrup', 3),
('dosage_form', 'Injection', 'injection', 4),
('dosage_form', 'Cream/Ointment', 'cream', 5),
('dosage_form', 'Drops', 'drops', 6),
('dosage_form', 'Inhaler', 'inhaler', 7),
('dosage_form', 'Suppository', 'suppository', 8),
-- Visit types
('visit_type', 'Outpatient', 'outpatient', 1),
('visit_type', 'Inpatient', 'inpatient', 2),
('visit_type', 'Emergency', 'emergency', 3),
('visit_type', 'Follow-up', 'follow_up', 4),
('visit_type', 'Telemedicine', 'telemedicine', 5),
('visit_type', 'Home Visit', 'home_visit', 6),
-- Ward types
('ward_type', 'General', 'general', 1),
('ward_type', 'Pediatric', 'pediatric', 2),
('ward_type', 'Maternity', 'maternity', 3),
('ward_type', 'ICU', 'icu', 4),
('ward_type', 'Surgical', 'surgical', 5),
('ward_type', 'Private', 'private', 6),
-- Lab test categories
('lab_test_category', 'Hematology', 'hematology', 1),
('lab_test_category', 'Biochemistry', 'biochemistry', 2),
('lab_test_category', 'Microbiology', 'microbiology', 3),
('lab_test_category', 'Serology', 'serology', 4),
('lab_test_category', 'Urinalysis', 'urinalysis', 5),
('lab_test_category', 'Parasitology', 'parasitology', 6),
('lab_test_category', 'Immunology', 'immunology', 7),
('lab_test_category', 'Histopathology', 'histopathology', 8),
-- Medicine categories
('medicine_category', 'Antibiotics', 'antibiotics', 1),
('medicine_category', 'Analgesics', 'analgesics', 2),
('medicine_category', 'Antivirals', 'antivirals', 3),
('medicine_category', 'Antifungals', 'antifungals', 4),
('medicine_category', 'Antimalarials', 'antimalarials', 5),
('medicine_category', 'Cardiovascular', 'cardiovascular', 6),
('medicine_category', 'Gastrointestinal', 'gastrointestinal', 7),
('medicine_category', 'Respiratory', 'respiratory', 8),
('medicine_category', 'Vitamins & Supplements', 'vitamins', 9),
('medicine_category', 'Dermatological', 'dermatological', 10),
-- Admission types
('admission_type', 'Planned', 'planned', 1),
('admission_type', 'Emergency', 'emergency', 2),
('admission_type', 'Transfer', 'transfer', 3),
('admission_type', 'Day Case', 'day_case', 4),
-- Blood types
('blood_type', 'A+', 'a_positive', 1),
('blood_type', 'A-', 'a_negative', 2),
('blood_type', 'B+', 'b_positive', 3),
('blood_type', 'B-', 'b_negative', 4),
('blood_type', 'AB+', 'ab_positive', 5),
('blood_type', 'AB-', 'ab_negative', 6),
('blood_type', 'O+', 'o_positive', 7),
('blood_type', 'O-', 'o_negative', 8),
-- Gender
('gender', 'Male', 'male', 1),
('gender', 'Female', 'female', 2),
('gender', 'Other', 'other', 3)
ON CONFLICT (category, value) DO NOTHING;

-- Internal messaging table
CREATE TABLE public.internal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_department TEXT NOT NULL,
  recipient_department TEXT NOT NULL,
  sender_staff_id UUID REFERENCES public.staff(id),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '6 hours'),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.internal_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on internal_messages" ON public.internal_messages FOR ALL TO public USING (true) WITH CHECK (true);

-- Supply lead time tracking
ALTER TABLE public.medicines ADD COLUMN IF NOT EXISTS lead_time_days INTEGER DEFAULT 0;
ALTER TABLE public.medicines ADD COLUMN IF NOT EXISTS last_ordered_at TIMESTAMPTZ;
