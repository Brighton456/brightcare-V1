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
  "/branches": "manage_branches",

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
 * Critical settings — admin-only operations.
 * These keys are saved into role_permissions like feature keys.
 * Enforced in the respective pages.
 */
export const CRITICAL_SETTINGS: Record<string, string> = {
  "/medicines": "admin_only_medicine_edit",
};

/**
 * Check if a given role can access a route, using DB permissions.
 * super_admin and hospital_admin bypass all checks.
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

  // No DB permission found and no default → deny
  return false;
}
