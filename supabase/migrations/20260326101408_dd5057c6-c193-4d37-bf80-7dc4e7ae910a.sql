
-- Departments
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  head_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Patients
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_no TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('Male','Female','Other')),
  phone TEXT,
  email TEXT,
  id_number TEXT,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  blood_type TEXT,
  allergies TEXT[],
  chronic_conditions TEXT[],
  insurance_provider TEXT,
  insurance_number TEXT,
  photo_url TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Doctors / Staff
CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  staff_no TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin','hospital_admin','doctor','nurse','receptionist','pharmacist','cashier','lab_technician','accountant','records_officer')),
  department_id UUID REFERENCES public.departments(id),
  specialization TEXT,
  phone TEXT,
  email TEXT,
  license_number TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Consultations
CREATE TABLE public.consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  doctor_id UUID NOT NULL REFERENCES public.staff(id),
  consultation_no TEXT UNIQUE NOT NULL,
  visit_type TEXT DEFAULT 'outpatient' CHECK (visit_type IN ('outpatient','inpatient','emergency','follow_up')),
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting','in_progress','completed','cancelled')),
  chief_complaint TEXT,
  symptoms TEXT,
  diagnosis TEXT,
  diagnosis_code TEXT,
  treatment_plan TEXT,
  doctor_notes TEXT,
  vitals JSONB,
  consultation_fee NUMERIC(10,2) DEFAULT 0,
  follow_up_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Prescriptions
CREATE TABLE public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID NOT NULL REFERENCES public.consultations(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  doctor_id UUID NOT NULL REFERENCES public.staff(id),
  prescription_no TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','dispensed','partially_dispensed','cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.prescription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  medicine_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  dispensed_qty INTEGER DEFAULT 0,
  instructions TEXT
);

-- Lab Tests
CREATE TABLE public.lab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES public.consultations(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  requested_by UUID NOT NULL REFERENCES public.staff(id),
  performed_by UUID REFERENCES public.staff(id),
  test_no TEXT UNIQUE NOT NULL,
  test_name TEXT NOT NULL,
  test_category TEXT,
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested','sample_collected','in_progress','completed','cancelled')),
  results TEXT,
  result_file_url TEXT,
  normal_range TEXT,
  is_abnormal BOOLEAN DEFAULT false,
  fee NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  requested_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Medicines (persistent)
CREATE TABLE public.medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  generic_name TEXT,
  brand TEXT,
  category TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost_price NUMERIC(10,2) DEFAULT 0,
  stock INTEGER DEFAULT 0,
  batch_no TEXT,
  expiry_date DATE,
  requires_prescription BOOLEAN DEFAULT false,
  unit TEXT DEFAULT 'tablet',
  reorder_level INTEGER DEFAULT 10,
  supplier TEXT,
  barcode TEXT,
  shelf_location TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Billing
CREATE TABLE public.bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  consultation_id UUID REFERENCES public.consultations(id),
  bill_no TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','partial','paid','cancelled','refunded')),
  subtotal NUMERIC(10,2) DEFAULT 0,
  tax NUMERIC(10,2) DEFAULT 0,
  discount NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) DEFAULT 0,
  amount_paid NUMERIC(10,2) DEFAULT 0,
  payment_method TEXT,
  mpesa_transaction_id TEXT,
  cashier_id UUID REFERENCES public.staff(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  paid_at TIMESTAMPTZ
);

CREATE TABLE public.bill_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('consultation','lab_test','medicine','procedure','other')),
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL
);

-- Appointments
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  doctor_id UUID NOT NULL REFERENCES public.staff(id),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled','confirmed','checked_in','completed','cancelled','no_show')),
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Activity / Audit Log
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.staff(id),
  action TEXT NOT NULL,
  module TEXT,
  details TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pharmacy Sales (replaces in-memory)
CREATE TABLE public.pharmacy_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_no TEXT UNIQUE NOT NULL,
  patient_id UUID REFERENCES public.patients(id),
  prescription_id UUID REFERENCES public.prescriptions(id),
  cashier_id UUID REFERENCES public.staff(id),
  subtotal NUMERIC(10,2) DEFAULT 0,
  discount NUMERIC(10,2) DEFAULT 0,
  tax NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) DEFAULT 0,
  amount_paid NUMERIC(10,2) DEFAULT 0,
  change_amount NUMERIC(10,2) DEFAULT 0,
  payment_method TEXT,
  mpesa_transaction_id TEXT,
  customer_name TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed','refunded','held')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.pharmacy_sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.pharmacy_sales(id) ON DELETE CASCADE,
  medicine_id UUID REFERENCES public.medicines(id),
  medicine_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  discount NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL
);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lab_tests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bills;
