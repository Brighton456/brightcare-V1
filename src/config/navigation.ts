import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, ShoppingCart, Package, Pill, BarChart3, Shield, Settings, LogOut, Building2,
  History, Calendar, Users, Truck, Stethoscope, FlaskConical, CreditCard, CalendarCheck,
  UserPlus, Heart, Bed, FileText, ClipboardList, Scissors, Siren, Video, Dumbbell,
  Droplet, Image, Apple, Archive, Award, Activity, Clock, AlertTriangle, Utensils,
  DollarSign, RotateCcw, Star, Wrench, Receipt, Bell, UserCheck, Wallet,
  MessageSquare, Calculator, BookOpen, ArrowRightLeft, Pill as PillIcon, Bug, FileSignature,
  Timer, Layers, Phone, MessageCircle, Brain, Gauge,
} from "lucide-react";

/**
 * Package-aware navigation registry.
 *
 * NAV_HOSPITAL is the historical Brightcare sidebar, extracted verbatim —
 * existing hospital installations must render exactly the same tree.
 * Other facility packages define their own nav trees here; the AppSidebar
 * renders whichever tree the active facility package selects.
 */

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

/** Hospital package — identical to the pre-package sidebar. */
export const NAV_HOSPITAL: NavSection[] = [
  {
    label: "Hospital", items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Patients", url: "/patients", icon: Heart },
      { title: "Appointments", url: "/appointments", icon: CalendarCheck },
      { title: "Patient History", url: "/patient-history", icon: Archive },
      { title: "Medical Records", url: "/medical-records", icon: FileText },
      { title: "Wait Times", url: "/wait-times", icon: Timer },
      { title: "Patient Education", url: "/patient-education", icon: BookOpen },
      { title: "Patient Feedback", url: "/patient-feedback", icon: Star },
    ],
  },
  {
    label: "Doctor & Consultation", items: [
      { title: "Doctor Console", url: "/doctor", icon: Stethoscope },
      { title: "Patient Queue", url: "/patient-queue", icon: Users },
      { title: "Prescriptions", url: "/prescriptions", icon: Pill },
      { title: "Clinical Notes", url: "/clinical-notes", icon: FileText },
      { title: "Treatment Plans", url: "/treatment-plans", icon: ClipboardList },
      { title: "Follow-up", url: "/follow-up", icon: CalendarCheck },
      { title: "Drug Interactions", url: "/drug-interactions", icon: AlertTriangle },
      { title: "Referrals", url: "/referrals", icon: ArrowRightLeft },
      { title: "Consent Forms", url: "/consent-management", icon: FileSignature },
      { title: "Consultation Analytics", url: "/consultation-analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Laboratory", items: [
      { title: "Lab Dashboard", url: "/laboratory", icon: FlaskConical },
      { title: "Pending Tests", url: "/lab-pending", icon: Clock },
      { title: "Enter Results", url: "/lab-results", icon: FlaskConical },
      { title: "Lab Consumables", url: "/lab-consumables", icon: Package },
      { title: "Service Bundles", url: "/lab-service-bundles", icon: FlaskConical },
      { title: "Quality Control", url: "/lab-quality", icon: Shield },
    ],
  },
  {
    label: "Billing & Payments", items: [
      { title: "Billing", url: "/billing", icon: CreditCard },
      { title: "Create Bill", url: "/create-bill", icon: Receipt },
      { title: "Process Payment", url: "/process-payment", icon: DollarSign },
      { title: "Insurance Claims", url: "/insurance-claims", icon: Shield },
      { title: "Refunds", url: "/refunds", icon: RotateCcw },
      { title: "Outstanding", url: "/outstanding-balances", icon: AlertTriangle },
      { title: "Credit Sales", url: "/credit-sales", icon: CreditCard },
      { title: "Billing Analytics", url: "/billing-analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Pharmacy POS", items: [
      { title: "Pharmacy POS", url: "/pos", icon: ShoppingCart },
      { title: "Sales History", url: "/sales-history", icon: History },
      { title: "Medicines", url: "/medicines", icon: Pill },
      { title: "Inventory", url: "/inventory", icon: Package },
      { title: "Inventory Analytics", url: "/inventory-analytics", icon: BarChart3 },
      { title: "Purchase Orders", url: "/purchase-orders", icon: ShoppingCart },
      { title: "Purchase Invoices", url: "/invoices", icon: FileText },
      { title: "Supply Chain", url: "/supply-chain", icon: Truck },
      { title: "Stock Reconciliation", url: "/stock-reconciliation", icon: ClipboardList },
      { title: "Controlled Drugs", url: "/controlled-drugs", icon: Shield },
      { title: "Expiry Alerts", url: "/expiry-alerts", icon: AlertTriangle },
      { title: "Customers", url: "/customers", icon: Users },
      { title: "Suppliers", url: "/suppliers", icon: Truck },
    ],
  },
  {
    label: "Inpatient & Ward", items: [
      { title: "Ward Overview", url: "/inpatient", icon: Bed },
      { title: "Bed Allocation", url: "/bed-allocation", icon: Bed },
      { title: "Bed Occupancy", url: "/bed-occupancy", icon: Layers },
      { title: "Nurse Console", url: "/nurse-console", icon: Stethoscope },
      { title: "Medication Admin", url: "/medication-administration", icon: PillIcon },
      { title: "Vitals Recording", url: "/vitals", icon: Activity },
      { title: "Nursing Notes", url: "/nursing-notes", icon: FileText },
      { title: "Ward Rounds", url: "/ward-rounds", icon: ClipboardList },
      { title: "Handover Board", url: "/handover", icon: MessageSquare },
      { title: "Diet Plans", url: "/diet-plans", icon: Utensils },
      { title: "Surgery", url: "/surgery", icon: Scissors },
      { title: "ICU Monitoring", url: "/icu", icon: Activity },
      { title: "Discharge Checklist", url: "/discharge-checklist", icon: ClipboardList },
      { title: "Discharge", url: "/discharge", icon: LogOut },
    ],
  },
  {
    label: "Departments", items: [
      { title: "Emergency", url: "/emergency", icon: Siren },
      { title: "Emergency Protocols", url: "/emergency-protocols", icon: AlertTriangle },
      { title: "OPD", url: "/opd", icon: Users },
      { title: "Radiology", url: "/radiology", icon: Image },
      { title: "Blood Bank", url: "/blood-bank", icon: Droplet },
      { title: "Operation Theatre", url: "/operation-theatre", icon: Scissors },
      { title: "Nutrition", url: "/nutrition", icon: Apple },
      { title: "Physiotherapy", url: "/physiotherapy", icon: Dumbbell },
      { title: "Telemedicine", url: "/telemedicine", icon: Video },
      { title: "Infection Control", url: "/infection-control", icon: Bug },
      { title: "Quality Assurance", url: "/quality-assurance", icon: Award },
    ],
  },
  {
    label: "Clinical Tools", items: [
      { title: "Medical Calculators", url: "/clinical-tools", icon: Calculator },
    ],
  },
  {
    label: "Administration", items: [
      { title: "Staff Management", url: "/staff", icon: UserPlus },
      { title: "Staff Directory", url: "/staff-directory", icon: Phone },
      { title: "Staff Workload", url: "/staff-workload", icon: Gauge },
      { title: "Staff Check-In", url: "/staff-checkin", icon: UserCheck },
      { title: "HR & Payroll", url: "/hr-payroll", icon: DollarSign },
      { title: "Attendance", url: "/attendance", icon: Clock },
      { title: "Performance", url: "/performance", icon: Star },
      { title: "Assets", url: "/assets", icon: Wrench },
      { title: "Compliance", url: "/compliance", icon: Shield },
      { title: "Incidents", url: "/incidents", icon: AlertTriangle },
      { title: "Mortality Review", url: "/mortality-review", icon: FileText },
      { title: "Audit Trail", url: "/audit-trail", icon: Shield },
      { title: "Reports", url: "/reports", icon: BarChart3 },
      { title: "End of Day", url: "/end-of-day", icon: Calendar },
      { title: "Reconciliation", url: "/financial-reconciliation", icon: Wallet },
      { title: "Business Hours", url: "/business-hours", icon: Clock },
      { title: "Role Permissions", url: "/role-permissions", icon: Shield },
      { title: "Notifications", url: "/notifications", icon: Bell },
      { title: "Admin Panel", url: "/admin", icon: Shield },
      { title: "Documentation", url: "/documentation", icon: FileText },
      { title: "Settings", url: "/settings", icon: Settings },
    ],
  },
];

/**
 * Herbal clinic package — deliberately small daily navigation.
 * Power lives inside the pages (stock control centre, drill-downs, filters),
 * not in sidebar length. Items reference existing routes; Phase 2/3 swap
 * /inventory → /stock and add /visits and /branches purely via this config.
 */
export const NAV_HERBAL: NavSection[] = [
  {
    label: "Clinic", items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Patients", url: "/patients", icon: Heart },
      { title: "Consultations", url: "/doctor", icon: Stethoscope },
      { title: "Prescriptions", url: "/prescriptions", icon: Pill },
    ],
  },
  {
    label: "Medicines & Sales", items: [
      { title: "Medicines", url: "/medicines", icon: Pill },
      { title: "Quick Sale (POS)", url: "/pos", icon: ShoppingCart },
      { title: "Sales History", url: "/sales-history", icon: History },
      { title: "Customers", url: "/customers", icon: Users },
    ],
  },
  {
    label: "Stock", items: [
      { title: "Stock Control", url: "/stock", icon: Package },
      { title: "Stock Transfers", url: "/transfers", icon: ArrowRightLeft },
      { title: "Expiry Alerts", url: "/expiry-alerts", icon: AlertTriangle },
      { title: "Suppliers", url: "/suppliers", icon: Truck },
      { title: "Purchases", url: "/purchase-orders", icon: ShoppingCart },
    ],
  },
  {
    label: "Business", items: [
      { title: "Payments", url: "/billing", icon: CreditCard },
      { title: "Reports", url: "/reports", icon: BarChart3 },
      { title: "Branches", url: "/branches", icon: Building2 },
      { title: "Staff & Permissions", url: "/staff", icon: UserPlus },
      { title: "Audit Trail", url: "/audit-trail", icon: Shield },
      { title: "Settings", url: "/settings", icon: Settings },
    ],
  },
];

/** Medical Clinic package — outpatient-first menu over shared Brightcare modules. */
export const NAV_CLINIC: NavSection[] = [
  {
    label: "Clinic Care", items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Patients", url: "/patients", icon: Heart },
      { title: "Appointments", url: "/appointments", icon: CalendarCheck },
      { title: "Consultations", url: "/doctor", icon: Stethoscope },
      { title: "Patient History", url: "/patient-history", icon: Archive },
    ],
  },
  {
    label: "Treatment & Pharmacy", items: [
      { title: "Prescriptions", url: "/prescriptions", icon: Pill },
      { title: "Medicines", url: "/medicines", icon: Pill },
      { title: "Quick Sale (POS)", url: "/pos", icon: ShoppingCart },
      { title: "Stock Control", url: "/inventory", icon: Package },
      { title: "Suppliers", url: "/suppliers", icon: Truck },
    ],
  },
  {
    label: "Diagnostics & Payments", items: [
      { title: "Laboratory", url: "/laboratory", icon: FlaskConical },
      { title: "Pending Tests", url: "/lab-pending", icon: Clock },
      { title: "Billing", url: "/billing", icon: CreditCard },
      { title: "Sales History", url: "/sales-history", icon: History },
    ],
  },
  {
    label: "Administration", items: [
      { title: "Reports", url: "/reports", icon: BarChart3 },
      { title: "Branches", url: "/branches", icon: Building2 },
      { title: "Staff & Permissions", url: "/staff", icon: UserPlus },
      { title: "Role Permissions", url: "/role-permissions", icon: Shield },
      { title: "Audit Trail", url: "/audit-trail", icon: Shield },
      { title: "Settings", url: "/settings", icon: Settings },
    ],
  },
];

/** Facility modules excluded from the outpatient package. */
export const CLINIC_HIDDEN_PATHS: string[] = [
  "/wait-times", "/patient-queue", "/inpatient", "/bed-allocation", "/bed-occupancy",
  "/nurse-console", "/medication-administration", "/nursing-notes", "/ward-rounds",
  "/handover", "/diet-plans", "/surgery", "/icu", "/discharge", "/discharge-checklist",
  "/operation-theatre", "/blood-bank", "/mortality-review", "/controlled-drugs",
];
