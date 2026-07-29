import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useAuth } from "@/contexts/AuthContext";

export interface Hospital {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  license_status: string;
  license_package_id: string | null;
  license_expires_at: string | null;
  trial_ends_at: string | null;
  settings: Record<string, any>;
  license_payment_mode: string;
  maintenance_due_at: string | null;
  maintenance_last_paid_at: string | null;
  maintenance_warning_days: number;
  tax_rate: number;
  currency: string;
  invoice_prefix: string;
  receipt_prefix: string;
  default_consultation_fee: number;
  default_followup_fee: number;
  default_emergency_fee: number;
  grace_period_days: number;
}

export interface LicensePackage {
  id: string;
  name: string;
  display_name: string;
  allowed_modules: string[];
  max_staff: number;
  max_patients: number | null;
  maintenance_monthly: number | null;
}

interface HospitalContextType {
  hospital: Hospital | null;
  licensePackage: LicensePackage | null;
  loading: boolean;
  isModuleAllowed: (moduleKey: string) => boolean;
  isLicenseActive: () => boolean;
  refreshHospital: () => Promise<void>;
  trialDaysLeft: number | null;
  hospitalId: string | null;
  /** Maintenance payment status */
  maintenanceDue: boolean;
  maintenanceDaysLeft: number | null;
  maintenanceWarning: boolean;
  /** True if dashboard should be locked due to unpaid maintenance */
  isMaintenanceLocked: boolean;
  /** Grace period info */
  isInGracePeriod: boolean;
  graceDaysLeft: number | null;
  /** The reason for expiry */
  expiryReason: "trial_expired" | "license_expired" | "maintenance_overdue" | null;
}

const HospitalContext = createContext<HospitalContextType | null>(null);

export function HospitalProvider({ children }: { children: ReactNode }) {
  const { staff } = useAuth();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [licensePackage, setLicensePackage] = useState<LicensePackage | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHospital = async () => {
    if (!staff?.hospital_id) {
      setHospital(null);
      setLicensePackage(null);
      setLoading(false);
      return;
    }

    try {
      const { data: hosp } = await supabase
        .from("hospitals")
        .select("*")
        .eq("id", staff.hospital_id)
        .single();

      if (hosp) {
        setHospital(hosp as any);

        if (hosp.license_package_id) {
          const { data: pkg } = await supabase
            .from("license_packages")
            .select("*")
            .eq("id", hosp.license_package_id)
            .single();
          setLicensePackage(pkg as any);
        }
      }
    } catch (err) {
      console.error("Failed to fetch hospital:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospital();
  }, [staff?.hospital_id]);

  const isModuleAllowed = (_moduleKey: string): boolean => {
    return true;
  };

  // Compute expiry date based on status
  const getExpiryDate = (): Date | null => {
    if (!hospital) return null;
    const status = hospital.license_status;
    if (status === "trial" && hospital.trial_ends_at) {
      return new Date(hospital.trial_ends_at);
    }
    if ((status === "active" || status === "grace" || status === "expired") && hospital.license_expires_at) {
      return new Date(hospital.license_expires_at);
    }
    return null;
  };

  const expiryDate = getExpiryDate();
  const now = new Date();
  const gracePeriodDays = hospital?.grace_period_days ?? 7;

  // Grace period: starts after expiry, lasts grace_period_days
  const graceEndDate = expiryDate ? new Date(expiryDate.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000) : null;
  const isExpired = expiryDate ? now >= expiryDate : false;
  const isInGracePeriod = isExpired && graceEndDate ? now < graceEndDate : false;
  const graceDaysLeft = isInGracePeriod && graceEndDate
    ? Math.max(0, Math.ceil((graceEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : null;
  const isFullyExpired = isExpired && !isInGracePeriod;

  const isLicenseActive = (): boolean => {
    if (staff?.role === "platform_admin") return true;
    if (!hospital) return false;
    const status = hospital.license_status;

    // Enterprise forever / lifetime never expire
    if (hospital.license_payment_mode === "lifetime") return true;

    if (status === "trial") {
      if (!hospital.trial_ends_at) return true;
      // During grace period, still active (with warning)
      return !isFullyExpired;
    }

    if (status === "active" || status === "grace") {
      if (!hospital.license_expires_at) return true;
      return !isFullyExpired;
    }

    if (status === "expired") return false;

    return false;
  };

  // Determine expiry reason
  const expiryReason = (() => {
    if (!hospital) return null;
    if (isLicenseActive() && !isInGracePeriod) return null;
    if (hospital.license_status === "trial") return "trial_expired" as const;
    return "license_expired" as const;
  })();

  const trialDaysLeft = (() => {
    if (!hospital) return null;
    if (hospital.license_status !== "trial") return null;
    const trialEnd = hospital.trial_ends_at ? new Date(hospital.trial_ends_at) : null;
    if (!trialEnd) return null;
    const diff = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  })();

  // Maintenance logic
  const maintenanceDaysLeft = (() => {
    if (!hospital) return null;
    if (hospital.license_status !== "active") return null;
    if (hospital.license_payment_mode === "lifetime") return null;
    if (!hospital.maintenance_due_at) return null;
    const due = new Date(hospital.maintenance_due_at);
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  })();

  const maintenanceWarning = maintenanceDaysLeft !== null && maintenanceDaysLeft <= 7 && maintenanceDaysLeft > 0;
  const maintenanceDue = maintenanceDaysLeft !== null && maintenanceDaysLeft <= 0;
  const isMaintenanceLocked = maintenanceDue && hospital?.license_status === "active";

  const hospitalId = staff?.hospital_id || null;

  return (
    <HospitalContext.Provider value={{
      hospital, licensePackage, loading, isModuleAllowed, isLicenseActive,
      refreshHospital: fetchHospital, trialDaysLeft, hospitalId,
      maintenanceDue: !!maintenanceDue, maintenanceDaysLeft, maintenanceWarning: !!maintenanceWarning,
      isMaintenanceLocked: !!isMaintenanceLocked,
      isInGracePeriod, graceDaysLeft, expiryReason,
    }}>
      {children}
    </HospitalContext.Provider>
  );
}

export function useHospital() {
  const ctx = useContext(HospitalContext);
  if (!ctx) throw new Error("useHospital must be used within HospitalProvider");
  return ctx;
}
