import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { toast } from "@/hooks/use-toast";
import { Shield, Search, Save, MapPin, AlertTriangle } from "lucide-react";
import { useHospital } from "@/contexts/HospitalContext";
import { resolvePermissionValue } from "@/lib/permissionResolver";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ROLES = [
  "super_admin", "hospital_admin", "doctor", "nurse", "receptionist",
  "pharmacist", "cashier", "lab_technician", "accountant", "records_officer",
];

const FEATURE_CATEGORIES: Record<string, string[]> = {
  "Dashboard & Navigation": [
    "view_dashboard", "view_quick_stats", "view_announcements", "access_ai_assistant",
    "view_system_notifications", "customize_dashboard", "view_activity_feed",
  ],
  "Patient Management": [
    "register_patient", "edit_patient", "delete_patient", "view_patient_list",
    "search_patients", "view_patient_history", "merge_patient_records",
    "export_patient_data", "import_patients_csv", "assign_patient_id",
    "view_insurance_info", "edit_insurance_info", "upload_patient_photo",
    "add_patient_allergies", "view_chronic_conditions", "manage_emergency_contacts",
  ],
  "Appointments": [
    "book_appointment", "cancel_appointment", "reschedule_appointment",
    "view_appointments", "manage_doctor_schedule", "send_appointment_reminders",
    "view_appointment_calendar", "walk_in_registration", "appointment_analytics",
  ],
  "Doctor & Consultation": [
    "view_patient_queue", "start_consultation", "write_clinical_notes",
    "create_prescription", "request_lab_test", "view_lab_results",
    "write_diagnosis", "create_treatment_plan", "schedule_follow_up",
    "view_drug_interactions", "digital_signature", "consultation_analytics",
    "refer_to_specialist", "order_radiology", "view_patient_vitals",
    "manage_consultation_fees", "telemedicine_consultation",
  ],
  "Laboratory": [
    "view_lab_pending", "start_lab_test", "enter_lab_results",
    "validate_lab_results", "print_lab_report", "lab_quality_control",
    "manage_lab_inventory", "view_lab_analytics", "upload_result_files",
    "mark_abnormal_results", "request_retest", "lab_sample_tracking",
  ],
  "Pharmacy & POS": [
    "access_pos", "process_sale", "apply_discount", "accept_return",
    "hold_sale", "credit_sale", "split_payment", "view_sales_history",
    "add_medicine", "edit_medicine", "delete_medicine", "manage_stock",
    "receive_stock", "stock_adjustment", "view_expiry_alerts",
    "manage_controlled_drugs", "csv_import_medicines", "barcode_scanning",
    "view_purchase_orders", "create_purchase_order", "stock_reconciliation",
    "view_pharmacy_reports", "manage_suppliers", "batch_tracking",
    "prescription_dispensing", "allergy_cross_check",
  ],
  "Payment Methods": [
    "accept_cash", "accept_mpesa", "accept_card", "accept_credit",
    "accept_gift", "accept_account", "process_refund", "void_transaction",
    "partial_payment", "insurance_billing", "installment_plans",
    "send_stk_push", "verify_mpesa_payment",
  ],
  "Billing & Finance": [
    "create_bill", "edit_bill", "cancel_bill", "process_payment",
    "view_billing_history", "generate_invoice", "print_receipt",
    "email_receipt", "view_outstanding_balances", "billing_analytics",
    "manage_insurance_claims", "refund_management", "credit_notes",
    "view_financial_reports", "export_financial_data", "set_billing_mode",
    "cumulative_billing", "real_time_billing", "hybrid_billing",
    "configure_tax_rates", "set_billing_thresholds",
  ],
  "Inpatient & Ward": [
    "admit_patient", "discharge_patient", "allocate_bed", "transfer_patient",
    "view_ward_status", "record_vitals", "add_nursing_notes",
    "view_nursing_notes", "schedule_ward_rounds", "manage_diet_plans",
    "schedule_surgery", "icu_monitoring", "manage_bed_types",
    "view_bed_occupancy", "manage_ward_inventory", "nurse_shift_management",
    "view_discharge_summary", "print_discharge_papers",
  ],
  "Radiology & Imaging": [
    "request_radiology", "view_radiology_results", "upload_radiology_images",
    "manage_radiology_equipment", "radiology_scheduling", "pacs_integration",
  ],
  "Blood Bank": [
    "manage_blood_inventory", "request_blood_unit", "cross_match_blood",
    "record_blood_donation", "blood_bank_analytics", "blood_expiry_alerts",
  ],
  "Emergency & OPD": [
    "emergency_triage", "emergency_registration", "opd_queue_management",
    "emergency_billing", "trauma_documentation", "ambulance_tracking",
  ],
  "Operation Theatre": [
    "schedule_surgery", "manage_ot_inventory", "surgery_documentation",
    "anesthesia_records", "post_op_monitoring", "surgical_team_assignment",
  ],
  "Nutrition & Physiotherapy": [
    "create_diet_plan", "assign_diet_to_patient", "physiotherapy_scheduling",
    "therapy_progress_notes", "exercise_prescription", "nutrition_analytics",
  ],
  "Medical Records": [
    "view_medical_records", "edit_medical_records", "archive_records",
    "export_records", "manage_document_templates", "icd_coding",
    "health_information_exchange", "consent_management",
  ],
  "Reports & Analytics": [
    "view_daily_report", "view_weekly_report", "view_monthly_report",
    "view_sales_analytics", "view_inventory_report", "view_financial_report",
    "view_clinical_report", "view_staff_report", "export_csv",
    "export_pdf", "print_reports", "custom_report_builder",
    "view_kpi_dashboard", "predictive_analytics",
  ],
  "Staff & HR": [
    "add_staff", "edit_staff", "deactivate_staff", "manage_staff_roles",
    "view_staff_directory", "manage_departments", "hr_payroll",
    "attendance_tracking", "performance_reviews", "duty_roster",
    "shift_scheduling", "leave_management", "staff_salary_config",
    "view_staff_analytics",
  ],
  "Financial Operations": [
    "view_financial_reconciliation", "submit_settlement", "verify_settlement",
    "reject_settlement", "view_collection_reports", "manage_business_hours",
    "mark_inactive_days", "manage_staff_salaries", "profit_calculation",
    "cost_analysis", "revenue_forecasting",
  ],
  "System Administration": [
    "access_admin_panel", "manage_settings", "configure_billing",
    "manage_receipt_design", "data_backup", "data_restore",
    "import_data", "export_all_data", "manage_branding",
    "manage_security_policies", "manage_notifications",
    "manage_module_toggles", "system_info", "audit_logs",
    "manage_api_keys", "configure_mpesa", "manage_email_templates",
    "manage_sms_templates", "ip_whitelisting", "two_factor_auth",
    "session_management", "data_encryption", "compliance_tracking",
    "incident_reporting", "asset_management",
  ],
  "Communication": [
    "send_notifications", "view_notifications", "send_sms",
    "send_email", "in_app_messaging", "broadcast_announcement",
    "manage_notification_templates", "view_message_history",
  ],
  "Quality & Compliance": [
    "quality_assurance", "compliance_tracking", "incident_reporting",
    "risk_assessment", "accreditation_management", "clinical_audit",
    "infection_control", "patient_feedback",
  ],
  "Telemedicine": [
    "start_video_consultation", "manage_telemedicine_schedule",
    "telemedicine_prescriptions", "telemedicine_billing", "screen_sharing",
  ],
};

/**
 * PAGE ACCESS — maps each sidebar page to its route permission key.
 * These keys are saved into role_permissions just like feature keys,
 * and are read by canAccessRoute() in routePermissions.ts.
 */
const PAGE_ACCESS_CATEGORIES: Record<string, { title: string; route: string; permKey: string }[]> = {
  "Hospital": [
    { title: "Dashboard", route: "/dashboard", permKey: "page_access_dashboard" },
    { title: "Patients", route: "/patients", permKey: "view_patient_list" },
    { title: "Appointments", route: "/appointments", permKey: "view_appointments" },
    { title: "Patient History", route: "/patient-history", permKey: "view_patient_history" },
    { title: "Medical Records", route: "/medical-records", permKey: "view_medical_records" },
    { title: "Wait Times", route: "/wait-times", permKey: "view_appointments" },
    { title: "Patient Education", route: "/patient-education", permKey: "view_patient_history" },
    { title: "Patient Feedback", route: "/patient-feedback", permKey: "patient_feedback" },
  ],
  "Doctor & Consultation": [
    { title: "Doctor Console", route: "/doctor", permKey: "start_consultation" },
    { title: "Patient Queue", route: "/patient-queue", permKey: "view_patient_queue" },
    { title: "Prescriptions", route: "/prescriptions", permKey: "create_prescription" },
    { title: "Clinical Notes", route: "/clinical-notes", permKey: "write_clinical_notes" },
    { title: "Treatment Plans", route: "/treatment-plans", permKey: "create_treatment_plan" },
    { title: "Follow-up", route: "/follow-up", permKey: "schedule_follow_up" },
    { title: "Drug Interactions", route: "/drug-interactions", permKey: "view_drug_interactions" },
    { title: "Referrals", route: "/referrals", permKey: "refer_to_specialist" },
    { title: "Consent Forms", route: "/consent-management", permKey: "consent_management" },
    { title: "Consultation Analytics", route: "/consultation-analytics", permKey: "consultation_analytics" },
  ],
  "Laboratory": [
    { title: "Lab Dashboard", route: "/laboratory", permKey: "view_lab_pending" },
    { title: "Pending Tests", route: "/lab-pending", permKey: "view_lab_pending" },
    { title: "Enter Results", route: "/lab-results", permKey: "enter_lab_results" },
    { title: "Lab Consumables", route: "/lab-consumables", permKey: "manage_lab_inventory" },
    { title: "Service Bundles", route: "/lab-service-bundles", permKey: "view_lab_pending" },
    { title: "Quality Control", route: "/lab-quality", permKey: "lab_quality_control" },
  ],
  "Billing & Payments": [
    { title: "Billing", route: "/billing", permKey: "view_billing_history" },
    { title: "Create Bill", route: "/create-bill", permKey: "create_bill" },
    { title: "Process Payment", route: "/process-payment", permKey: "process_payment" },
    { title: "Insurance Claims", route: "/insurance-claims", permKey: "manage_insurance_claims" },
    { title: "Refunds", route: "/refunds", permKey: "refund_management" },
    { title: "Outstanding", route: "/outstanding-balances", permKey: "view_outstanding_balances" },
    { title: "Credit Sales", route: "/credit-sales", permKey: "credit_sale" },
    { title: "Billing Analytics", route: "/billing-analytics", permKey: "billing_analytics" },
  ],
  "Pharmacy POS": [
    { title: "Pharmacy POS", route: "/pos", permKey: "access_pos" },
    { title: "Sales History", route: "/sales-history", permKey: "view_sales_history" },
    { title: "Medicines", route: "/medicines", permKey: "add_medicine" },
    { title: "Inventory", route: "/inventory", permKey: "manage_stock" },
    { title: "Inventory Analytics", route: "/inventory-analytics", permKey: "view_inventory_report" },
    { title: "Purchase Orders", route: "/purchase-orders", permKey: "view_purchase_orders" },
    { title: "Purchase Invoices", route: "/invoices", permKey: "view_purchase_orders" },
    { title: "Supply Chain", route: "/supply-chain", permKey: "manage_stock" },
    { title: "Stock Reconciliation", route: "/stock-reconciliation", permKey: "stock_reconciliation" },
    { title: "Controlled Drugs", route: "/controlled-drugs", permKey: "manage_controlled_drugs" },
    { title: "Expiry Alerts", route: "/expiry-alerts", permKey: "view_expiry_alerts" },
    { title: "Customers", route: "/customers", permKey: "access_pos" },
    { title: "Suppliers", route: "/suppliers", permKey: "manage_suppliers" },
  ],
  "Inpatient & Ward": [
    { title: "Ward Overview", route: "/inpatient", permKey: "admit_patient" },
    { title: "Bed Allocation", route: "/bed-allocation", permKey: "allocate_bed" },
    { title: "Bed Occupancy", route: "/bed-occupancy", permKey: "view_bed_occupancy" },
    { title: "Nurse Console", route: "/nurse-console", permKey: "add_nursing_notes" },
    { title: "Medication Admin", route: "/medication-administration", permKey: "prescription_dispensing" },
    { title: "Vitals Recording", route: "/vitals", permKey: "record_vitals" },
    { title: "Nursing Notes", route: "/nursing-notes", permKey: "view_nursing_notes" },
    { title: "Ward Rounds", route: "/ward-rounds", permKey: "schedule_ward_rounds" },
    { title: "Handover Board", route: "/handover", permKey: "schedule_ward_rounds" },
    { title: "Diet Plans", route: "/diet-plans", permKey: "manage_diet_plans" },
    { title: "Surgery", route: "/surgery", permKey: "schedule_surgery" },
    { title: "ICU Monitoring", route: "/icu", permKey: "icu_monitoring" },
    { title: "Discharge Checklist", route: "/discharge-checklist", permKey: "print_discharge_papers" },
    { title: "Discharge", route: "/discharge", permKey: "discharge_patient" },
  ],
  "Departments": [
    { title: "Emergency", route: "/emergency", permKey: "emergency_triage" },
    { title: "Emergency Protocols", route: "/emergency-protocols", permKey: "emergency_triage" },
    { title: "OPD", route: "/opd", permKey: "opd_queue_management" },
    { title: "Radiology", route: "/radiology", permKey: "request_radiology" },
    { title: "Blood Bank", route: "/blood-bank", permKey: "manage_blood_inventory" },
    { title: "Operation Theatre", route: "/operation-theatre", permKey: "schedule_surgery" },
    { title: "Nutrition", route: "/nutrition", permKey: "create_diet_plan" },
    { title: "Physiotherapy", route: "/physiotherapy", permKey: "physiotherapy_scheduling" },
    { title: "Telemedicine", route: "/telemedicine", permKey: "start_video_consultation" },
    { title: "Infection Control", route: "/infection-control", permKey: "infection_control" },
    { title: "Quality Assurance", route: "/quality-assurance", permKey: "quality_assurance" },
  ],
  "Clinical Tools": [
    { title: "Medical Calculators", route: "/clinical-tools", permKey: "view_drug_interactions" },
  ],
  "Administration": [
    { title: "Staff Management", route: "/staff", permKey: "add_staff" },
    { title: "Staff Directory", route: "/staff-directory", permKey: "view_staff_directory" },
    { title: "Staff Workload", route: "/staff-workload", permKey: "view_staff_analytics" },
    { title: "Staff Check-In", route: "/staff-checkin", permKey: "attendance_tracking" },
    { title: "HR & Payroll", route: "/hr-payroll", permKey: "hr_payroll" },
    { title: "Attendance", route: "/attendance", permKey: "attendance_tracking" },
    { title: "Performance", route: "/performance", permKey: "performance_reviews" },
    { title: "Assets", route: "/assets", permKey: "asset_management" },
    { title: "Compliance", route: "/compliance", permKey: "compliance_tracking" },
    { title: "Incidents", route: "/incidents", permKey: "incident_reporting" },
    { title: "Mortality Review", route: "/mortality-review", permKey: "clinical_audit" },
    { title: "Audit Trail", route: "/audit-trail", permKey: "audit_logs" },
    { title: "Reports", route: "/reports", permKey: "view_daily_report" },
    { title: "End of Day", route: "/end-of-day", permKey: "submit_settlement" },
    { title: "Reconciliation", route: "/financial-reconciliation", permKey: "view_financial_reconciliation" },
    { title: "Business Hours", route: "/business-hours", permKey: "manage_business_hours" },
    { title: "Role Permissions", route: "/role-permissions", permKey: "manage_staff_roles" },
    { title: "Notifications", route: "/notifications", permKey: "view_notifications" },
    { title: "Admin Panel", route: "/admin", permKey: "access_admin_panel" },
    { title: "Documentation", route: "/documentation", permKey: "page_access_documentation" },
    { title: "Settings", route: "/settings", permKey: "manage_settings" },
  ],
};

/**
 * CRITICAL SETTINGS — admin-only operations that can be restricted per role.
 * When enabled for a role, ONLY that role (plus admins) can perform the action.
 * When disabled, anyone with the underlying feature permission can do it.
 */
const CRITICAL_SETTINGS_LIST = [
  { key: "admin_only_medicine_edit", label: "Only Admin Can Edit Medicine Details", description: "Restricts adding, editing, and deleting medicines to admin roles only" },
  { key: "admin_only_medicine_quantity", label: "Only Admin Can Edit Medicine Quantity/Stock", description: "Only admins can change stock levels, reorder quantities, and adjust inventory" },
  { key: "admin_only_price_edit", label: "Only Admin Can Edit Medicine Prices", description: "Restricts price and cost price changes to admin roles only" },
  { key: "admin_only_billing_override", label: "Only Admin Can Override Bills & Refunds", description: "Only admins can cancel bills, process refunds, and adjust billing" },
  { key: "admin_only_staff_deactivate", label: "Only Admin Can Deactivate Staff", description: "Only admins can deactivate or delete staff accounts" },
  { key: "admin_only_settings_change", label: "Only Admin Can Change System Settings", description: "Only admins can modify hospital settings, branding, and configuration" },
  { key: "admin_only_role_change", label: "Only Admin Can Change Staff Roles", description: "Only admins can modify role assignments and permissions" },
];

// Flatten all page permKeys for saving
const allPagePermKeys = Object.values(PAGE_ACCESS_CATEGORIES).flat().map(p => p.permKey);
const uniquePagePermKeys = [...new Set(allPagePermKeys)];

const allFeatures = Object.entries(FEATURE_CATEGORIES).flatMap(([cat, features]) =>
  features.map(f => ({ key: f, category: cat }))
);

export default function RolePermissions() {
  const { hospitalId } = useHospital();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") || "doctor";
  const [selectedRole, setSelectedRole] = useState(
    ROLES.includes(initialRole) ? initialRole : "doctor"
  );
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("features");

  useEffect(() => {
    const fetchPerms = async () => {
      if (!hospitalId) return;

      const { data, error } = await supabase
        .from("role_permissions")
        .select("feature_key,is_enabled")
        .eq("hospital_id", hospitalId)
        .eq("role_name", selectedRole);

      if (error) {
        toast({ title: "Permissions Error", description: error.message, variant: "destructive" });
        return;
      }

      const rawPerms: Record<string, boolean> = {};
      (data || []).forEach((p: any) => {
        rawPerms[p.feature_key] = p.is_enabled;
      });

      const permMap: Record<string, boolean> = {};
      // Default: super_admin gets everything enabled
      const allKeys = [...allFeatures.map(f => f.key), ...uniquePagePermKeys, ...CRITICAL_SETTINGS_LIST.map(s => s.key)];
      const uniqueKeys = [...new Set(allKeys)];
      uniqueKeys.forEach(key => {
        permMap[key] = selectedRole === "super_admin"
          ? true
          : (resolvePermissionValue(key, rawPerms) ?? false);
      });

      setPermissions(permMap);
    };
    fetchPerms();
  }, [hospitalId, selectedRole]);

  const toggleFeature = (key: string) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleCategory = (category: string, enable: boolean) => {
    const features = FEATURE_CATEGORIES[category] || [];
    setPermissions(prev => {
      const updated = { ...prev };
      features.forEach(f => { updated[f] = enable; });
      return updated;
    });
  };

  const togglePageCategory = (category: string, enable: boolean) => {
    const pages = PAGE_ACCESS_CATEGORIES[category] || [];
    setPermissions(prev => {
      const updated = { ...prev };
      pages.forEach(p => { updated[p.permKey] = enable; });
      return updated;
    });
  };

  const savePermissions = async () => {
    if (!hospitalId) {
      toast({ title: "Hospital not ready", description: "Wait for the hospital profile to finish loading.", variant: "destructive" });
      return;
    }

    setSaving(true);

    // Step 1: Delete all existing permissions for this hospital + role
    const { error: deleteErr } = await supabase
      .from("role_permissions")
      .delete()
      .eq("hospital_id", hospitalId)
      .eq("role_name", selectedRole);

    if (deleteErr) {
      toast({ title: "Error Saving", description: deleteErr.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    // Step 2: Insert all permissions in chunks
    const rows = Object.entries(permissions).map(([feature_key, is_enabled]) => ({
      hospital_id: hospitalId,
      role_name: selectedRole,
      feature_key,
      is_enabled,
    }));
    const chunkSize = 100;
    let errorOccurred = false;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const { error } = await supabase.from("role_permissions").insert(chunk as any[]);
      if (error) {
        errorOccurred = true;
        toast({ title: "Error Saving", description: error.message, variant: "destructive" });
        break;
      }
    }
    if (!errorOccurred) {
      toast({ title: "Permissions Saved", description: `Updated ${rows.length} permissions for ${selectedRole.replace(/_/g, " ")}` });
    }
    setSaving(false);
  };

  const filtered = search
    ? allFeatures.filter(f => f.key.includes(search.toLowerCase()) || f.category.toLowerCase().includes(search.toLowerCase()))
    : allFeatures;

  const groupedFiltered = filtered.reduce((acc, f) => {
    if (!acc[f.category]) acc[f.category] = [];
    acc[f.category].push(f);
    return acc;
  }, {} as Record<string, typeof allFeatures>);

  const enabledCount = Object.values(permissions).filter(Boolean).length;
  const totalKeys = [...new Set([...allFeatures.map(f => f.key), ...uniquePagePermKeys])].length;

  // Filter page access by search
  const filteredPageCategories = search
    ? Object.entries(PAGE_ACCESS_CATEGORIES).reduce((acc, [cat, pages]) => {
        const matched = pages.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || cat.toLowerCase().includes(search.toLowerCase()));
        if (matched.length > 0) acc[cat] = matched;
        return acc;
      }, {} as typeof PAGE_ACCESS_CATEGORIES)
    : PAGE_ACCESS_CATEGORIES;

  return (
    <AppLayout title="Role Permissions">
      <div className="space-y-4 max-w-5xl">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ROLES.map(r => (
                <SelectItem key={r} value={r}>{r.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search features or pages..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="font-bold text-foreground">{enabledCount}</span> / {totalKeys} enabled
          </div>
          <Button onClick={savePermissions} disabled={saving} className="ml-auto gap-1">
            <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Permissions"}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="features" className="gap-1"><Shield className="h-3.5 w-3.5" /> Feature Permissions</TabsTrigger>
            <TabsTrigger value="pages" className="gap-1"><MapPin className="h-3.5 w-3.5" /> Page Access</TabsTrigger>
            <TabsTrigger value="critical" className="gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Critical Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="features" className="space-y-4 mt-4">
            {Object.entries(groupedFiltered).map(([category, features]) => {
              const catEnabled = features.filter(f => permissions[f.key]).length;
              return (
                <Card key={category}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        {category}
                        <span className="text-xs font-normal text-muted-foreground">({catEnabled}/{features.length})</span>
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => toggleCategory(category, true)}>Enable All</Button>
                        <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => toggleCategory(category, false)}>Disable All</Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {features.map(f => (
                        <div key={f.key} className="flex items-center justify-between p-2 rounded border text-xs">
                          <span className="capitalize">{f.key.replace(/_/g, " ")}</span>
                          <Switch checked={permissions[f.key] || false} onCheckedChange={() => toggleFeature(f.key)} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="pages" className="space-y-4 mt-4">
            <p className="text-xs text-muted-foreground bg-muted/50 border rounded-lg p-3">
              🔐 <strong>Page Access Control</strong> — Toggle which sidebar pages this role can access. Disabled pages appear locked (🔒) in the sidebar. These settings override feature defaults and take priority.
            </p>
            {Object.entries(filteredPageCategories).map(([category, pages]) => {
              const catEnabled = pages.filter(p => permissions[p.permKey]).length;
              return (
                <Card key={category}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {category}
                        <span className="text-xs font-normal text-muted-foreground">({catEnabled}/{pages.length})</span>
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => togglePageCategory(category, true)}>Enable All</Button>
                        <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => togglePageCategory(category, false)}>Disable All</Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {pages.map(p => (
                        <div key={p.route} className="flex items-center justify-between p-2 rounded border text-xs">
                          <div className="flex items-center gap-2">
                            <span>{p.title}</span>
                            {!permissions[p.permKey] && <span className="text-[10px]">🔒</span>}
                          </div>
                          <Switch checked={permissions[p.permKey] || false} onCheckedChange={() => toggleFeature(p.permKey)} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="critical" className="space-y-4 mt-4">
            <p className="text-xs text-muted-foreground bg-muted/50 border rounded-lg p-3">
              ⚠️ <strong>Critical Settings</strong> — Restrict sensitive operations to admin-only. When enabled, only hospital_admin, super_admin, and platform_admin can perform these actions for this role. Other roles will be blocked even if they have the underlying feature permission.
            </p>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Admin-Only Restrictions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {CRITICAL_SETTINGS_LIST.map(setting => (
                    <div key={setting.key} className="flex items-center justify-between p-3 rounded border">
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="text-sm font-medium">{setting.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{setting.description}</p>
                      </div>
                      <Switch checked={permissions[setting.key] || false} onCheckedChange={() => toggleFeature(setting.key)} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
