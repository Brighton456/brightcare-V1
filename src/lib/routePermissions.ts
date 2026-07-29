import { resolvePermissionValue } from "@/lib/permissionResolver";

/**
 * Maps each route path to the permission key(s) required to access it.
 * Keys MUST match the feature_key values used in RolePermissions.tsx / FEATURE_CATEGORIES.
 * If a route has no entry here, it's accessible to all authenticated staff.
 */

// Route → required permission key (aligned with FEATURE_CATEGORIES in RolePermissions.tsx)
export const ROUTE_PERMISSIONS: Record<string, string> = {
  // Patient Management
  "/patients": "view_patient_list",
  "/appointments": "view_appointments",
  "/patient-history": "view_patient_history",
  "/medical-records": "view_medical_records",
  "/wait-times": "view_appointments",
  "/patient-education": "view_patient_history",
  "/patient-feedback": "patient_feedback",

  // Doctor & Consultation
  "/doctor": "start_consultation",
  "/patient-queue": "view_patient_queue",
  "/prescriptions": "create_prescription",
  "/clinical-notes": "write_clinical_notes",
  "/treatment-plans": "create_treatment_plan",
  "/follow-up": "schedule_follow_up",
  "/drug-interactions": "view_drug_interactions",
  "/referrals": "refer_to_specialist",
  "/consent-management": "consent_management",
  "/consultation-analytics": "consultation_analytics",

  // Laboratory
  "/laboratory": "view_lab_pending",
  "/lab-pending": "view_lab_pending",
  "/lab-results": "enter_lab_results",
  "/lab-quality": "lab_quality_control",
  "/lab-consumables": "manage_lab_inventory",
  "/lab-service-bundles": "view_lab_pending",

  // Billing & Finance
  "/billing": "view_billing_history",
  "/create-bill": "create_bill",
  "/process-payment": "process_payment",
  "/insurance-claims": "manage_insurance_claims",
  "/refunds": "refund_management",
  "/billing-analytics": "billing_analytics",
  "/outstanding-balances": "view_outstanding_balances",
  "/credit-sales": "credit_sale",

  // Pharmacy & POS
  "/pos": "access_pos",
  "/medicines": "add_medicine",
  "/inventory": "manage_stock",
  "/sales-history": "view_sales_history",
  "/customers": "access_pos",
  "/suppliers": "manage_suppliers",
  "/purchase-orders": "view_purchase_orders",
  "/invoices": "view_purchase_orders",
  "/stock-reconciliation": "stock_reconciliation",
  "/controlled-drugs": "manage_controlled_drugs",
  "/expiry-alerts": "view_expiry_alerts",

  // Inpatient & Ward
  "/inpatient": "admit_patient",
  "/bed-allocation": "allocate_bed",
  "/nurse-console": "add_nursing_notes",
  "/vitals": "record_vitals",
  "/nursing-notes": "view_nursing_notes",
  "/ward-rounds": "schedule_ward_rounds",
  "/diet-plans": "manage_diet_plans",
  "/surgery": "schedule_surgery",
  "/icu": "icu_monitoring",
  "/discharge": "discharge_patient",

  // Departments
  "/radiology": "request_radiology",
  "/blood-bank": "manage_blood_inventory",
  "/operation-theatre": "schedule_surgery",
  "/emergency": "emergency_triage",
  "/opd": "opd_queue_management",
  "/nutrition": "create_diet_plan",
  "/physiotherapy": "physiotherapy_scheduling",
  "/quality-assurance": "quality_assurance",
  "/telemedicine": "start_video_consultation",

  // Staff & HR
  "/staff": "add_staff",
  "/hr-payroll": "hr_payroll",
  "/attendance": "attendance_tracking",
  "/performance": "performance_reviews",
  "/assets": "asset_management",
  "/compliance": "compliance_tracking",
  "/incidents": "incident_reporting",
  "/reports": "view_daily_report",
  "/end-of-day": "submit_settlement",
  "/admin": "access_admin_panel",
  "/settings": "manage_settings",
  "/financial-reconciliation": "view_financial_reconciliation",
  "/staff-checkin": "attendance_tracking",
  "/role-permissions": "manage_staff_roles",
  "/business-hours": "manage_business_hours",
  "/staff-workload": "view_staff_analytics",
  "/staff-directory": "view_staff_directory",
  "/audit-trail": "audit_logs",

  // Workflow
  "/clinical-tools": "view_drug_interactions",
  "/medication-administration": "prescription_dispensing",
  "/infection-control": "infection_control",
  "/mortality-review": "clinical_audit",
  "/bed-occupancy": "view_bed_occupancy",
  "/discharge-checklist": "print_discharge_papers",
  "/supply-chain": "manage_stock",
  "/handover": "schedule_ward_rounds",
  "/inventory-analytics": "view_inventory_report",
  "/emergency-protocols": "emergency_triage",
};

/**
 * Default role → allowed permission keys.
 * Uses the same feature keys as FEATURE_CATEGORIES in RolePermissions.tsx.
 * super_admin and hospital_admin bypass all checks.
 */
export const ROLE_DEFAULTS: Record<string, string[]> = {
  doctor: [
    "view_patient_list", "search_patients", "view_patient_history", "view_appointments",
    "book_appointment", "start_consultation", "write_clinical_notes", "create_prescription",
    "request_lab_test", "view_lab_results", "write_diagnosis", "create_treatment_plan",
    "schedule_follow_up", "view_drug_interactions", "refer_to_specialist", "view_patient_vitals",
    "consultation_analytics", "digital_signature", "telemedicine_consultation",
    "view_patient_queue", "view_medical_records", "consent_management", "patient_feedback",
    "order_radiology", "manage_consultation_fees",
  ],
  nurse: [
    "view_patient_list", "search_patients", "view_patient_history", "view_appointments",
    "view_medical_records", "admit_patient", "allocate_bed", "add_nursing_notes",
    "view_nursing_notes", "record_vitals", "schedule_ward_rounds", "manage_diet_plans",
    "view_bed_occupancy", "discharge_patient", "print_discharge_papers",
    "prescription_dispensing", "attendance_tracking", "view_patient_queue",
    "view_ward_status", "manage_ward_inventory", "nurse_shift_management",
  ],
  lab_technician: [
    "view_lab_pending", "start_lab_test", "enter_lab_results", "validate_lab_results",
    "print_lab_report", "lab_quality_control", "manage_lab_inventory",
    "upload_result_files", "mark_abnormal_results", "request_retest",
    "view_patient_list", "attendance_tracking",
  ],
  pharmacist: [
    "access_pos", "process_sale", "apply_discount", "view_sales_history",
    "add_medicine", "edit_medicine", "manage_stock", "receive_stock",
    "stock_adjustment", "view_expiry_alerts", "manage_controlled_drugs",
    "csv_import_medicines", "view_purchase_orders", "create_purchase_order",
    "stock_reconciliation", "manage_suppliers", "batch_tracking",
    "prescription_dispensing", "allergy_cross_check", "barcode_scanning",
    "view_patient_list", "create_prescription", "attendance_tracking",
    "submit_settlement", "view_inventory_report",
  ],
  cashier: [
    "access_pos", "process_sale", "view_sales_history",
    "view_billing_history", "create_bill", "process_payment",
    "print_receipt", "view_outstanding_balances",
    "accept_cash", "accept_mpesa", "accept_card", "accept_credit",
    "partial_payment", "send_stk_push", "verify_mpesa_payment",
    "credit_sale", "attendance_tracking", "submit_settlement",
  ],
  receptionist: [
    "view_patient_list", "register_patient", "search_patients",
    "book_appointment", "cancel_appointment", "reschedule_appointment",
    "view_appointments", "walk_in_registration", "view_patient_queue",
    "attendance_tracking",
  ],
  accountant: [
    "view_billing_history", "billing_analytics", "view_outstanding_balances",
    "manage_insurance_claims", "refund_management", "credit_notes",
    "view_financial_reports", "export_financial_data",
    "view_financial_reconciliation", "submit_settlement", "verify_settlement",
    "view_collection_reports", "view_daily_report", "view_monthly_report",
    "audit_logs", "attendance_tracking", "profit_calculation",
  ],
  radiologist: [
    "request_radiology", "view_radiology_results", "upload_radiology_images",
    "view_patient_list", "view_patient_history", "view_medical_records",
    "attendance_tracking",
  ],
  physiotherapist: [
    "physiotherapy_scheduling", "therapy_progress_notes", "exercise_prescription",
    "view_patient_list", "view_patient_history", "view_medical_records",
    "attendance_tracking",
  ],
  records_officer: [
    "view_medical_records", "edit_medical_records", "archive_records",
    "export_records", "manage_document_templates", "icd_coding",
    "view_patient_list", "search_patients", "view_patient_history",
    "attendance_tracking",
  ],
};

/**
 * Check if a given role can access a route, using explicit permissions or defaults.
 */
export function canAccessRoute(
  route: string,
  role: string,
  permissions: Record<string, boolean>
): boolean {
  // Admins bypass everything
  if (role === "platform_admin" || role === "super_admin" || role === "hospital_admin" || role === "admin") return true;

  // Dashboard, notifications, documentation are always accessible
  if (route === "/" || route === "/dashboard" || route === "/notifications" || route === "/documentation") return true;

  const requiredPermission = ROUTE_PERMISSIONS[route];
  if (!requiredPermission) return true; // No restriction defined

  // Check explicit DB permissions first, including legacy aliases
  const resolvedPermission = resolvePermissionValue(requiredPermission, permissions);
  if (typeof resolvedPermission === "boolean") {
    return resolvedPermission;
  }

  // Fall back to role defaults
  const defaults = ROLE_DEFAULTS[role];
  if (defaults) {
    return defaults.includes(requiredPermission);
  }

  // Unknown role with no permissions → deny
  return false;
}
