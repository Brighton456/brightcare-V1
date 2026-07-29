export type PermissionMap = Record<string, boolean>;

const PERMISSION_ALIASES: Record<string, string[]> = {
  // Dashboard
  access_ai_assistant: ["ai_assistant.use", "ai_assistant.configure"],
  view_dashboard: ["dashboard.view"],
  view_quick_stats: ["dashboard.analytics"],
  view_kpi_dashboard: ["dashboard.analytics"],

  // Patients
  register_patient: ["patients.create"],
  edit_patient: ["patients.edit"],
  delete_patient: ["patients.delete"],
  view_patient_list: ["view_patients", "patients.view"],
  search_patients: ["patients.view"],
  view_patient_history: ["patients.view"],
  view_medical_records: ["patients.view"],
  patient_feedback: ["view_patient_feedback"],

  // Appointments
  book_appointment: ["appointments.create"],
  reschedule_appointment: ["appointments.edit"],
  cancel_appointment: ["appointments.delete"],
  view_appointments: ["appointments.view"],

  // Doctor & consultation
  start_consultation: ["access_doctor_console"],
  write_clinical_notes: ["view_clinical_notes"],
  create_prescription: ["view_prescriptions", "prescriptions.create", "prescriptions.edit", "prescriptions.view"],
  request_lab_test: ["lab.request"],
  view_lab_results: ["lab.view"],
  create_treatment_plan: ["view_treatment_plans"],
  schedule_follow_up: ["view_follow_ups"],
  view_drug_interactions: ["use_clinical_tools"],
  consultation_analytics: ["view_consultation_analytics"],
  refer_to_specialist: ["view_referrals"],
  consent_management: ["view_consent_forms"],
  order_radiology: ["radiology.request", "access_radiology", "request_radiology"],
  request_radiology: ["order_radiology", "radiology.request", "access_radiology"],
  view_patient_vitals: ["vitals.view"],

  // Laboratory
  view_lab_pending: ["access_laboratory", "lab.view"],
  start_lab_test: ["access_laboratory"],
  enter_lab_results: ["lab.enter_results"],
  validate_lab_results: ["lab.approve"],
  lab_quality_control: ["view_lab_quality", "lab.view"],
  manage_lab_inventory: ["view_lab_consumables", "lab.view"],
  view_lab_analytics: ["view_lab_quality"],

  // Pharmacy & POS
  access_pos: ["pharmacy.sell", "pharmacy.view"],
  process_sale: ["pharmacy.sell"],
  view_sales_history: ["pharmacy.view"],
  add_medicine: ["view_medicines", "pharmacy.view", "inventory.add"],
  edit_medicine: ["inventory.edit"],
  delete_medicine: ["inventory.delete"],
  manage_stock: ["view_inventory", "view_supply_chain", "inventory.view", "inventory.edit", "inventory.add", "pharmacy.adjust_stock"],
  receive_stock: ["inventory.add"],
  stock_adjustment: ["inventory.edit", "pharmacy.adjust_stock"],
  view_expiry_alerts: ["inventory.view"],
  manage_controlled_drugs: ["pharmacy.view"],
  view_purchase_orders: ["pharmacy.purchase_orders"],
  create_purchase_order: ["pharmacy.purchase_orders"],
  stock_reconciliation: ["view_stock_reconciliation"],
  view_pharmacy_reports: ["reports.view"],
  manage_suppliers: ["view_suppliers", "pharmacy.purchase_orders"],
  prescription_dispensing: ["administer_medication", "prescriptions.dispense"],

  // Payment + billing
  create_bill: ["billing.create"],
  edit_bill: ["billing.edit"],
  process_payment: ["billing.process_payment"],
  view_billing_history: ["access_billing", "billing.view"],
  view_outstanding_balances: ["view_outstanding_balances"],
  billing_analytics: ["view_billing_analytics"],
  manage_insurance_claims: ["view_insurance_claims"],
  refund_management: ["process_refund", "billing.refund"],

  // Inpatient
  admit_patient: ["access_inpatient", "ward.admit", "ward.view"],
  discharge_patient: ["process_discharge", "ward.discharge", "discharge.initiate"],
  allocate_bed: ["view_bed_allocation", "ward.transfer"],
  transfer_patient: ["ward.transfer"],
  view_ward_status: ["ward.view", "access_inpatient"],
  record_vitals: ["vitals.record"],
  add_nursing_notes: ["access_nurse_console", "nursing.notes"],
  view_nursing_notes: ["nursing.view"],
  schedule_ward_rounds: ["view_ward_rounds", "view_handover_board"],
  manage_diet_plans: ["view_diet_plans", "diet.view"],
  create_diet_plan: ["access_nutrition", "diet.plan"],
  schedule_surgery: ["view_surgery_schedule", "access_operation_theatre", "surgery.schedule", "surgery.view"],
  icu_monitoring: ["access_icu"],
  print_discharge_papers: ["view_discharge_checklist", "discharge.approve"],
  view_bed_occupancy: ["ward.view"],

  // Departments
  manage_blood_inventory: ["blood_bank.view", "access_blood_bank"],
  request_blood_unit: ["blood_bank.request", "access_blood_bank"],
  emergency_triage: ["access_emergency", "emergency.manage", "emergency.view"],
  opd_queue_management: ["access_opd"],
  physiotherapy_scheduling: ["access_physiotherapy"],
  quality_assurance: ["access_quality_assurance", "quality.manage", "quality.view"],
  start_video_consultation: ["access_telemedicine", "telemedicine.consult", "telemedicine.view"],

  // Staff + admin
  add_staff: ["manage_staff", "staff.create"],
  edit_staff: ["staff.edit"],
  deactivate_staff: ["staff.delete"],
  manage_staff_roles: ["manage_role_permissions"],
  view_staff_directory: ["staff.view"],
  hr_payroll: ["access_hr_payroll", "hr.manage", "hr.view", "payroll.manage", "payroll.view"],
  attendance_tracking: ["staff_checkin", "view_attendance"],
  performance_reviews: ["view_performance_reviews"],
  view_staff_analytics: ["view_staff_workload"],
  asset_management: ["manage_assets", "assets.manage", "assets.view"],
  compliance_tracking: ["view_compliance", "compliance.manage", "compliance.view"],
  incident_reporting: ["view_incidents", "incidents.report", "incidents.view"],
  view_daily_report: ["view_reports", "reports.view"],
  view_inventory_report: ["view_inventory_analytics", "inventory.view", "reports.view"],
  view_financial_reconciliation: ["view_financial_reconciliation"],
  submit_settlement: ["run_end_of_day"],
  manage_business_hours: ["business_hours.manage"],
  audit_logs: ["view_audit_trail", "audit.view"],
  manage_settings: ["access_settings", "settings.manage", "settings.view"],
  manage_module_toggles: ["modules.manage"],
  manage_notifications: ["notifications.manage"],

  // Exports + communication
  export_csv: ["data_export.csv", "reports.export"],
  export_pdf: ["data_export.pdf", "reports.export"],
  data_backup: ["backup.manage"],
  send_notifications: ["messaging.send"],
  view_notifications: ["messaging.view"],
  in_app_messaging: ["messaging.send", "messaging.view"],
  send_sms: ["sms.send"],
  send_email: ["email.send"],

  // Quality
  infection_control: ["view_infection_control"],
  clinical_audit: ["view_mortality_review"],
};

const hasOwnPermission = (permissions: PermissionMap, key: string) =>
  Object.prototype.hasOwnProperty.call(permissions, key);

export function resolvePermissionValue(key: string, permissions: PermissionMap): boolean | undefined {
  if (hasOwnPermission(permissions, key)) {
    return permissions[key];
  }

  for (const alias of PERMISSION_ALIASES[key] || []) {
    if (hasOwnPermission(permissions, alias)) {
      return permissions[alias];
    }
  }

  return undefined;
}