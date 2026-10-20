import { useCallback, useMemo } from "react";
import { useHospital } from "@/contexts/HospitalContext";
import { useAuth } from "@/contexts/AuthContext";
import { useModuleSettings } from "@/hooks/useModuleSettings";
import {
  ALWAYS_ENABLED_ROUTES,
  getFacilityPackage,
  isModuleInProfile,
  routeToModuleKey,
  type FacilityKey,
  type FacilityPackage,
} from "@/config/facilityPackages";
import type { NavSection } from "@/config/navigation";

interface FacilityState {
  /** The installation's facility type ('hospital' for all legacy tenants) */
  facilityType: FacilityKey;
  /** Resolved package profile (nav, modules, branding, workflow) */
  pkg: FacilityPackage;
  nav: NavSection[];
  tagline: string;
  dashboard: "hospital" | "clinic" | "herbal" | "owner";
  workflow: "full" | "compressed";
  /**
   * Is this module/route enabled for the current facility package?
   * Resolution order: platform admins bypass → always-on routes →
   * module_settings DB row (admin override) → facility package default.
   * Accepts a route path ("/patient-queue") or a module_key ("patient_queue").
   */
  isModuleEnabled: (keyOrPath: string) => boolean;
}

/**
 * Single entry point for package-aware UI. Sidebar, route gating, dashboards
 * and quick actions resolve visibility through this hook so the active
 * facility package always agrees with itself.
 */
export function useFacility(): FacilityState {
  const { hospital } = useHospital();
  const { staff } = useAuth();
  const { modules } = useModuleSettings();

  const rawFacilityType =
    hospital?.facility_type ?? hospital?.settings?.facility_type ?? "hospital";
  const facilityType = (
    typeof rawFacilityType === "string" ? rawFacilityType.trim().toLowerCase() : "hospital"
  ) as FacilityKey;
  const pkg = getFacilityPackage(facilityType);

  const isModuleEnabled = useCallback(
    (keyOrPath: string): boolean => {
      // Platform operators always see everything
      if (staff?.role === "platform_admin" || staff?.role === "super_admin") return true;

      if (keyOrPath.startsWith("/") && ALWAYS_ENABLED_ROUTES.has(keyOrPath)) return true;

      const key = keyOrPath.startsWith("/") ? routeToModuleKey(keyOrPath) : keyOrPath;

      // Explicit DB row (seeded from the profile, possibly toggled by admin) wins
      if (key in modules) return modules[key] === true;

      // No row yet → fall back to the facility package default
      return isModuleInProfile(pkg, key);
    },
    [modules, pkg, staff?.role]
  );

  return useMemo(
    () => ({
      facilityType,
      pkg,
      nav: pkg.nav,
      tagline: pkg.branding.tagline,
      dashboard: pkg.dashboard,
      workflow: pkg.workflow,
      isModuleEnabled,
    }),
    [facilityType, pkg, isModuleEnabled]
  );
}
