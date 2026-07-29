
-- Drop old role check and add platform_admin role
ALTER TABLE public.staff DROP CONSTRAINT IF EXISTS staff_role_check;
ALTER TABLE public.staff ADD CONSTRAINT staff_role_check CHECK (role = ANY (ARRAY[
  'platform_admin', 'super_admin', 'hospital_admin', 'doctor', 'nurse', 
  'receptionist', 'pharmacist', 'cashier', 'lab_technician', 'accountant', 'records_officer'
]));
