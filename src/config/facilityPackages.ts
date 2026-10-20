import { Building2, Stethoscope, Leaf, type LucideIcon } from "lucide-react";
import { NAV_HOSPITAL, NAV_CLINIC, NAV_HERBAL, type NavSection } from "./navigation";

/**
 * Brightcare facility packages — the single source of truth for which
 * modules, navigation, dashboard and workflow each facility type gets.
 *
 * A "facility package" answers: what does this installation *look like*?
 * It is configuration, not code: onboarding seeds `module_settings` from
 * this profile, and the sidebar/dashboard render `nav` for the active
 * profile. License tiers (Trial/Basic/...) remain a separate, orthogonal
 * concept — they gate entitlements, facility packages gate workflows.
 *
 * Naming: DB column is `hospitals.facility_type`; UI says "Facility Type".
 */

export type FacilityKey = "hospital" | "clinic" | "herbal";

/** Routes always reachable regardless of package (never lock a user out). */
export const ALWAYS_ENABLED_ROUTES = new Set([
  "/", "/login", "/dashboard", "/notifications", "/documentation", "/upgrade", "/admin", "/settings",
]);

/**
 * Module keys the Herbal Clinic package turns off.
 * Everything not listed here stays *available* (power is preserved) — it is
 * simply not shown in the herbal sidebar. Only genuinely hospital-specific
 * operations are disabled.
 */
export const HERBAL_EXCLUDED_MODULES = [
  // Hospital patient flow that a small clinic does not run
  "wait_times", "patient_queue",
  // Laboratory
  "laboratory", "lab_pending", "lab_results", "lab_consumables", "lab_quality", "lab_service_bundles",
  // Inpatient / wards / nursing / discharge
  "inpatient", "bed_allocation", "bed_occupancy", "nurse_console", "medication_administration",
  "vitals", "nursing_notes", "ward_rounds", "handover", "diet_plans", "surgery", "icu",
  "discharge", "discharge_checklist",
  // Hospital departments
  "emergency", "emergency_protocols", "opd", "radiology", "blood_bank", "operation_theatre",
  "mortality_review",
];

/** Route path → module_key (same transform useModuleSettings applies). */
export function routeToModuleKey(path: string): string {
  return path.replace(/^\//, "").replace(/-/g, "_");
}

/** Module keys hidden from the Medical Clinic sidebar (inpatient/surgical). */
export const CLINIC_EXCLUDED_MODULES = [
  "inpatient", "bed_allocation", "bed_occupancy", "nurse_console", "medication_administration",
  "nursing_notes", "ward_rounds", "handover", "diet_plans", "surgery", "icu",
  "discharge", "discharge_checklist", "operation_theatre", "blood_bank", "mortality_review",
  "controlled_drugs",
];

/**
 * Which modules a profile enables:
 * - "*"            → everything (hospital: today's behavior, unchanged)
 * - { exclude }    → everything except the listed module_keys
 */
export type ProfileModules = "*" | { exclude: string[] };

export interface FacilityPackage {
  key: FacilityKey;
  /** Card title in onboarding */
  label: string;
  icon: LucideIcon;
  tagline: string;
  description: string;
  /** Bullet highlights shown on the onboarding selection card */
  highlights: string[];
  /** Sidebar header subtitle */
  branding: { tagline: string };
  nav: NavSection[];
  modules: ProfileModules;
  dashboard: "hospital" | "clinic" | "herbal" | "owner";
  workflow: "full" | "compressed";
  /** Departments seeded at provisioning; undefined → full hospital list */
  departments?: { name: string; description: string }[];
}

const HERBAL_DEPARTMENTS = [
  { name: "Herbal Medicine", description: "Herbal consultation and treatment" },
  { name: "Pharmacy & Stock", description: "Medicine dispensing and stock control" },
  { name: "Administration", description: "Clinic administration" },
];

export const FACILITY_PACKAGES: Record<FacilityKey, FacilityPackage> = {
  hospital: {
    key: "hospital",
    label: "Hospital",
    icon: Building2,
    tagline: "Full hospital workflows",
    description: "Full hospital management — registration, queue, triage, consultation, laboratory, pharmacy, wards, admissions, billing and discharge.",
    highlights: ["All departments & clinical workflows", "Inpatient, wards & theatre", "Laboratory & radiology", "Billing, insurance & claims"],
    branding: { tagline: "Hospital Management & POS" },
    nav: NAV_HOSPITAL,
    modules: "*",
    dashboard: "hospital",
    workflow: "full",
  },
  clinic: {
    key: "clinic",
    label: "Medical Clinic",
    icon: Stethoscope,
    tagline: "Outpatient-focused care",
    description: "Outpatient-focused management — appointments, consultation, prescriptions, basic laboratory, pharmacy and billing without inpatient wards.",
    highlights: ["Appointments & consultation", "Pharmacy & POS", "Billing & payments", "No inpatient/ward overhead"],
    branding: { tagline: "Clinic Management & POS" },
    nav: NAV_CLINIC,
    modules: { exclude: CLINIC_EXCLUDED_MODULES },
    dashboard: "clinic",
    workflow: "full",
  },
  herbal: {
    key: "herbal",
    label: "Herbal Clinic",
    icon: Leaf,
    tagline: "Fast, multi-branch herbal care",
    description: "Herbal consultation, patient management, medicine sales, powerful inventory and multi-branch control — built for one or two staff per branch.",
    highlights: ["Compressed visit workflow", "Powerful stock control & transfers", "Quick sale (POS)", "Multi-branch owner visibility"],
    branding: { tagline: "Herbal Clinic Management" },
    nav: NAV_HERBAL,
    modules: { exclude: HERBAL_EXCLUDED_MODULES },
    dashboard: "herbal",
    workflow: "compressed",
    departments: HERBAL_DEPARTMENTS,
  },
};

/** All facility keys in onboarding display order. */
export const FACILITY_ORDER: FacilityKey[] = ["hospital", "clinic", "herbal"];

/** Resolve a facility_type string to a package; unknown/missing → hospital. */
/**
 * Herbal-specific asset context for Phase 3 (wallpaper, splash, onboarding hero).
 * These are referenced by herbal onboarding/dashboard components when the
 * active facility package is "herbal". Hospital and clinic use their own
 * assets (brightcare-logo.png, onboarding-hero.jpg, bg-dashboard.jpg, etc.).
 *
 * When a herbal tenant has no custom assets, these fall back to the hospital
 * defaults — the package system gates visibility, not assets.
 */
export const HERBAL_WALLPAPER_SPLASH_CONTEXT = {
  /** Dashboard background for herbal tenants (falls back to bg-dashboard.jpg) */
  dashboardBg: "herbal" as const,
  /** Splash/hero image shown during herbal onboarding (falls back to onboarding-hero.jpg) */
  onboardingHero: "herbal" as const,
  /** Construction/provisioning screen background */
  constructBg: "herbal" as const,
  /** CSS accent color hint for herbal-themed screens */
  accent: "emerald" as const,
  /** Short label used in herbal splash headers */
  brandLabel: "Herbal Clinic" as const,
};

export function getFacilityPackage(facilityType?: string | null): FacilityPackage {
  const normalized = typeof facilityType === "string" ? facilityType.trim().toLowerCase() : "";
  return FACILITY_PACKAGES[normalized as FacilityKey] ?? FACILITY_PACKAGES.hospital;
}

/** Does this profile enable the given module_key? (route-level always-on
 * checks are handled by useFacility before this is called) */
export function isModuleInProfile(pkg: FacilityPackage, moduleKey: string): boolean {
  if (pkg.modules === "*") return true;
  return !pkg.modules.exclude.includes(moduleKey);
}
