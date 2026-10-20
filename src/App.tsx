import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Route, Routes, Navigate, Outlet, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PharmacyProvider } from "@/contexts/PharmacyStore";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { HospitalProvider, useHospital } from "@/contexts/HospitalContext";
import { ConfirmProvider } from "@/hooks/useConfirm";
import { lazy, Suspense, useState } from "react";
import { AppShell } from "@/components/AppLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { usePermissions } from "@/hooks/usePermissions";
import { useFacility } from "@/hooks/useFacility";
import { canAccessRoute } from "@/lib/routePermissions";
import { MpesaPaymentModal } from "@/components/payments/MpesaPaymentModal";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useToast } from "@/hooks/use-toast";
import brightcareLogo from "@/assets/brightcare-logo.png";
const Dashboard = lazy(() => import("./pages/Dashboard"));
const POS = lazy(() => import("./pages/POS"));
const Medicines = lazy(() => import("./pages/Medicines"));
const Inventory = lazy(() => import("./pages/Inventory"));
const StockControl = lazy(() => import("./pages/StockControl"));
const StockTransfers = lazy(() => import("./pages/StockTransfers"));
const Reports = lazy(() => import("./pages/Reports"));
const ClinicReports = lazy(() => import("./pages/ClinicReports"));
const Branches = lazy(() => import("./pages/Branches"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const SalesHistory = lazy(() => import("./pages/SalesHistory"));
const EndOfDay = lazy(() => import("./pages/EndOfDay"));
const Customers = lazy(() => import("./pages/Customers"));
const Suppliers = lazy(() => import("./pages/Suppliers"));
const Patients = lazy(() => import("./pages/Patients"));
const DoctorDashboard = lazy(() => import("./pages/DoctorDashboard"));
const Laboratory = lazy(() => import("./pages/Laboratory"));
const Billing = lazy(() => import("./pages/Billing"));
const Appointments = lazy(() => import("./pages/Appointments"));
const StaffManagement = lazy(() => import("./pages/StaffManagement"));
const InpatientWard = lazy(() => import("./pages/InpatientWard"));
const SystemDocumentation = lazy(() => import("./pages/SystemDocumentation"));
const Login = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));
// Doctor & Consultation
const PatientQueue = lazy(() => import("./pages/PatientQueue"));
const Prescriptions = lazy(() => import("./pages/Prescriptions"));
const ClinicalNotes = lazy(() => import("./pages/ClinicalNotes"));
const TreatmentPlans = lazy(() => import("./pages/TreatmentPlans"));
const FollowUpScheduling = lazy(() => import("./pages/FollowUpScheduling"));
const ConsultationAnalytics = lazy(() => import("./pages/ConsultationAnalytics"));
const DrugInteractions = lazy(() => import("./pages/DrugInteractions"));
const PatientHistory = lazy(() => import("./pages/PatientHistory"));
// Laboratory
const LabPending = lazy(() => import("./pages/LabPending"));
const LabResultsEntry = lazy(() => import("./pages/LabResultsEntry"));
const LabQuality = lazy(() => import("./pages/LabQuality"));
// Billing
const CreateBill = lazy(() => import("./pages/CreateBill"));
const ProcessPayment = lazy(() => import("./pages/ProcessPayment"));
const InsuranceClaims = lazy(() => import("./pages/InsuranceClaims"));
const RefundManagement = lazy(() => import("./pages/RefundManagement"));
const BillingAnalytics = lazy(() => import("./pages/BillingAnalytics"));
const OutstandingBalances = lazy(() => import("./pages/OutstandingBalances"));
const CreditSales = lazy(() => import("./pages/CreditSales"));
// Pharmacy
const PurchaseOrders = lazy(() => import("./pages/PurchaseOrders"));
const Invoices = lazy(() => import("./pages/Invoices"));
const StockReconciliation = lazy(() => import("./pages/StockReconciliation"));
const ControlledDrugs = lazy(() => import("./pages/ControlledDrugs"));
const ExpiryAlerts = lazy(() => import("./pages/ExpiryAlerts"));
// Inpatient
const BedAllocation = lazy(() => import("./pages/BedAllocation"));
const NurseConsole = lazy(() => import("./pages/NurseConsole"));
const VitalsRecording = lazy(() => import("./pages/VitalsRecording"));
const NursingNotes = lazy(() => import("./pages/NursingNotes"));
const WardRounds = lazy(() => import("./pages/WardRounds"));
const DietPlans = lazy(() => import("./pages/DietPlans"));
const SurgeryScheduling = lazy(() => import("./pages/SurgeryScheduling"));
const ICUMonitoring = lazy(() => import("./pages/ICUMonitoring"));
const DischargeWorkflow = lazy(() => import("./pages/DischargeWorkflow"));
// Admin
const HRPayroll = lazy(() => import("./pages/HRPayroll"));
const AttendanceTracking = lazy(() => import("./pages/AttendanceTracking"));
const PerformanceReviews = lazy(() => import("./pages/PerformanceReviews"));
const AssetManagement = lazy(() => import("./pages/AssetManagement"));
const ComplianceTracking = lazy(() => import("./pages/ComplianceTracking"));
const IncidentReporting = lazy(() => import("./pages/IncidentReporting"));
// New Departments
const Radiology = lazy(() => import("./pages/Radiology"));
const BloodBank = lazy(() => import("./pages/BloodBank"));
const OperationTheatre = lazy(() => import("./pages/OperationTheatre"));
const Emergency = lazy(() => import("./pages/Emergency"));
const OutpatientDept = lazy(() => import("./pages/OutpatientDept"));
const NutritionDietetics = lazy(() => import("./pages/NutritionDietetics"));
const Physiotherapy = lazy(() => import("./pages/Physiotherapy"));
const MedicalRecords = lazy(() => import("./pages/MedicalRecords"));
const QualityAssurance = lazy(() => import("./pages/QualityAssurance"));
const TelemedicineHub = lazy(() => import("./pages/TelemedicineHub"));
const FinancialReconciliation = lazy(() => import("./pages/FinancialReconciliation"));
const StaffCheckin = lazy(() => import("./pages/StaffCheckin"));
const RolePermissions = lazy(() => import("./pages/RolePermissions"));
const BusinessHours = lazy(() => import("./pages/BusinessHours"));
const NotificationsCenter = lazy(() => import("./pages/NotificationsCenter"));
// New workflow pages
const StaffWorkload = lazy(() => import("./pages/StaffWorkload"));
const LabConsumables = lazy(() => import("./pages/LabConsumables"));
const ClinicalTools = lazy(() => import("./pages/ClinicalTools"));
const PatientEducation = lazy(() => import("./pages/PatientEducation"));
const ReferralManagement = lazy(() => import("./pages/ReferralManagement"));
const MedicationAdministration = lazy(() => import("./pages/MedicationAdministration"));
const InfectionControl = lazy(() => import("./pages/InfectionControl"));
const MortalityReview = lazy(() => import("./pages/MortalityReview"));
const ConsentManagement = lazy(() => import("./pages/ConsentManagement"));
const WaitTimeMonitor = lazy(() => import("./pages/WaitTimeMonitor"));
const BedOccupancy = lazy(() => import("./pages/BedOccupancy"));
const DischargeChecklist = lazy(() => import("./pages/DischargeChecklist"));
const SupplyChain = lazy(() => import("./pages/SupplyChain"));
const HandoverBoard = lazy(() => import("./pages/HandoverBoard"));
const AuditTrail = lazy(() => import("./pages/AuditTrail"));
const InventoryAnalytics = lazy(() => import("./pages/InventoryAnalytics"));
const StaffDirectory = lazy(() => import("./pages/StaffDirectory"));
const PatientFeedback = lazy(() => import("./pages/PatientFeedback"));
const EmergencyProtocols = lazy(() => import("./pages/EmergencyProtocols"));
const HospitalOnboarding = lazy(() => import("./pages/HospitalOnboarding"));
const SaasAdmin = lazy(() => import("./pages/SaasAdmin"));
const UpgradePage = lazy(() => import("./pages/UpgradePage"));
const PlatformAdmin = lazy(() => import("./pages/PlatformAdmin"));

const LandingPage = lazy(() => import("./pages/LandingPage"));
const PublicDocs = lazy(() => import("./pages/PublicDocs"));
const LabServiceBundles = lazy(() => import("./pages/LabServiceBundles"));
const queryClient = new QueryClient();
const Router = typeof window !== "undefined" && (window as any).electronAPI?.isElectron ? HashRouter : BrowserRouter;

const Loader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <img
        src={brightcareLogo}
        alt="Brightcare"
        className="h-12 w-12 mx-auto animate-pulse rounded-xl object-contain"
      />
      <p className="mt-3 text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { staff, loading } = useAuth();
  if (loading) return <Loader />;
  if (!staff) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function MaintenanceLockScreen({ maintenanceFee, overdueDays, licensePackage, hospitalId, refreshHospital }: {
  maintenanceFee: number; overdueDays: number; licensePackage: any; hospitalId: string | null; refreshHospital: () => Promise<void>;
}) {
  const [showMpesa, setShowMpesa] = useState(false);
  const { toast } = useToast();

  const handlePaymentSuccess = async (receipt: string) => {
    const newDue = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from("hospitals").update({
      maintenance_due_at: newDue,
      maintenance_last_paid_at: new Date().toISOString(),
    } as any).eq("id", hospitalId);
    toast({ title: "✅ Maintenance Paid", description: `Receipt: ${receipt}. Access restored.` });
    refreshHospital();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="w-full max-w-lg">
        <div className="rounded-2xl border border-destructive/30 bg-card shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-5 text-white text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold">Maintenance Payment Overdue</h2>
            <p className="text-sm text-white/80 mt-1">
              Your maintenance fee is {overdueDays} day{overdueDays !== 1 ? "s" : ""} overdue. Pay now to restore access.
            </p>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div className="rounded-xl bg-muted/50 border border-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{licensePackage?.display_name ?? "License"} — Maintenance Fee</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Recurring every 3 days (current cycle)</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">KES {maintenanceFee.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">/cycle</p>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => setShowMpesa(true)}
                className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold hover:brightness-110 transition-all shadow-lg text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                Pay KES {maintenanceFee.toLocaleString()} via M-Pesa
              </button>

              <button
                onClick={() => window.location.href = "/settings"}
                className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl border border-input bg-background text-foreground font-medium hover:bg-accent transition-all text-sm"
              >
                Contact Support
              </button>
            </div>

            <p className="text-xs text-center text-muted-foreground pt-2">
              Need help? Contact <span className="font-medium text-foreground">Brightech Support</span> for assistance.
            </p>
          </div>
        </div>
      </div>
      <MpesaPaymentModal
        open={showMpesa}
        onClose={() => setShowMpesa(false)}
        amount={maintenanceFee}
        reference={`MAINT-${hospitalId?.slice(0, 8)}-${Date.now()}`}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}

function PermissionGate({ children }: { children: React.ReactNode }) {
  const { staff } = useAuth();
  const { permissions, loading } = usePermissions();
  const { isModuleAllowed, isLicenseActive, isInGracePeriod, graceDaysLeft, expiryReason, hospital, licensePackage, isMaintenanceLocked, maintenanceDaysLeft, hospitalId, refreshHospital } = useHospital();
  const { isModuleEnabled } = useFacility();
  const location = useLocation();

  if (loading) return <Loader />;

  const graceWarning = isInGracePeriod && graceDaysLeft !== null;

  // Maintenance lock — show payment screen
  if (isMaintenanceLocked) {
    const maintenanceFee = licensePackage?.maintenance_monthly ?? 3000;
    const overdueDays = maintenanceDaysLeft !== null ? Math.abs(maintenanceDaysLeft) : 0;
    return <MaintenanceLockScreen maintenanceFee={maintenanceFee} overdueDays={overdueDays} licensePackage={licensePackage} hospitalId={hospitalId} refreshHospital={refreshHospital} />;
  }

  // Check license
  if (!isLicenseActive()) {
    const maintenanceFee = licensePackage?.maintenance_monthly ?? 3000;
    const packageName = licensePackage?.display_name ?? hospital?.license_status === "trial" ? "Free Trial" : "License";
    const isTrial = expiryReason === "trial_expired";

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
        <div className="w-full max-w-lg">
          {/* Main Card */}
          <div className="rounded-2xl border border-destructive/30 bg-card shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-5 text-white text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h2 className="text-xl font-bold">
                {isTrial ? "Free Trial Expired" : "License Expired"}
              </h2>
              <p className="text-sm text-white/80 mt-1">
                {isTrial
                  ? "Your 14-day free trial has ended. Activate a license to continue."
                  : `Your ${packageName} license has expired. Renew to restore access.`
                }
              </p>
            </div>

            {/* Grace Period Exhausted Notice */}
            <div className="px-6 py-3 bg-amber-500/10 border-b border-amber-500/20">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <span className="text-sm font-medium">
                  Grace period has been exhausted. All features are now locked.
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Maintenance fee info */}
              {!isTrial && licensePackage && (
                <div className="rounded-xl bg-muted/50 border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{licensePackage.display_name} — Monthly Maintenance</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Pay to restore all features instantly</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">
                        KES {maintenanceFee.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">/month</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2.5">
                <a
                  href="/upgrade"
                  className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold hover:brightness-110 transition-all shadow-lg text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                  {isTrial ? "Choose a Plan & Pay via BrightPay" : "Upgrade / Renew via BrightPay"}
                </a>

                <button
                  onClick={() => window.location.href = "/settings"}
                  className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl border border-input bg-background text-foreground font-medium hover:bg-accent transition-all text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Enter License Key
                </button>
              </div>

              {/* Contact */}
              <p className="text-xs text-center text-muted-foreground pt-2">
                Need help? Contact <span className="font-medium text-foreground">Brightech Support</span> for license assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check module access by license tier
  const pathKey = location.pathname.replace(/^\//, "") || "dashboard";
  if (!isModuleAllowed(pathKey)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/10 text-purple-600 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Module Not Available</h2>
        <p className="text-muted-foreground max-w-md">
          This module is not included in your current package. Upgrade your plan to access this feature.
        </p>
      </div>
    );
  }

  // Facility package gate — blocks deep-links into modules that are not part
  // of this installation's facility type (hospital / clinic / herbal).
  if (!isModuleEnabled(location.pathname)) {
    return <FacilityModuleScreen pathname={location.pathname} />;
  }

  const role = staff?.role ?? "";
  const hasAccess = canAccessRoute(location.pathname, role, permissions);

  if (!hasAccess) {
    // Show the page content but greyed out with a lock overlay
    return (
      <div className="relative">
        <div className="pointer-events-none select-none opacity-30 grayscale blur-[1px]">{children}</div>
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card/95 p-8 shadow-2xl max-w-sm text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7 text-muted-foreground"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-foreground">🔒 Read-Only Access</h3>
            <p className="text-sm text-muted-foreground">
              Your role <span className="font-semibold text-foreground">{role.replace(/_/g, " ")}</span> can view this
              page but cannot make changes.
            </p>
            <p className="text-xs text-muted-foreground/70">Contact your administrator to request full access.</p>
            <button
              onClick={() => window.history.back()}
              className="mt-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition-all shadow-md"
            >
              ← Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function PackageAwareReports() {
  const { facilityType } = useFacility();
  return facilityType === "clinic" || facilityType === "herbal" ? <ClinicReports /> : <Reports />;
}

/** Shown when a route belongs to a module outside the active facility package. */
function FacilityModuleScreen({ pathname }: { pathname: string }) {
  const { pkg } = useFacility();
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">Not Part of Your {pkg.label} Setup</h2>
      <p className="text-muted-foreground max-w-md">
        The <span className="font-semibold text-foreground">{pathname}</span> module is not enabled for this facility type.
        Your administrator can enable it under Admin → Modules, or contact Brightcare support to change your facility setup.
      </p>
      <button
        onClick={() => window.history.back()}
        className="mt-5 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition-all shadow-md"
      >
        ← Go Back
      </button>
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

function PG({ children }: { children: React.ReactNode }) {
  return <PermissionGate>{children}</PermissionGate>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/welcome" element={<LandingPage />} />
        <Route path="/docs" element={<PublicDocs />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<HospitalOnboarding />} />
        <Route
          path="/saas-admin"
          element={
            <P>
              <SaasAdmin />
            </P>
          }
        />
        <Route
          path="/platform-admin"
          element={
            <P>
              <PlatformAdmin />
            </P>
          }
        />
        <Route
          path="/pos"
          element={
            <P>
              <PG>
                <POS />
              </PG>
            </P>
          }
        />
        <Route
          element={
            <P>
              <AppShell />
            </P>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/" element={<Navigate to="/welcome" replace />} />
          {/* Hospital */}
          <Route
            path="/patients"
            element={
              <PG>
                <Patients />
              </PG>
            }
          />
          <Route
            path="/appointments"
            element={
              <PG>
                <Appointments />
              </PG>
            }
          />
          <Route
            path="/patient-history"
            element={
              <PG>
                <PatientHistory />
              </PG>
            }
          />
          <Route
            path="/medical-records"
            element={
              <PG>
                <MedicalRecords />
              </PG>
            }
          />
          {/* Doctor */}
          <Route
            path="/doctor"
            element={
              <PG>
                <DoctorDashboard />
              </PG>
            }
          />
          <Route
            path="/patient-queue"
            element={
              <PG>
                <PatientQueue />
              </PG>
            }
          />
          <Route
            path="/prescriptions"
            element={
              <PG>
                <Prescriptions />
              </PG>
            }
          />
          <Route
            path="/clinical-notes"
            element={
              <PG>
                <ClinicalNotes />
              </PG>
            }
          />
          <Route
            path="/treatment-plans"
            element={
              <PG>
                <TreatmentPlans />
              </PG>
            }
          />
          <Route
            path="/follow-up"
            element={
              <PG>
                <FollowUpScheduling />
              </PG>
            }
          />
          <Route
            path="/consultation-analytics"
            element={
              <PG>
                <ConsultationAnalytics />
              </PG>
            }
          />
          <Route
            path="/drug-interactions"
            element={
              <PG>
                <DrugInteractions />
              </PG>
            }
          />
          {/* Laboratory */}
          <Route
            path="/laboratory"
            element={
              <PG>
                <Laboratory />
              </PG>
            }
          />
          <Route
            path="/lab-pending"
            element={
              <PG>
                <LabPending />
              </PG>
            }
          />
          <Route
            path="/lab-results"
            element={
              <PG>
                <LabResultsEntry />
              </PG>
            }
          />
          <Route
            path="/lab-quality"
            element={
              <PG>
                <LabQuality />
              </PG>
            }
          />
          {/* Billing */}
          <Route
            path="/billing"
            element={
              <PG>
                <Billing />
              </PG>
            }
          />
          <Route
            path="/create-bill"
            element={
              <PG>
                <CreateBill />
              </PG>
            }
          />
          <Route
            path="/process-payment"
            element={
              <PG>
                <ProcessPayment />
              </PG>
            }
          />
          <Route
            path="/insurance-claims"
            element={
              <PG>
                <InsuranceClaims />
              </PG>
            }
          />
          <Route
            path="/refunds"
            element={
              <PG>
                <RefundManagement />
              </PG>
            }
          />
          <Route
            path="/credit-sales"
            element={
              <PG>
                <CreditSales />
              </PG>
            }
          />
          <Route
            path="/billing-analytics"
            element={
              <PG>
                <BillingAnalytics />
              </PG>
            }
          />
          <Route
            path="/outstanding-balances"
            element={
              <PG>
                <OutstandingBalances />
              </PG>
            }
          />
          {/* Pharmacy */}
          <Route
            path="/medicines"
            element={
              <PG>
                <Medicines />
              </PG>
            }
          />
          <Route
            path="/inventory"
            element={
              <PG>
                <Inventory />
              </PG>
            }
          />
          <Route
            path="/stock"
            element={
              <PG>
                <StockControl />
              </PG>
            }
          />
          <Route
            path="/transfers"
            element={
              <PG>
                <StockTransfers />
              </PG>
            }
          />
          <Route
            path="/sales-history"
            element={
              <PG>
                <SalesHistory />
              </PG>
            }
          />
          <Route
            path="/customers"
            element={
              <PG>
                <Customers />
              </PG>
            }
          />
          <Route
            path="/suppliers"
            element={
              <PG>
                <Suppliers />
              </PG>
            }
          />
          <Route
            path="/purchase-orders"
            element={
              <PG>
                <PurchaseOrders />
              </PG>
            }
          />
          <Route
            path="/invoices"
            element={
              <PG>
                <Invoices />
              </PG>
            }
          />
          <Route
            path="/stock-reconciliation"
            element={
              <PG>
                <StockReconciliation />
              </PG>
            }
          />
          <Route
            path="/controlled-drugs"
            element={
              <PG>
                <ControlledDrugs />
              </PG>
            }
          />
          <Route
            path="/expiry-alerts"
            element={
              <PG>
                <ExpiryAlerts />
              </PG>
            }
          />
          {/* Inpatient */}
          <Route
            path="/inpatient"
            element={
              <PG>
                <InpatientWard />
              </PG>
            }
          />
          <Route
            path="/bed-allocation"
            element={
              <PG>
                <BedAllocation />
              </PG>
            }
          />
          <Route
            path="/nurse-console"
            element={
              <PG>
                <NurseConsole />
              </PG>
            }
          />
          <Route
            path="/vitals"
            element={
              <PG>
                <VitalsRecording />
              </PG>
            }
          />
          <Route
            path="/nursing-notes"
            element={
              <PG>
                <NursingNotes />
              </PG>
            }
          />
          <Route
            path="/ward-rounds"
            element={
              <PG>
                <WardRounds />
              </PG>
            }
          />
          <Route
            path="/diet-plans"
            element={
              <PG>
                <DietPlans />
              </PG>
            }
          />
          <Route
            path="/surgery"
            element={
              <PG>
                <SurgeryScheduling />
              </PG>
            }
          />
          <Route
            path="/icu"
            element={
              <PG>
                <ICUMonitoring />
              </PG>
            }
          />
          <Route
            path="/discharge"
            element={
              <PG>
                <DischargeWorkflow />
              </PG>
            }
          />
          {/* Departments */}
          <Route
            path="/radiology"
            element={
              <PG>
                <Radiology />
              </PG>
            }
          />
          <Route
            path="/blood-bank"
            element={
              <PG>
                <BloodBank />
              </PG>
            }
          />
          <Route
            path="/operation-theatre"
            element={
              <PG>
                <OperationTheatre />
              </PG>
            }
          />
          <Route
            path="/emergency"
            element={
              <PG>
                <Emergency />
              </PG>
            }
          />
          <Route
            path="/opd"
            element={
              <PG>
                <OutpatientDept />
              </PG>
            }
          />
          <Route
            path="/nutrition"
            element={
              <PG>
                <NutritionDietetics />
              </PG>
            }
          />
          <Route
            path="/physiotherapy"
            element={
              <PG>
                <Physiotherapy />
              </PG>
            }
          />
          <Route
            path="/quality-assurance"
            element={
              <PG>
                <QualityAssurance />
              </PG>
            }
          />
          <Route
            path="/telemedicine"
            element={
              <PG>
                <TelemedicineHub />
              </PG>
            }
          />
          {/* Admin */}
          <Route
            path="/staff"
            element={
              <PG>
                <StaffManagement />
              </PG>
            }
          />
          <Route
            path="/hr-payroll"
            element={
              <PG>
                <HRPayroll />
              </PG>
            }
          />
          <Route
            path="/attendance"
            element={
              <PG>
                <AttendanceTracking />
              </PG>
            }
          />
          <Route
            path="/performance"
            element={
              <PG>
                <PerformanceReviews />
              </PG>
            }
          />
          <Route
            path="/assets"
            element={
              <PG>
                <AssetManagement />
              </PG>
            }
          />
          <Route
            path="/compliance"
            element={
              <PG>
                <ComplianceTracking />
              </PG>
            }
          />
          <Route
            path="/incidents"
            element={
              <PG>
                <IncidentReporting />
              </PG>
            }
          />
          <Route
            path="/reports"
            element={
              <PG>
                <PackageAwareReports />
              </PG>
            }
          />
          <Route
            path="/branches"
            element={
              <PG>
                <Branches />
              </PG>
            }
          />
          <Route
            path="/end-of-day"
            element={
              <PG>
                <EndOfDay />
              </PG>
            }
          />
          <Route
            path="/admin"
            element={
              <PG>
                <AdminPanel />
              </PG>
            }
          />
          <Route
            path="/settings"
            element={
              <PG>
                <SettingsPage />
              </PG>
            }
          />
          <Route path="/documentation" element={<SystemDocumentation />} />
          <Route
            path="/financial-reconciliation"
            element={
              <PG>
                <FinancialReconciliation />
              </PG>
            }
          />
          <Route
            path="/staff-checkin"
            element={
              <PG>
                <StaffCheckin />
              </PG>
            }
          />
          <Route
            path="/role-permissions"
            element={
              <PG>
                <RolePermissions />
              </PG>
            }
          />
          <Route
            path="/business-hours"
            element={
              <PG>
                <BusinessHours />
              </PG>
            }
          />
          <Route path="/notifications" element={<NotificationsCenter />} />
          {/* New workflow pages */}
          <Route
            path="/staff-workload"
            element={
              <PG>
                <StaffWorkload />
              </PG>
            }
          />
          <Route
            path="/lab-consumables"
            element={
              <PG>
                <LabConsumables />
              </PG>
            }
          />
          <Route
            path="/lab-service-bundles"
            element={
              <PG>
                <LabServiceBundles />
              </PG>
            }
          />
          <Route
            path="/clinical-tools"
            element={
              <PG>
                <ClinicalTools />
              </PG>
            }
          />
          <Route
            path="/patient-education"
            element={
              <PG>
                <PatientEducation />
              </PG>
            }
          />
          <Route
            path="/referrals"
            element={
              <PG>
                <ReferralManagement />
              </PG>
            }
          />
          <Route
            path="/medication-administration"
            element={
              <PG>
                <MedicationAdministration />
              </PG>
            }
          />
          <Route
            path="/infection-control"
            element={
              <PG>
                <InfectionControl />
              </PG>
            }
          />
          <Route
            path="/mortality-review"
            element={
              <PG>
                <MortalityReview />
              </PG>
            }
          />
          <Route
            path="/consent-management"
            element={
              <PG>
                <ConsentManagement />
              </PG>
            }
          />
          <Route
            path="/wait-times"
            element={
              <PG>
                <WaitTimeMonitor />
              </PG>
            }
          />
          <Route
            path="/bed-occupancy"
            element={
              <PG>
                <BedOccupancy />
              </PG>
            }
          />
          <Route
            path="/discharge-checklist"
            element={
              <PG>
                <DischargeChecklist />
              </PG>
            }
          />
          <Route
            path="/supply-chain"
            element={
              <PG>
                <SupplyChain />
              </PG>
            }
          />
          <Route
            path="/handover"
            element={
              <PG>
                <HandoverBoard />
              </PG>
            }
          />
          <Route
            path="/audit-trail"
            element={
              <PG>
                <AuditTrail />
              </PG>
            }
          />
          <Route
            path="/inventory-analytics"
            element={
              <PG>
                <InventoryAnalytics />
              </PG>
            }
          />
          <Route
            path="/staff-directory"
            element={
              <PG>
                <StaffDirectory />
              </PG>
            }
          />
          <Route
            path="/patient-feedback"
            element={
              <PG>
                <PatientFeedback />
              </PG>
            }
          />
          <Route
            path="/emergency-protocols"
            element={
              <PG>
                <EmergencyProtocols />
              </PG>
            }
          />
          <Route path="/upgrade" element={<UpgradePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Routes>
    </Suspense>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <HospitalProvider>
            <PharmacyProvider>
              <ConfirmProvider>
                <Toaster />
                <Sonner />
                <Router>
                  <AppRoutes />
                </Router>
              </ConfirmProvider>
            </PharmacyProvider>
          </HospitalProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
