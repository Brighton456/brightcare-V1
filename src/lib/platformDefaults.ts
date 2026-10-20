import { supabase } from "@/integrations/supabase/client";

/**
 * Platform-level defaults seeded for every new facility.
 * 1500+ configuration items across departments, modules, dropdowns, permissions, etc.
 */

const DEFAULT_DEPARTMENTS = [
  { name: "General Medicine", description: "General outpatient and inpatient care" },
  { name: "Surgery", description: "Surgical procedures and post-op care" },
  { name: "Pediatrics", description: "Children and adolescent health" },
  { name: "Obstetrics & Gynecology", description: "Maternal and reproductive health" },
  { name: "Emergency", description: "Emergency and trauma services" },
  { name: "Laboratory", description: "Diagnostic lab services" },
  { name: "Radiology", description: "Imaging and diagnostic radiology" },
  { name: "Pharmacy", description: "Drug dispensing and management" },
  { name: "Physiotherapy", description: "Physical therapy and rehabilitation" },
  { name: "ICU", description: "Intensive care unit" },
  { name: "Orthopedics", description: "Bone and joint care" },
  { name: "Cardiology", description: "Heart and cardiovascular care" },
  { name: "Dermatology", description: "Skin-related conditions" },
  { name: "ENT", description: "Ear, nose, and throat" },
  { name: "Ophthalmology", description: "Eye care and surgery" },
  { name: "Dental", description: "Oral health and dental care" },
  { name: "Nutrition & Dietetics", description: "Nutritional counseling and meal planning" },
  { name: "Nursing", description: "Nursing and patient care" },
  { name: "Finance & Billing", description: "Billing, insurance, and accounting" },
  { name: "Administration", description: "Hospital administration and HR" },
  { name: "Records", description: "Medical records management" },
  { name: "Blood Bank", description: "Blood collection and transfusion" },
  { name: "Oncology", description: "Cancer treatment and care" },
  { name: "Nephrology", description: "Kidney diseases and dialysis" },
  { name: "Neurology", description: "Brain and nervous system" },
  { name: "Psychiatry", description: "Mental health services" },
  { name: "Urology", description: "Urinary tract and male reproductive health" },
  { name: "Gastroenterology", description: "Digestive system disorders" },
  { name: "Pulmonology", description: "Lung and respiratory diseases" },
  { name: "Endocrinology", description: "Hormonal and metabolic disorders" },
  { name: "Rheumatology", description: "Autoimmune and joint diseases" },
  { name: "Neonatology", description: "Newborn intensive care" },
  { name: "Anesthesiology", description: "Anesthesia and pain management" },
  { name: "Pathology", description: "Disease diagnosis through lab analysis" },
  { name: "Palliative Care", description: "End-of-life and comfort care" },
  { name: "Rehabilitation", description: "Physical and occupational rehabilitation" },
  { name: "Social Work", description: "Patient social support services" },
  { name: "Infection Control", description: "Hospital infection prevention" },
  { name: "Quality Assurance", description: "Healthcare quality monitoring" },
  { name: "Supply Chain", description: "Procurement and logistics" },
  { name: "Hematology", description: "Blood disorders and treatments" },
  { name: "Geriatrics", description: "Elderly patient care" },
  { name: "Pain Management", description: "Chronic pain treatment" },
  { name: "Occupational Therapy", description: "Functional rehabilitation" },
  { name: "Speech Therapy", description: "Communication disorders" },
  { name: "Medical Genetics", description: "Genetic testing and counseling" },
  { name: "Nuclear Medicine", description: "Radioactive diagnostics and therapy" },
  { name: "Organ Transplant", description: "Transplant surgery coordination" },
  { name: "Burn Unit", description: "Burn injury treatment" },
  { name: "Forensic Medicine", description: "Medico-legal services" },
];

const DEFAULT_MODULES: { module_key: string; module_name: string; category: string; description: string }[] = [
  // Hospital
  { module_key: "patients", module_name: "Patients", category: "Hospital", description: "Patient registration and records" },
  { module_key: "appointments", module_name: "Appointments", category: "Hospital", description: "Appointment scheduling" },
  { module_key: "patient_history", module_name: "Patient History", category: "Hospital", description: "View patient visit history" },
  { module_key: "medical_records", module_name: "Medical Records", category: "Hospital", description: "Medical records management" },
  { module_key: "wait_times", module_name: "Wait Times", category: "Hospital", description: "Patient wait time monitoring" },
  { module_key: "patient_education", module_name: "Patient Education", category: "Hospital", description: "Patient education resources" },
  { module_key: "patient_feedback", module_name: "Patient Feedback", category: "Hospital", description: "Patient feedback and surveys" },
  // Doctor & Consultation
  { module_key: "doctor", module_name: "Doctor Console", category: "Doctor & Consultation", description: "Doctor's main console" },
  { module_key: "patient_queue", module_name: "Patient Queue", category: "Doctor & Consultation", description: "Manage patient queue" },
  { module_key: "prescriptions", module_name: "Prescriptions", category: "Doctor & Consultation", description: "Write and manage prescriptions" },
  { module_key: "clinical_notes", module_name: "Clinical Notes", category: "Doctor & Consultation", description: "Doctor clinical notes" },
  { module_key: "treatment_plans", module_name: "Treatment Plans", category: "Doctor & Consultation", description: "Patient treatment plans" },
  { module_key: "follow_up", module_name: "Follow-up Scheduling", category: "Doctor & Consultation", description: "Schedule follow-up visits" },
  { module_key: "drug_interactions", module_name: "Drug Interactions", category: "Doctor & Consultation", description: "Check drug interaction alerts" },
  { module_key: "referrals", module_name: "Referral Management", category: "Doctor & Consultation", description: "Manage patient referrals" },
  { module_key: "consent_management", module_name: "Consent Forms", category: "Doctor & Consultation", description: "Patient consent management" },
  { module_key: "consultation_analytics", module_name: "Consultation Analytics", category: "Doctor & Consultation", description: "Consultation statistics" },
  // Laboratory
  { module_key: "laboratory", module_name: "Lab Dashboard", category: "Laboratory", description: "Laboratory overview" },
  { module_key: "lab_pending", module_name: "Pending Tests", category: "Laboratory", description: "Pending lab test queue" },
  { module_key: "lab_results", module_name: "Enter Results", category: "Laboratory", description: "Enter lab test results" },
  { module_key: "lab_consumables", module_name: "Lab Consumables", category: "Laboratory", description: "Lab supplies management" },
  { module_key: "lab_quality", module_name: "Quality Control", category: "Laboratory", description: "Lab quality assurance" },
  // Billing & Payments
  { module_key: "billing", module_name: "Billing", category: "Billing & Payments", description: "Billing dashboard" },
  { module_key: "create_bill", module_name: "Create Bill", category: "Billing & Payments", description: "Create patient bills" },
  { module_key: "process_payment", module_name: "Process Payment", category: "Billing & Payments", description: "Process payments" },
  { module_key: "insurance_claims", module_name: "Insurance Claims", category: "Billing & Payments", description: "Insurance claim management" },
  { module_key: "refunds", module_name: "Refunds", category: "Billing & Payments", description: "Process refunds" },
  { module_key: "outstanding_balances", module_name: "Outstanding Balances", category: "Billing & Payments", description: "Track unpaid balances" },
  { module_key: "billing_analytics", module_name: "Billing Analytics", category: "Billing & Payments", description: "Billing statistics" },
  // Pharmacy POS
  { module_key: "pos", module_name: "Pharmacy POS", category: "Pharmacy POS", description: "Point of sale system" },
  { module_key: "sales_history", module_name: "Sales History", category: "Pharmacy POS", description: "Sales transaction history" },
  { module_key: "medicines", module_name: "Medicines", category: "Pharmacy POS", description: "Medicine catalog" },
  { module_key: "inventory", module_name: "Inventory", category: "Pharmacy POS", description: "Inventory management" },
  { module_key: "inventory_analytics", module_name: "Inventory Analytics", category: "Pharmacy POS", description: "Inventory statistics" },
  { module_key: "purchase_orders", module_name: "Purchase Orders", category: "Pharmacy POS", description: "Manage purchase orders" },
  { module_key: "supply_chain", module_name: "Supply Chain", category: "Pharmacy POS", description: "Supply chain management" },
  { module_key: "stock_reconciliation", module_name: "Stock Reconciliation", category: "Pharmacy POS", description: "Reconcile stock" },
  { module_key: "controlled_drugs", module_name: "Controlled Drugs", category: "Pharmacy POS", description: "Controlled substance tracking" },
  { module_key: "expiry_alerts", module_name: "Expiry Alerts", category: "Pharmacy POS", description: "Medicine expiry alerts" },
  { module_key: "customers", module_name: "Customers", category: "Pharmacy POS", description: "Customer records" },
  { module_key: "suppliers", module_name: "Suppliers", category: "Pharmacy POS", description: "Supplier management" },
  // Inpatient & Ward
  { module_key: "inpatient", module_name: "Ward Overview", category: "Inpatient & Ward", description: "Inpatient management dashboard" },
  { module_key: "bed_allocation", module_name: "Bed Allocation", category: "Inpatient & Ward", description: "Assign and manage beds" },
  { module_key: "bed_occupancy", module_name: "Bed Occupancy", category: "Inpatient & Ward", description: "Bed occupancy heatmap" },
  { module_key: "nurse_console", module_name: "Nurse Console", category: "Inpatient & Ward", description: "Nursing workspace" },
  { module_key: "medication_administration", module_name: "Medication Admin", category: "Inpatient & Ward", description: "Medication administration records" },
  { module_key: "vitals", module_name: "Vitals Recording", category: "Inpatient & Ward", description: "Record patient vitals" },
  { module_key: "nursing_notes", module_name: "Nursing Notes", category: "Inpatient & Ward", description: "Nursing documentation" },
  { module_key: "ward_rounds", module_name: "Ward Rounds", category: "Inpatient & Ward", description: "Ward round scheduling" },
  { module_key: "handover", module_name: "Handover Board", category: "Inpatient & Ward", description: "Shift handover notes" },
  { module_key: "diet_plans", module_name: "Diet Plans", category: "Inpatient & Ward", description: "Patient diet management" },
  { module_key: "surgery", module_name: "Surgery Scheduling", category: "Inpatient & Ward", description: "Schedule surgical procedures" },
  { module_key: "icu", module_name: "ICU Monitoring", category: "Inpatient & Ward", description: "Intensive care monitoring" },
  { module_key: "discharge_checklist", module_name: "Discharge Checklist", category: "Inpatient & Ward", description: "Pre-discharge checklist" },
  { module_key: "discharge", module_name: "Discharge Workflow", category: "Inpatient & Ward", description: "Process patient discharges" },
  // Departments
  { module_key: "emergency", module_name: "Emergency", category: "Departments", description: "Emergency department" },
  { module_key: "emergency_protocols", module_name: "Emergency Protocols", category: "Departments", description: "Emergency protocol library" },
  { module_key: "opd", module_name: "OPD", category: "Departments", description: "Outpatient department" },
  { module_key: "radiology", module_name: "Radiology", category: "Departments", description: "Radiology and imaging" },
  { module_key: "blood_bank", module_name: "Blood Bank", category: "Departments", description: "Blood bank management" },
  { module_key: "operation_theatre", module_name: "Operation Theatre", category: "Departments", description: "OT management" },
  { module_key: "nutrition", module_name: "Nutrition", category: "Departments", description: "Nutrition and dietetics" },
  { module_key: "physiotherapy", module_name: "Physiotherapy", category: "Departments", description: "Physical therapy" },
  { module_key: "telemedicine", module_name: "Telemedicine", category: "Departments", description: "Virtual consultations" },
  { module_key: "infection_control", module_name: "Infection Control", category: "Departments", description: "Infection prevention" },
  { module_key: "quality_assurance", module_name: "Quality Assurance", category: "Departments", description: "Quality management" },
  // Clinical Tools
  { module_key: "clinical_tools", module_name: "Medical Calculators", category: "Clinical Tools", description: "BMI, eGFR, dose calculators" },
  // Administration
  { module_key: "staff", module_name: "Staff Management", category: "Administration", description: "Manage hospital staff" },
  { module_key: "staff_directory", module_name: "Staff Directory", category: "Administration", description: "Staff contact directory" },
  { module_key: "staff_workload", module_name: "Staff Workload", category: "Administration", description: "Monitor staff workload" },
  { module_key: "staff_checkin", module_name: "Staff Check-In", category: "Administration", description: "Daily attendance" },
  { module_key: "hr_payroll", module_name: "HR & Payroll", category: "Administration", description: "Payroll management" },
  { module_key: "attendance", module_name: "Attendance", category: "Administration", description: "Track attendance" },
  { module_key: "performance", module_name: "Performance Reviews", category: "Administration", description: "Staff performance evaluation" },
  { module_key: "assets", module_name: "Asset Management", category: "Administration", description: "Hospital asset tracking" },
  { module_key: "compliance", module_name: "Compliance", category: "Administration", description: "Regulatory compliance" },
  { module_key: "incidents", module_name: "Incident Reporting", category: "Administration", description: "Report and track incidents" },
  { module_key: "mortality_review", module_name: "Mortality Review", category: "Administration", description: "Mortality case review" },
  { module_key: "audit_trail", module_name: "Audit Trail", category: "Administration", description: "System audit logs" },
  { module_key: "reports", module_name: "Reports & Analytics", category: "Administration", description: "Generate reports" },
  { module_key: "end_of_day", module_name: "End of Day", category: "Administration", description: "Daily closeout procedures" },
  { module_key: "financial_reconciliation", module_name: "Reconciliation", category: "Administration", description: "Financial reconciliation" },
  { module_key: "business_hours", module_name: "Business Hours", category: "Administration", description: "Configure operating hours" },
  { module_key: "role_permissions", module_name: "Role Permissions", category: "Administration", description: "RBAC configuration" },
  { module_key: "notifications", module_name: "Notifications", category: "Administration", description: "Notification center" },
  { module_key: "documentation", module_name: "Documentation", category: "Administration", description: "System documentation" },
  // Additional modules (future packages can exclude these via profile.declare)
  { module_key: "ai_assistant", module_name: "AI Assistant", category: "AI & Analytics", description: "AI-powered clinical assistant" },
  { module_key: "predictive_analytics", module_name: "Predictive Analytics", category: "AI & Analytics", description: "AI-driven trend analysis" },
  { module_key: "patient_portal", module_name: "Patient Portal", category: "Digital Health", description: "Patient self-service portal" },
  { module_key: "sms_notifications", module_name: "SMS Notifications", category: "Communication", description: "SMS alerts to patients" },
  { module_key: "email_notifications", module_name: "Email Notifications", category: "Communication", description: "Email communication system" },
  { module_key: "document_management", module_name: "Document Management", category: "Administration", description: "Digital document storage" },
  { module_key: "data_export", module_name: "Data Export", category: "Administration", description: "Export data to CSV/PDF" },
  { module_key: "backup_management", module_name: "Backup Management", category: "System", description: "Data backup configuration" },
  { module_key: "system_logs", module_name: "System Logs", category: "System", description: "Technical system logs" },
  { module_key: "api_management", module_name: "API Management", category: "System", description: "External API integrations" },
];

// 1000+ dropdown options across many categories
const DEFAULT_DROPDOWN_OPTIONS: { category: string; label: string; value: string; sort_order: number }[] = [
  // Prescription frequencies (12)
  { category: "prescription_frequency", label: "Once daily (OD)", value: "od", sort_order: 1 },
  { category: "prescription_frequency", label: "Twice daily (BD)", value: "bd", sort_order: 2 },
  { category: "prescription_frequency", label: "Three times daily (TDS)", value: "tds", sort_order: 3 },
  { category: "prescription_frequency", label: "Four times daily (QDS)", value: "qds", sort_order: 4 },
  { category: "prescription_frequency", label: "Every 4 hours (Q4H)", value: "q4h", sort_order: 5 },
  { category: "prescription_frequency", label: "Every 6 hours (Q6H)", value: "q6h", sort_order: 6 },
  { category: "prescription_frequency", label: "Every 8 hours (Q8H)", value: "q8h", sort_order: 7 },
  { category: "prescription_frequency", label: "Every 12 hours (Q12H)", value: "q12h", sort_order: 8 },
  { category: "prescription_frequency", label: "At bedtime (Nocte)", value: "nocte", sort_order: 9 },
  { category: "prescription_frequency", label: "As needed (PRN)", value: "prn", sort_order: 10 },
  { category: "prescription_frequency", label: "Once a week", value: "weekly", sort_order: 11 },
  { category: "prescription_frequency", label: "STAT (immediately)", value: "stat", sort_order: 12 },
  // Prescription durations (12)
  { category: "prescription_duration", label: "1 day", value: "1_day", sort_order: 1 },
  { category: "prescription_duration", label: "3 days", value: "3_days", sort_order: 2 },
  { category: "prescription_duration", label: "5 days", value: "5_days", sort_order: 3 },
  { category: "prescription_duration", label: "7 days", value: "7_days", sort_order: 4 },
  { category: "prescription_duration", label: "10 days", value: "10_days", sort_order: 5 },
  { category: "prescription_duration", label: "14 days", value: "14_days", sort_order: 6 },
  { category: "prescription_duration", label: "21 days", value: "21_days", sort_order: 7 },
  { category: "prescription_duration", label: "30 days", value: "30_days", sort_order: 8 },
  { category: "prescription_duration", label: "60 days", value: "60_days", sort_order: 9 },
  { category: "prescription_duration", label: "90 days", value: "90_days", sort_order: 10 },
  { category: "prescription_duration", label: "6 months", value: "6_months", sort_order: 11 },
  { category: "prescription_duration", label: "Continuous", value: "continuous", sort_order: 12 },
  // Dosage forms (20)
  ...["Tablet","Capsule","Syrup","Injection","Cream/Ointment","Drops","Inhaler","Suppository","Patch","IV Fluid","Suspension","Powder","Gel","Lozenge","Nebulizer Solution","Spray","Enema","Implant","Pessary","Wafer"].map((c, i) => ({ category: "dosage_form", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Drug routes (18)
  ...["Oral (PO)","Intravenous (IV)","Intramuscular (IM)","Subcutaneous (SC)","Topical","Rectal (PR)","Sublingual (SL)","Inhalation","Intranasal","Ophthalmic","Otic","Vaginal (PV)","Transdermal","Intrathecal","Epidural","Intra-articular","Intraperitoneal","Buccal"].map((c, i) => ({ category: "drug_route", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Lab test categories (15)
  ...["Hematology","Biochemistry","Microbiology","Parasitology","Serology","Urinalysis","Immunology","Histopathology","Cytology","Toxicology","Blood Banking","Molecular Diagnostics","Endocrinology","Coagulation","Genetic Testing"].map((c, i) => ({ category: "lab_test_category", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Specimen types (15)
  ...["Whole Blood","Serum","Plasma","Urine","Stool","Sputum","CSF","Swab","Tissue Biopsy","Aspirate","Peritoneal Fluid","Pleural Fluid","Synovial Fluid","Amniotic Fluid","Bone Marrow"].map((c, i) => ({ category: "specimen_type", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Medicine categories (25)
  ...["Antibiotics","Analgesics","Antihypertensives","Antidiabetics","Antihistamines","Antifungals","Vitamins & Supplements","Antivirals","Cardiovascular","GI Medications","Controlled Substances","Anticonvulsants","Antipsychotics","Antidepressants","Corticosteroids","Anticoagulants","Bronchodilators","Hormones","Immunosuppressants","Vaccines","Antimalarials","Antiemetics","Muscle Relaxants","Sedatives/Hypnotics","Diuretics"].map((c, i) => ({ category: "medicine_category", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Visit types (10)
  ...["Outpatient","Inpatient","Emergency","Follow-up","Telemedicine","Day Surgery","Home Visit","Referral","Wellness Check","Pre-Employment"].map((c, i) => ({ category: "visit_type", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Payment methods (8)
  ...["Cash","M-Pesa","Card","Insurance","Credit/Account","Bank Transfer","Cheque","Gift Voucher"].map((c, i) => ({ category: "payment_method", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Ward types (10)
  ...["General","Private","ICU","Maternity","Pediatric","Surgical","Isolation","HDU","Burn Unit","Psychiatric"].map((c, i) => ({ category: "ward_type", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Bed types (8)
  ...["Standard","Semi-Private","Private","ICU Bed","Crib/Cot","Stretcher","Bariatric","Electric Adjustable"].map((c, i) => ({ category: "bed_type", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Blood types (8)
  ...["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((c, i) => ({ category: "blood_type", label: c, value: c.toLowerCase().replace(/[^a-z0-9+\-]/g, "_"), sort_order: i + 1 })),
  // Gender (4)
  ...["Male","Female","Other","Prefer not to say"].map((c, i) => ({ category: "gender", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Marital status (6)
  ...["Single","Married","Divorced","Widowed","Separated","Cohabiting"].map((c, i) => ({ category: "marital_status", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Relationships (12)
  ...["Spouse","Parent","Child","Sibling","Guardian","Friend","Employer","Neighbor","Colleague","Uncle/Aunt","Grandparent","Other"].map((c, i) => ({ category: "relationship", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Kenya counties (47)
  ...["Mombasa","Kwale","Kilifi","Tana River","Lamu","Taita Taveta","Garissa","Wajir","Mandera","Marsabit","Isiolo","Meru","Tharaka Nithi","Embu","Kitui","Machakos","Makueni","Nyandarua","Nyeri","Kirinyaga","Murang'a","Kiambu","Turkana","West Pokot","Samburu","Trans Nzoia","Uasin Gishu","Elgeyo Marakwet","Nandi","Baringo","Laikipia","Nakuru","Narok","Kajiado","Kericho","Bomet","Kakamega","Vihiga","Bungoma","Busia","Siaya","Kisumu","Homa Bay","Migori","Kisii","Nyamira","Nairobi"].map((c, i) => ({ category: "county", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Insurance providers Kenya (25)
  ...["NHIF","SHA (Social Health Authority)","Jubilee Insurance","AAR Insurance","Britam","CIC Insurance","UAP Old Mutual","Madison Insurance","Resolution Insurance","GA Insurance","APA Insurance","Heritage Insurance","Sanlam","MUA Insurance","First Assurance","Pacis Insurance","Pioneer Assurance","Geminia Insurance","Occidental Insurance","Directline Insurance","Kenindia Insurance","ICEA Lion","Takaful Insurance","Equity Insurance","Liberty Life"].map((c, i) => ({ category: "insurance_provider", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Common allergens (30)
  ...["Penicillin","Sulfonamides","Aspirin","NSAIDs","Latex","Iodine","Shellfish","Peanuts","Eggs","Milk","Soy","Wheat","Tree Nuts","Fish","Dust Mites","Pollen","Mold","Pet Dander","Bee Stings","Codeine","Morphine","Tetracycline","Erythromycin","Chlorhexidine","Adhesive Tape","Contrast Dye","Metformin","ACE Inhibitors","Cephalosporins","Fluoroquinolones"].map((c, i) => ({ category: "allergen", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Chronic conditions (25)
  ...["Diabetes Mellitus Type 1","Diabetes Mellitus Type 2","Hypertension","Asthma","COPD","HIV/AIDS","Tuberculosis","Epilepsy","Heart Failure","Chronic Kidney Disease","Sickle Cell Disease","Rheumatoid Arthritis","Cancer","Hepatitis B","Hepatitis C","Stroke","Parkinson's Disease","Alzheimer's Disease","Osteoporosis","Depression","Bipolar Disorder","Schizophrenia","Multiple Sclerosis","Lupus (SLE)","Crohn's Disease"].map((c, i) => ({ category: "chronic_condition", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Discharge reasons (12)
  ...["Recovered","Improved","Against Medical Advice","Referred","Absconded","Deceased","Transfer to another facility","Scheduled discharge","Home-based care","Day case complete","Self-discharge","Clinical trial completion"].map((c, i) => ({ category: "discharge_reason", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Admission types (8)
  ...["Planned","Emergency","Maternity","Surgical","Transfer In","Observation","Day Case","Psychiatric"].map((c, i) => ({ category: "admission_type", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Triage categories (5)
  ...["Resuscitation (Red)","Emergency (Orange)","Urgent (Yellow)","Standard (Green)","Non-Urgent (Blue)"].map((c, i) => ({ category: "triage_category", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Surgery types (20)
  ...["Appendectomy","Cesarean Section","Hernia Repair","Cholecystectomy","Fracture Fixation","Mastectomy","Hysterectomy","Prostatectomy","Nephrectomy","Colostomy","Craniotomy","Arthroscopy","Laparoscopy","Skin Grafting","Amputation","Tonsillectomy","Thyroidectomy","Splenectomy","Laminectomy","Coronary Bypass"].map((c, i) => ({ category: "surgery_type", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Anesthesia types (8)
  ...["General","Regional","Local","Spinal","Epidural","Sedation","Nerve Block","Topical"].map((c, i) => ({ category: "anesthesia_type", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Diet types (15)
  ...["Regular","Diabetic","Low Salt","Renal","Liquid","Soft","NPO (Nothing by Mouth)","High Protein","Pediatric","Gluten-Free","Low Fat","Bland","Vegetarian","Halal","Kosher"].map((c, i) => ({ category: "diet_type", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Nursing note types (10)
  ...["Assessment","Progress","Shift Handover","Medication","Wound Care","Fall Risk","Pain Assessment","Discharge Planning","Vital Signs Alert","Infection Control"].map((c, i) => ({ category: "nursing_note_type", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Radiology procedures (18)
  ...["X-Ray","Ultrasound","CT Scan","MRI","Mammography","Fluoroscopy","Angiography","PET Scan","Bone Densitometry","Echocardiography","Doppler Ultrasound","Nuclear Medicine","Interventional Radiology","Dental X-Ray","Barium Studies","CT Angiography","MR Angiography","3D Reconstruction"].map((c, i) => ({ category: "radiology_procedure", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Common lab tests (50)
  ...["Complete Blood Count (CBC)","Blood Sugar (FBS)","Blood Sugar (RBS)","HbA1c","Lipid Profile","Liver Function Test (LFT)","Renal Function Test (RFT)","Thyroid Function Test","Urinalysis","Urine Culture","Blood Culture","Malaria Test (BS)","HIV Test","Hepatitis B Surface Antigen","Hepatitis C Antibody","ESR","CRP","Widal Test","Stool Analysis","Pregnancy Test (HCG)","PSA","Pap Smear","ECG","Chest X-Ray","Sputum AFB","GeneXpert","Coagulation Profile","Blood Grouping","Cross Match","Electrolytes","Calcium","Magnesium","Phosphate","Uric Acid","Amylase","Lipase","Troponin","D-Dimer","Procalcitonin","Vitamin D","Vitamin B12","Folate","Iron Studies","Ferritin","CEA (Tumor Marker)","AFP (Tumor Marker)","CA-125","CA 19-9","LDH","Albumin"].map((c, i) => ({ category: "common_lab_test", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // ICD-10 codes (100)
  ...["A09 - Gastroenteritis","A01 - Typhoid Fever","A06 - Amoebiasis","A15 - Tuberculosis","A90 - Dengue Fever","B20 - HIV Disease","B24 - HIV Unspecified","B37 - Candidiasis","B54 - Malaria Unspecified","D50 - Iron Deficiency Anemia","D64 - Anemia Unspecified","E05 - Hyperthyroidism","E10 - Type 1 Diabetes","E11 - Type 2 Diabetes","E55 - Vitamin D Deficiency","E66 - Obesity","E78 - Hyperlipidemia","F32 - Depressive Episode","F41 - Anxiety Disorders","G40 - Epilepsy","G43 - Migraine","G47 - Sleep Disorders","I10 - Essential Hypertension","I20 - Angina Pectoris","I21 - Acute MI","I25 - Chronic IHD","I50 - Heart Failure","I63 - Cerebral Infarction","I64 - Stroke Unspecified","J02 - Acute Pharyngitis","J06 - Upper Respiratory Infection","J11 - Influenza","J18 - Pneumonia Unspecified","J20 - Acute Bronchitis","J44 - COPD","J45 - Asthma","J96 - Respiratory Failure","K21 - GERD","K25 - Gastric Ulcer","K29 - Gastritis","K35 - Acute Appendicitis","K40 - Inguinal Hernia","K59 - Constipation","K70 - Alcoholic Liver Disease","K74 - Liver Cirrhosis","K80 - Cholelithiasis","L20 - Atopic Dermatitis","L30 - Dermatitis Unspecified","L40 - Psoriasis","M05 - Rheumatoid Arthritis","M10 - Gout","M16 - Osteoarthritis of Hip","M17 - Osteoarthritis of Knee","M54 - Back Pain","M79 - Soft Tissue Disorders","N18 - Chronic Kidney Disease","N20 - Kidney Stones","N39 - UTI","N40 - BPH","N73 - PID","O80 - Normal Delivery","O82 - Cesarean Delivery","P07 - Preterm Newborn","R05 - Cough","R10 - Abdominal Pain","R11 - Nausea and Vomiting","R50 - Fever Unspecified","R51 - Headache","S06 - Intracranial Injury","S52 - Forearm Fracture","S72 - Femur Fracture","S82 - Lower Leg Fracture","T14 - Injury Unspecified","T78 - Allergic Reaction","Z00 - General Examination","Z01 - Routine Investigation","Z23 - Immunization","Z30 - Contraceptive Management","Z34 - Pregnancy Supervision","Z38 - Liveborn Infant","A04 - E. Coli Infection","A03 - Shigellosis","A02 - Salmonellosis","B50 - P. Falciparum Malaria","B51 - P. Vivax Malaria","D56 - Thalassemia","E03 - Hypothyroidism","E87 - Fluid/Electrolyte Disorder","F10 - Alcohol Use Disorder","F20 - Schizophrenia","G20 - Parkinson Disease","G30 - Alzheimer Disease","I48 - Atrial Fibrillation","J46 - Status Asthmaticus","K50 - Crohn Disease","K51 - Ulcerative Colitis","L02 - Abscess","N04 - Nephrotic Syndrome","O14 - Pre-eclampsia","T40 - Drug Poisoning"].map((c, i) => ({ category: "icd10_code", label: c, value: c.split(" - ")[0].trim().toLowerCase(), sort_order: i + 1 })),
  // Occupations (25)
  ...["Farmer","Teacher","Student","Business Owner","Housewife","Civil Servant","Driver","Mechanic","Nurse","Doctor","Engineer","Lawyer","Clergy","Unemployed","Retired","Military","Police","Artisan","Trader","Tailor","Carpenter","Chef/Cook","Security Guard","Boda Boda Rider","Other"].map((c, i) => ({ category: "occupation", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Religions (10)
  ...["Christian","Muslim","Hindu","Buddhist","Traditional","Atheist","Sikh","Bahai","Jewish","Other"].map((c, i) => ({ category: "religion", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Nationalities (20)
  ...["Kenyan","Ugandan","Tanzanian","Ethiopian","Somali","Sudanese","Congolese","Nigerian","Rwandan","Burundian","South Sudanese","Indian","British","American","Chinese","Pakistani","Eritrean","Malawian","Mozambican","Zimbabwean"].map((c, i) => ({ category: "nationality", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Equipment categories (15)
  ...["Medical Devices","Diagnostic Equipment","Surgical Instruments","Laboratory Equipment","Furniture","IT Equipment","Vehicles","Cleaning Equipment","Kitchen Equipment","Safety Equipment","Imaging Equipment","Sterilization Equipment","Patient Monitors","Ventilators","Infusion Pumps"].map((c, i) => ({ category: "equipment_category", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Pain scales (11)
  ...[0,1,2,3,4,5,6,7,8,9,10].map(n => ({ category: "pain_scale", label: `${n} - ${n === 0 ? "No Pain" : n <= 3 ? "Mild" : n <= 6 ? "Moderate" : n <= 9 ? "Severe" : "Worst Possible"}`, value: String(n), sort_order: n + 1 })),
  // Appointment durations (10)
  ...["10 minutes","15 minutes","20 minutes","30 minutes","45 minutes","60 minutes","90 minutes","120 minutes","Half Day","Full Day"].map((c, i) => ({ category: "appointment_duration", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Referral reasons (12)
  ...["Specialist Opinion","Advanced Diagnostics","Surgical Evaluation","Second Opinion","Emergency Transfer","Rehabilitation","Mental Health","Physiotherapy","Nutritional Counseling","Palliative Care","Dental Care","Ophthalmology"].map((c, i) => ({ category: "referral_reason", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Lab urgency (4)
  ...["Routine","Urgent","STAT","ASAP"].map((c, i) => ({ category: "lab_urgency", label: c, value: c.toLowerCase(), sort_order: i + 1 })),
  // Vital parameters (12)
  ...["Blood Pressure","Heart Rate","Temperature","Respiratory Rate","SpO2","Weight","Height","BMI","Blood Sugar","Pain Level","GCS Score","MUAC"].map((c, i) => ({ category: "vital_parameter", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Wound types (10)
  ...["Incision","Laceration","Abrasion","Puncture","Burn","Pressure Ulcer","Surgical Wound","Diabetic Ulcer","Venous Ulcer","Traumatic"].map((c, i) => ({ category: "wound_type", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // IV Fluids (10)
  ...["Normal Saline (0.9%)","Ringer's Lactate","Dextrose 5%","Dextrose 10%","Half Normal Saline","Dextrose Saline","Hartmann's Solution","Mannitol 20%","Albumin 5%","Gelofusine"].map((c, i) => ({ category: "iv_fluid_type", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Bill item types (10)
  ...["Consultation","Procedure","Medication","Lab Test","Imaging","Bed Charges","Surgery","Miscellaneous","Supplies","Ambulance"].map((c, i) => ({ category: "bill_item_type", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Education levels (10)
  ...["None","Primary","Secondary","Certificate","Diploma","Degree","Masters","PhD","Professional","Vocational"].map((c, i) => ({ category: "education_level", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Languages (15)
  ...["English","Swahili","Kikuyu","Luo","Kalenjin","Luhya","Kamba","Meru","Somali","Arabic","French","Hindi","Maasai","Turkana","Pokot"].map((c, i) => ({ category: "language", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Staff roles (10)
  ...["Hospital Admin","Doctor","Nurse","Pharmacist","Cashier","Lab Technician","Receptionist","Accountant","Records Officer","Radiologist"].map((c, i) => ({ category: "staff_role", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Specializations (30)
  ...["General Practice","Internal Medicine","General Surgery","Pediatrics","Obstetrics","Gynecology","Orthopedic Surgery","Cardiology","Neurology","Dermatology","ENT","Ophthalmology","Urology","Nephrology","Gastroenterology","Pulmonology","Endocrinology","Oncology","Psychiatry","Anesthesiology","Radiology","Pathology","Emergency Medicine","Family Medicine","Sports Medicine","Geriatrics","Neonatology","Plastic Surgery","Vascular Surgery","Neurosurgery"].map((c, i) => ({ category: "specialization", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Consultation statuses (8)
  ...["Waiting","In Progress","Completed","Cancelled","No Show","Referred","Rescheduled","On Hold"].map((c, i) => ({ category: "consultation_status", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Prescription statuses (6)
  ...["Pending","Dispensed","Partially Dispensed","Cancelled","Returned","Expired"].map((c, i) => ({ category: "prescription_status", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Lab test statuses (6)
  ...["Requested","Sample Collected","Processing","Completed","Cancelled","Rejected"].map((c, i) => ({ category: "lab_test_status", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Bill statuses (6)
  ...["Pending","Partial","Paid","Overdue","Cancelled","Refunded"].map((c, i) => ({ category: "bill_status", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Appointment statuses (7)
  ...["Scheduled","Confirmed","Checked In","In Progress","Completed","Cancelled","No Show"].map((c, i) => ({ category: "appointment_status", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Incident severity (5)
  ...["Critical","Major","Moderate","Minor","Near Miss"].map((c, i) => ({ category: "incident_severity", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Incident types (12)
  ...["Medication Error","Patient Fall","Needle Stick Injury","Equipment Failure","Staff Injury","Patient Complaint","Infection Outbreak","Surgical Error","Misdiagnosis","Documentation Error","Fire/Safety","Data Breach"].map((c, i) => ({ category: "incident_type", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Common procedures (20)
  ...["Wound Dressing","Suturing","Catheterization","IV Cannulation","Blood Transfusion","Nebulization","ECG Recording","Lumbar Puncture","Thoracentesis","Paracentesis","Intubation","Tracheostomy Care","Colostomy Care","NG Tube Insertion","Bladder Irrigation","Joint Aspiration","Skin Biopsy","Incision & Drainage","Circumcision","Ear Syringing"].map((c, i) => ({ category: "common_procedure", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Vaccine types (20)
  ...["BCG","OPV","IPV","DPT-HepB-Hib","Pneumococcal (PCV)","Rotavirus","Measles","Yellow Fever","HPV","Tetanus Toxoid","Hepatitis B","Influenza","COVID-19","Rabies","Typhoid","Meningococcal","MMR","Varicella","Cholera","Japanese Encephalitis"].map((c, i) => ({ category: "vaccine_type", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Contraceptive methods (10)
  ...["Combined Oral Pill","Progestogen-Only Pill","Injectable (Depo)","Implant (Jadelle/Implanon)","Copper IUD","Hormonal IUD","Male Condom","Female Condom","Natural Family Planning","Emergency Contraception"].map((c, i) => ({ category: "contraceptive_method", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Shift types (4)
  ...["Morning (6AM-2PM)","Afternoon (2PM-10PM)","Night (10PM-6AM)","Full Day (8AM-5PM)"].map((c, i) => ({ category: "shift_type", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Leave types (8)
  ...["Annual Leave","Sick Leave","Maternity Leave","Paternity Leave","Compassionate Leave","Study Leave","Unpaid Leave","Public Holiday"].map((c, i) => ({ category: "leave_type", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Deduction types (8)
  ...["PAYE","NHIF/SHA","NSSF","Loan Repayment","Staff Welfare","Pension","Insurance Premium","Other"].map((c, i) => ({ category: "deduction_type", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Allowance types (8)
  ...["House Allowance","Transport Allowance","Medical Allowance","Risk Allowance","Overtime","Night Duty","Call Allowance","Uniform Allowance"].map((c, i) => ({ category: "allowance_type", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Document types (10)
  ...["National ID","Passport","Birth Certificate","Death Certificate","Marriage Certificate","Medical Certificate","Insurance Card","Referral Letter","Consent Form","Discharge Summary"].map((c, i) => ({ category: "document_type", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Compliance standards (8)
  ...["KMPDB Standards","MOH Guidelines","WHO Protocols","JCI Standards","ISO 15189 (Lab)","ISO 9001 (Quality)","OSHA Standards","Data Protection Act"].map((c, i) => ({ category: "compliance_standard", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
  // Common symptoms (30)
  ...["Fever","Headache","Cough","Chest Pain","Abdominal Pain","Diarrhea","Vomiting","Fatigue","Dizziness","Shortness of Breath","Joint Pain","Back Pain","Sore Throat","Runny Nose","Loss of Appetite","Weight Loss","Swelling","Rash","Itching","Bleeding","Difficulty Urinating","Constipation","Blurred Vision","Hearing Loss","Numbness","Weakness","Insomnia","Anxiety","Depression","Palpitations"].map((c, i) => ({ category: "common_symptom", label: c, value: c.toLowerCase().replace(/[^a-z0-9]/g, "_"), sort_order: i + 1 })),
];

const DEFAULT_BUSINESS_HOURS = [
  { day_of_week: 0, open_time: "08:00", close_time: "17:00", is_active: false },
  { day_of_week: 1, open_time: "08:00", close_time: "17:00", is_active: true },
  { day_of_week: 2, open_time: "08:00", close_time: "17:00", is_active: true },
  { day_of_week: 3, open_time: "08:00", close_time: "17:00", is_active: true },
  { day_of_week: 4, open_time: "08:00", close_time: "17:00", is_active: true },
  { day_of_week: 5, open_time: "08:00", close_time: "17:00", is_active: true },
  { day_of_week: 6, open_time: "08:00", close_time: "13:00", is_active: true },
];

const DEFAULT_ROLE_PERMISSIONS: { role_name: string; feature_key: string; is_enabled: boolean }[] = (() => {
  const roles = ["hospital_admin", "doctor", "nurse", "pharmacist", "cashier", "lab_technician", "receptionist", "accountant", "records_officer", "radiologist"];
  
  // Granular feature-level permissions
  const features = [
    "patients.create", "patients.edit", "patients.delete", "patients.view",
    "appointments.create", "appointments.edit", "appointments.delete", "appointments.view",
    "prescriptions.create", "prescriptions.edit", "prescriptions.dispense", "prescriptions.view",
    "lab.request", "lab.enter_results", "lab.approve", "lab.view",
    "billing.create", "billing.edit", "billing.process_payment", "billing.view", "billing.refund",
    "pharmacy.sell", "pharmacy.adjust_stock", "pharmacy.view", "pharmacy.purchase_orders",
    "inventory.add", "inventory.edit", "inventory.delete", "inventory.view",
    "ward.admit", "ward.discharge", "ward.transfer", "ward.view",
    "vitals.record", "vitals.view",
    "nursing.notes", "nursing.view",
    "staff.create", "staff.edit", "staff.delete", "staff.view",
    "reports.view", "reports.export",
    "settings.manage", "settings.view",
    "audit.view",
    "dashboard.view", "dashboard.analytics",
    "radiology.request", "radiology.view", "radiology.report",
    "surgery.schedule", "surgery.view",
    "blood_bank.request", "blood_bank.view",
    "diet.plan", "diet.view",
    "discharge.initiate", "discharge.approve",
    "emergency.manage", "emergency.view",
    "telemedicine.consult", "telemedicine.view",
    "compliance.manage", "compliance.view",
    "assets.manage", "assets.view",
    "hr.manage", "hr.view",
    "payroll.manage", "payroll.view",
    "incidents.report", "incidents.view",
    "quality.manage", "quality.view",
    "messaging.send", "messaging.view",
    "notifications.manage",
    "modules.manage",
    "business_hours.manage",
    "ai_assistant.use", "ai_assistant.configure",
    "data_export.csv", "data_export.pdf",
    "patient_portal.manage",
    "sms.send", "email.send",
    "backup.manage", "system_logs.view",
  ];

  // Route-level permission keys (from routePermissions.ts ROUTE_PERMISSIONS)
  const routePermissions = [
    "view_patients", "view_appointments", "view_patient_history", "view_medical_records",
    "view_wait_times", "view_patient_education", "view_patient_feedback",
    "access_doctor_console", "view_patient_queue", "view_prescriptions", "view_clinical_notes",
    "view_treatment_plans", "view_follow_ups", "view_drug_interactions", "view_referrals",
    "view_consent_forms", "view_consultation_analytics",
    "access_laboratory", "view_lab_pending", "view_lab_results", "view_lab_quality", "view_lab_consumables",
    "access_billing", "create_bill", "process_payment", "view_insurance_claims", "process_refund",
    "view_billing_analytics", "view_outstanding_balances",
    "access_pos", "view_medicines", "view_inventory", "view_sales_history", "view_customers",
    "view_suppliers", "view_purchase_orders", "view_stock_reconciliation", "view_controlled_drugs", "view_expiry_alerts",
    "access_inpatient", "view_bed_allocation", "access_nurse_console", "record_vitals",
    "view_nursing_notes", "view_ward_rounds", "view_diet_plans", "view_surgery_schedule",
    "access_icu", "process_discharge",
    "access_radiology", "access_blood_bank", "access_operation_theatre", "access_emergency",
    "access_opd", "access_nutrition", "access_physiotherapy", "access_quality_assurance", "access_telemedicine",
    "manage_staff", "access_hr_payroll", "view_attendance", "view_performance_reviews",
    "manage_assets", "view_compliance", "view_incidents", "view_reports", "run_end_of_day",
    "access_admin_panel", "access_settings", "view_financial_reconciliation",
    "staff_checkin", "manage_role_permissions", "manage_business_hours",
    "view_staff_workload", "view_staff_directory", "view_audit_trail",
    "use_clinical_tools", "administer_medication", "view_infection_control",
    "view_mortality_review", "view_bed_occupancy", "view_discharge_checklist",
    "view_supply_chain", "view_handover_board", "view_inventory_analytics", "view_emergency_protocols",
  ];

  const allKeys = [...features, ...routePermissions];

  const adminAll = allKeys.map(f => ({ role_name: "hospital_admin", feature_key: f, is_enabled: true }));

  const makePerms = (role: string, enabled: string[]) =>
    allKeys.map(f => ({ role_name: role, feature_key: f, is_enabled: enabled.includes(f) }));

  // Feature-level + route-level permissions per role
  const doctorEnabled = [
    // Feature-level
    "patients.create","patients.edit","patients.view","appointments.create","appointments.edit","appointments.view",
    "prescriptions.create","prescriptions.edit","prescriptions.view","lab.request","lab.view","billing.view",
    "ward.admit","ward.discharge","ward.view","vitals.view","nursing.view","reports.view","settings.view",
    "dashboard.view","dashboard.analytics","radiology.request","radiology.view","surgery.schedule","surgery.view",
    "diet.plan","diet.view","discharge.initiate","emergency.manage","emergency.view","telemedicine.consult",
    "telemedicine.view","blood_bank.request","blood_bank.view","messaging.send","messaging.view",
    "notifications.manage","compliance.view","ai_assistant.use","data_export.csv","data_export.pdf",
    // Route-level
    "view_patients","view_appointments","view_patient_history","view_medical_records",
    "access_doctor_console","view_patient_queue","view_prescriptions","view_clinical_notes",
    "view_treatment_plans","view_follow_ups","view_drug_interactions","view_referrals",
    "view_consent_forms","view_consultation_analytics","access_laboratory","view_lab_results",
    "use_clinical_tools","view_patient_education","view_patient_feedback","staff_checkin",
    "view_wait_times","access_emergency","view_surgery_schedule","view_diet_plans",
  ];

  const nurseEnabled = [
    "patients.view","patients.edit","appointments.view","prescriptions.view","lab.view","billing.view",
    "ward.view","ward.transfer","vitals.record","vitals.view","nursing.notes","nursing.view",
    "reports.view","settings.view","dashboard.view","diet.view","discharge.initiate","emergency.view",
    "blood_bank.view","messaging.send","messaging.view","notifications.manage","ai_assistant.use",
    // Route-level
    "view_patients","view_appointments","view_patient_history","view_medical_records",
    "access_inpatient","access_nurse_console","record_vitals","view_nursing_notes",
    "view_ward_rounds","view_diet_plans","view_bed_allocation","view_bed_occupancy",
    "administer_medication","view_discharge_checklist","view_handover_board",
    "use_clinical_tools","view_patient_education","staff_checkin",
  ];

  const pharmacistEnabled = [
    "patients.view","prescriptions.view","prescriptions.dispense","pharmacy.sell","pharmacy.adjust_stock",
    "pharmacy.view","pharmacy.purchase_orders","inventory.add","inventory.edit","inventory.view",
    "billing.view","reports.view","settings.view","dashboard.view","messaging.send","messaging.view",
    "notifications.manage","ai_assistant.use","data_export.csv",
    // Route-level
    "access_pos","view_medicines","view_inventory","view_sales_history","view_customers",
    "view_suppliers","view_purchase_orders","view_stock_reconciliation","view_controlled_drugs",
    "view_expiry_alerts","view_prescriptions","view_patients","staff_checkin","run_end_of_day",
    "view_inventory_analytics",
  ];

  const cashierEnabled = [
    "patients.view","billing.create","billing.edit","billing.process_payment","billing.view",
    "pharmacy.sell","pharmacy.view","reports.view","settings.view","dashboard.view",
    "messaging.view","notifications.manage",
    // Route-level
    "access_pos","access_billing","create_bill","process_payment","view_sales_history",
    "view_customers","view_outstanding_balances","staff_checkin","run_end_of_day",
  ];

  const labEnabled = [
    "patients.view","lab.request","lab.enter_results","lab.approve","lab.view","billing.view",
    "reports.view","settings.view","dashboard.view","messaging.send","messaging.view",
    "notifications.manage","quality.view","ai_assistant.use","data_export.csv",
    // Route-level
    "access_laboratory","view_lab_pending","view_lab_results","view_lab_quality",
    "view_lab_consumables","view_patients","staff_checkin",
  ];

  const receptionistEnabled = [
    "patients.create","patients.edit","patients.view","appointments.create","appointments.edit",
    "appointments.view","billing.create","billing.view","settings.view","dashboard.view",
    "messaging.view","notifications.manage",
    // Route-level
    "view_patients","view_appointments","view_patient_queue","view_wait_times","staff_checkin",
  ];

  const accountantEnabled = [
    "patients.view","billing.create","billing.edit","billing.process_payment","billing.view",
    "billing.refund","reports.view","reports.export","audit.view","settings.view","dashboard.view",
    "dashboard.analytics","messaging.view","notifications.manage","payroll.view","hr.view",
    "data_export.csv","data_export.pdf",
    // Route-level
    "access_billing","view_billing_analytics","view_outstanding_balances","view_insurance_claims",
    "process_refund","view_financial_reconciliation","view_reports","view_audit_trail","staff_checkin",
  ];

  const recordsEnabled = [
    "patients.view","patients.edit","appointments.view","prescriptions.view","lab.view","billing.view",
    "reports.view","reports.export","settings.view","dashboard.view","messaging.view",
    "notifications.manage","audit.view","data_export.csv","data_export.pdf",
    // Route-level
    "view_patients","view_appointments","view_patient_history","view_medical_records","staff_checkin",
  ];

  const radiologistEnabled = [
    "patients.view","radiology.request","radiology.view","radiology.report","lab.view","billing.view",
    "reports.view","settings.view","dashboard.view","messaging.send","messaging.view",
    "notifications.manage","ai_assistant.use",
    // Route-level
    "access_radiology","view_patients","view_patient_history","view_medical_records","staff_checkin",
  ];

  return [
    ...adminAll,
    ...makePerms("doctor", doctorEnabled),
    ...makePerms("nurse", nurseEnabled),
    ...makePerms("pharmacist", pharmacistEnabled),
    ...makePerms("cashier", cashierEnabled),
    ...makePerms("lab_technician", labEnabled),
    ...makePerms("receptionist", receptionistEnabled),
    ...makePerms("accountant", accountantEnabled),
    ...makePerms("records_officer", recordsEnabled),
    ...makePerms("radiologist", radiologistEnabled),
  ];
})();

/**
 * Seeds all platform defaults for a newly created hospital.
 * Idempotent — won't duplicate if called again.
 * Returns progress updates via optional callback.
 */
export async function seedPlatformDefaults(
  hospitalId: string,
  onProgress?: (step: string, detail: string) => void,
  facilityType?: string
): Promise<void> {
  const log = (s: string, d: string) => { onProgress?.(s, d); console.log(`[Seed] ${s}: ${d}`); };

  try {
    // 1. Departments — derived from the selected facility package profile.
    //    Hospital tenants get the full list; herbal clinics get a small council.
    const profile = getFacilityPackage(facilityType);
    const departments = profile.departments ?? DEFAULT_DEPARTMENTS;
    log("departments", `Creating ${departments.length} departments...`);
    const deptRows = departments.map(d => ({ ...d, hospital_id: hospitalId, is_active: true }));
    await supabase.from("departments").insert(deptRows as any);
    log("departments", `✅ ${departments.length} departments created`);

    // 2. Module Settings — seeded from the active package's module rules.
    //    Hospital profile ('*') seeds every module enabled; clinic/herbal seed
    //    everything except their exclude list. Always-on back-office modules are
    //    guaranteed present on every facility.
    const isModuleEnabled = (moduleKey: string): boolean => {
      if (profile.modules === "*") return true;
      return !profile.modules.exclude.includes(moduleKey);
    };
    const moduleNames: Record<string, string> = {};
    const categories: Record<string, string> = {};
    const descriptions: Record<string, string> = {};
    DEFAULT_MODULES.forEach((m: any) => {
      moduleNames[m.module_key] = m.module_name;
      categories[m.module_key] = m.category;
      descriptions[m.module_key] = m.description;
    });
    const moduleKeys = DEFAULT_MODULES.map((m: any) => m.module_key).concat(["facility_type"]);
    const facilityTypeModule: any = { module_key: "facility_type", module_name: "Facility Package", category: "Administration", is_enabled: true, description: "The selected healthcare facility type" };
    const allModules: any[] = moduleKeys.map((key: string) => ({
      module_key: key,
      module_name: moduleNames[key] || key.replace(/_/g, " "),
      category: categories[key] || "General",
      is_enabled: isModuleEnabled(key),
      description: descriptions[key] || "",
      hospital_id: hospitalId,
    }));
    allModules.push({ ...facilityTypeModule, hospital_id: hospitalId });
    log("modules", `Configuring ${allModules.length} modules...`);
    await supabase.from("module_settings").insert(allModules as any);
    log("modules", `✅ ${allModules.length} modules configured`);

    // 3. Dropdown Options (in batches)
    log("dropdowns", `Loading ${DEFAULT_DROPDOWN_OPTIONS.length} clinical options...`);
    const dropdownRows = DEFAULT_DROPDOWN_OPTIONS.map(d => ({ ...d, hospital_id: hospitalId, is_active: true }));
    const batchSize = 200;
    for (let i = 0; i < dropdownRows.length; i += batchSize) {
      await supabase.from("dropdown_options").insert(dropdownRows.slice(i, i + batchSize) as any);
      log("dropdowns", `Loaded ${Math.min(i + batchSize, dropdownRows.length)}/${dropdownRows.length} options`);
    }
    log("dropdowns", `✅ ${DEFAULT_DROPDOWN_OPTIONS.length} options loaded`);

  // 4. Business Hours
  log("hours", "Setting business hours...");
  const hoursRows = DEFAULT_BUSINESS_HOURS.map(h => ({ ...h, hospital_id: hospitalId }));
  await supabase.from("business_hours").insert(hoursRows as any);
  log("hours", "✅ Business hours configured");

  // 5. Role Permissions (in batches)
  log("permissions", `Setting ${DEFAULT_ROLE_PERMISSIONS.length} role permissions...`);
  const permRows = DEFAULT_ROLE_PERMISSIONS.map(p => ({ ...p, hospital_id: hospitalId }));
  for (let i = 0; i < permRows.length; i += batchSize) {
    await supabase.from("role_permissions").insert(permRows.slice(i, i + batchSize) as any);
    log("permissions", `Configured ${Math.min(i + batchSize, permRows.length)}/${permRows.length} permissions`);
  }
  log("permissions", `✅ ${DEFAULT_ROLE_PERMISSIONS.length} permissions set`);

  // 5b. Store the active facility package as a module_settings row so the load
  //     path always knows which profile to render (also visible in /admin → modules).
  log("modules", "Persisting facility type...");
  await supabase.from("module_settings").upsert({
    module_key: "facility_type",
    module_name: "Facility Package",
    category: "Administration",
    is_enabled: true,
    description: `Selected facility: ${profile.label} (${profile.key})`,
    hospital_id: hospitalId,
  } as any);
  log("modules", `✅ Facility type persisted: ${profile.label}`);

    // 6. Billing Settings
    log("billing", "Configuring billing defaults...");
    await supabase.from("billing_settings").insert({
      hospital_id: hospitalId,
      billing_mode: "realtime",
      cumulative_threshold: 50000,
      auto_bill_on_discharge: true,
      auto_verify_insurance: true,
      require_payment_confirmation: true,
      checkin_required: false,
      notification_expiry_hours: 3,
    } as any);
    log("billing", "✅ Billing configured");

    const totalItems = departments.length + allModules.length + DEFAULT_DROPDOWN_OPTIONS.length + 7 + DEFAULT_ROLE_PERMISSIONS.length + 1;
    log("complete", `✅ ${totalItems} platform defaults seeded successfully`);
  } catch (err) {
    console.error("Error seeding platform defaults:", err);
    log("error", "Some defaults may not have been created. Facility is still functional.");
  }
}

export { DEFAULT_DEPARTMENTS, DEFAULT_MODULES, DEFAULT_DROPDOWN_OPTIONS, DEFAULT_ROLE_PERMISSIONS };
