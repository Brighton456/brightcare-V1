import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import bgDashboard from "@/assets/bg-dashboard.jpg";
import { useNavigate } from "react-router-dom";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import {
  ShoppingCart, Package, Users, Truck, FileText, BarChart3,
  Pill, CreditCard, ArrowRightLeft, Clock, DollarSign, Receipt,
  UserPlus, ClipboardList, AlertTriangle, Settings,
  CalendarCheck, ShieldCheck, Star,
  Heart, Stethoscope, FlaskConical, Calendar, Activity,
  Smartphone, Bed, Zap,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useHospital } from "@/contexts/HospitalContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useModuleSettings } from "@/hooks/useModuleSettings";
import { canAccessRoute } from "@/lib/routePermissions";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { MpesaPaymentModal } from "@/components/payments/MpesaPaymentModal";
import { useToast } from "@/hooks/use-toast";

interface ActionTile {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  route?: string;
}

interface WorkflowSection {
  title: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconColor: string;
  actions: ActionTile[];
}

interface DashStats {
  todayRevenue: number;
  patientsToday: number;
  pendingTests: number;
  unpaidBills: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { staff } = useAuth();
  const { trialDaysLeft, hospital, hospitalId, maintenanceWarning, maintenanceDaysLeft, isMaintenanceLocked, licensePackage, refreshHospital } = useHospital();
  const { permissions } = usePermissions();
  const { isEnabled } = useModuleSettings();
  const displayName = staff?.first_name || "Admin";
  const userRole = staff?.role || "";
  const { toast } = useToast();
  const [showMaintMpesa, setShowMaintMpesa] = useState(false);
  const maintenanceFee = licensePackage?.maintenance_monthly ?? 3000;

  const handleMaintenancePaid = async (receipt: string) => {
    const newDue = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from("hospitals").update({
      maintenance_due_at: newDue,
      maintenance_last_paid_at: new Date().toISOString(),
    } as any).eq("id", hospitalId);
    toast({ title: "✅ Maintenance Paid", description: `Receipt: ${receipt}. Next due in 30 days.` });
    refreshHospital();
  };
  const isAdmin = useIsAdmin();
  const [stats, setStats] = useState<DashStats>({ todayRevenue: 0, patientsToday: 0, pendingTests: 0, unpaidBills: 0 });

  useEffect(() => {
    if (!hospitalId) return;
    const fetchStats = async () => {
      const today = new Date().toISOString().split("T")[0];
      const [billsRes, patientsRes, testsRes, unpaidRes, pharmacyRes] = await Promise.all([
        supabase.from("bills").select("total").eq("hospital_id", hospitalId).eq("status", "paid").gte("paid_at", today),
        supabase.from("patients").select("id", { count: "exact", head: true }).eq("hospital_id", hospitalId).gte("created_at", today),
        supabase.from("lab_tests").select("id", { count: "exact", head: true }).eq("hospital_id", hospitalId).in("status", ["requested", "sample_collected", "in_progress"]),
        supabase.from("bills").select("total").eq("hospital_id", hospitalId).eq("status", "pending"),
        supabase.from("pharmacy_sales").select("total").eq("hospital_id", hospitalId).eq("status", "completed").gte("created_at", today),
      ]);
      const billRevenue = (billsRes.data || []).reduce((s: number, b: any) => s + (b.total || 0), 0);
      const pharmacyRevenue = (pharmacyRes.data || []).reduce((s: number, b: any) => s + (b.total || 0), 0);
      const unpaidTotal = (unpaidRes.data || []).reduce((s: number, b: any) => s + (b.total || 0), 0);
      setStats({
        todayRevenue: billRevenue + pharmacyRevenue,
        patientsToday: patientsRes.count || 0,
        pendingTests: testsRes.count || 0,
        unpaidBills: unpaidTotal > 0 ? (unpaidRes.data || []).length : 0,
      });
    };
    fetchStats();
  }, [hospitalId]);

  const sections: WorkflowSection[] = [
    {
      title: "HOSPITAL MANAGEMENT",
      color: "text-blue-700 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/40",
      borderColor: "border-blue-200 dark:border-blue-800",
      iconColor: "text-blue-600 dark:text-blue-400",
      actions: [
        { label: "Patient Registration", icon: UserPlus, route: "/patients", onClick: () => navigate("/patients") },
        { label: "Patient Records", icon: Heart, route: "/patients", onClick: () => navigate("/patients") },
        { label: "Appointments", icon: Calendar, route: "/appointments", onClick: () => navigate("/appointments") },
        { label: "Staff Management", icon: Users, route: "/staff", onClick: () => navigate("/staff") },
        { label: "Patient History", icon: FileText, route: "/patient-history", onClick: () => navigate("/patient-history") },
        { label: "Medical Records", icon: ClipboardList, route: "/medical-records", onClick: () => navigate("/medical-records") },
      ],
    },
    {
      title: "DOCTOR & CONSULTATION",
      color: "text-cyan-700 dark:text-cyan-400",
      bgColor: "bg-cyan-50 dark:bg-cyan-950/40",
      borderColor: "border-cyan-200 dark:border-cyan-800",
      iconColor: "text-cyan-600 dark:text-cyan-400",
      actions: [
        { label: "Doctor Console", icon: Stethoscope, route: "/doctor", onClick: () => navigate("/doctor") },
        { label: "Patient Queue", icon: Clock, route: "/patient-queue", onClick: () => navigate("/patient-queue") },
        { label: "Write Prescription", icon: ClipboardList, route: "/prescriptions", onClick: () => navigate("/prescriptions") },
        { label: "Request Lab Test", icon: FlaskConical, route: "/lab-pending", onClick: () => navigate("/lab-pending") },
        { label: "Clinical Notes", icon: FileText, route: "/clinical-notes", onClick: () => navigate("/clinical-notes") },
        { label: "Treatment Plans", icon: Heart, route: "/treatment-plans", onClick: () => navigate("/treatment-plans") },
        { label: "Follow-up Scheduling", icon: Calendar, route: "/follow-up", onClick: () => navigate("/follow-up") },
        { label: "Drug Interactions", icon: AlertTriangle, route: "/drug-interactions", onClick: () => navigate("/drug-interactions") },
        { label: "Consultation Analytics", icon: BarChart3, route: "/consultation-analytics", onClick: () => navigate("/consultation-analytics") },
      ],
    },
    {
      title: "LABORATORY",
      color: "text-purple-700 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/40",
      borderColor: "border-purple-200 dark:border-purple-800",
      iconColor: "text-purple-600 dark:text-purple-400",
      actions: [
        { label: "Lab Dashboard", icon: FlaskConical, route: "/laboratory", onClick: () => navigate("/laboratory") },
        { label: "Pending Tests", icon: Clock, route: "/lab-pending", onClick: () => navigate("/lab-pending") },
        { label: "Enter Results", icon: Activity, route: "/lab-results", onClick: () => navigate("/lab-results") },
        { label: "Quality Control", icon: ShieldCheck, route: "/lab-quality", onClick: () => navigate("/lab-quality") },
      ],
    },
    {
      title: "BILLING & PAYMENTS",
      color: "text-emerald-700 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
      borderColor: "border-emerald-200 dark:border-emerald-800",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      actions: [
        { label: "Billing Overview", icon: CreditCard, route: "/billing", onClick: () => navigate("/billing") },
        { label: "Create Bill", icon: Receipt, route: "/create-bill", onClick: () => navigate("/create-bill") },
        { label: "Process Payment", icon: DollarSign, route: "/process-payment", onClick: () => navigate("/process-payment") },
        { label: "M-Pesa Payment", icon: Smartphone, route: "/process-payment", onClick: () => navigate("/process-payment") },
        { label: "Insurance Claims", icon: ShieldCheck, route: "/insurance-claims", onClick: () => navigate("/insurance-claims") },
        { label: "Refund Management", icon: ArrowRightLeft, route: "/refunds", onClick: () => navigate("/refunds") },
        { label: "Outstanding Balances", icon: AlertTriangle, route: "/outstanding-balances", onClick: () => navigate("/outstanding-balances") },
        { label: "Billing Analytics", icon: BarChart3, route: "/billing-analytics", onClick: () => navigate("/billing-analytics") },
      ],
    },
    {
      title: "PHARMACY POS",
      color: "text-amber-700 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/40",
      borderColor: "border-amber-200 dark:border-amber-800",
      iconColor: "text-amber-600 dark:text-amber-400",
      actions: [
        { label: "Make a Sale", icon: ShoppingCart, route: "/pos", onClick: () => navigate("/pos") },
        { label: "Sales History", icon: Receipt, route: "/sales-history", onClick: () => navigate("/sales-history") },
        { label: "Medicine List", icon: Pill, route: "/medicines", onClick: () => navigate("/medicines") },
        { label: "Inventory", icon: Package, route: "/inventory", onClick: () => navigate("/inventory") },
        { label: "Purchase Orders", icon: ShoppingCart, route: "/purchase-orders", onClick: () => navigate("/purchase-orders") },
        { label: "Purchase Invoices", icon: FileText, route: "/invoices", onClick: () => navigate("/invoices") },
        { label: "Stock Reconciliation", icon: ClipboardList, route: "/stock-reconciliation", onClick: () => navigate("/stock-reconciliation") },
        { label: "Controlled Drugs", icon: ShieldCheck, route: "/controlled-drugs", onClick: () => navigate("/controlled-drugs") },
        { label: "Expiry Alerts", icon: AlertTriangle, route: "/expiry-alerts", onClick: () => navigate("/expiry-alerts") },
        { label: "Customers", icon: Users, route: "/customers", onClick: () => navigate("/customers") },
        { label: "Suppliers", icon: Truck, route: "/suppliers", onClick: () => navigate("/suppliers") },
      ],
    },
    {
      title: "INPATIENT & WARD",
      color: "text-rose-700 dark:text-rose-400",
      bgColor: "bg-rose-50 dark:bg-rose-950/40",
      borderColor: "border-rose-200 dark:border-rose-800",
      iconColor: "text-rose-600 dark:text-rose-400",
      actions: [
        { label: "Ward Overview", icon: Bed, route: "/inpatient", onClick: () => navigate("/inpatient") },
        { label: "Bed Allocation", icon: Bed, route: "/bed-allocation", onClick: () => navigate("/bed-allocation") },
        { label: "Nurse Console", icon: Heart, route: "/nurse-console", onClick: () => navigate("/nurse-console") },
        { label: "Vitals Recording", icon: Activity, route: "/vitals", onClick: () => navigate("/vitals") },
        { label: "Nursing Notes", icon: FileText, route: "/nursing-notes", onClick: () => navigate("/nursing-notes") },
        { label: "Ward Rounds", icon: ClipboardList, route: "/ward-rounds", onClick: () => navigate("/ward-rounds") },
        { label: "Diet Plans", icon: Star, route: "/diet-plans", onClick: () => navigate("/diet-plans") },
        { label: "Surgery Scheduling", icon: Calendar, route: "/surgery", onClick: () => navigate("/surgery") },
        { label: "ICU Monitoring", icon: Activity, route: "/icu", onClick: () => navigate("/icu") },
        { label: "Discharge Workflow", icon: ArrowRightLeft, route: "/discharge", onClick: () => navigate("/discharge") },
      ],
    },
    {
      title: "DEPARTMENTS",
      color: "text-indigo-700 dark:text-indigo-400",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/40",
      borderColor: "border-indigo-200 dark:border-indigo-800",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      actions: [
        { label: "Emergency", icon: Heart, route: "/emergency", onClick: () => navigate("/emergency") },
        { label: "OPD", icon: Users, route: "/opd", onClick: () => navigate("/opd") },
        { label: "Radiology", icon: Activity, route: "/radiology", onClick: () => navigate("/radiology") },
        { label: "Blood Bank", icon: Heart, route: "/blood-bank", onClick: () => navigate("/blood-bank") },
        { label: "Operation Theatre", icon: Star, route: "/operation-theatre", onClick: () => navigate("/operation-theatre") },
        { label: "Nutrition", icon: Star, route: "/nutrition", onClick: () => navigate("/nutrition") },
        { label: "Physiotherapy", icon: Activity, route: "/physiotherapy", onClick: () => navigate("/physiotherapy") },
        { label: "Telemedicine", icon: Smartphone, route: "/telemedicine", onClick: () => navigate("/telemedicine") },
        { label: "Quality Assurance", icon: ShieldCheck, route: "/quality-assurance", onClick: () => navigate("/quality-assurance") },
      ],
    },
    {
      title: "ADMINISTRATION",
      color: "text-slate-700 dark:text-slate-400",
      bgColor: "bg-slate-50 dark:bg-slate-950/40",
      borderColor: "border-slate-200 dark:border-slate-800",
      iconColor: "text-slate-600 dark:text-slate-400",
      actions: [
        { label: "HR & Payroll", icon: DollarSign, route: "/hr-payroll", onClick: () => navigate("/hr-payroll") },
        { label: "Attendance", icon: Clock, route: "/attendance", onClick: () => navigate("/attendance") },
        { label: "Performance Reviews", icon: Star, route: "/performance", onClick: () => navigate("/performance") },
        { label: "Asset Management", icon: Package, route: "/assets", onClick: () => navigate("/assets") },
        { label: "Compliance", icon: ShieldCheck, route: "/compliance", onClick: () => navigate("/compliance") },
        { label: "Incident Reporting", icon: AlertTriangle, route: "/incidents", onClick: () => navigate("/incidents") },
        { label: "Reports", icon: BarChart3, route: "/reports", onClick: () => navigate("/reports") },
        { label: "End of Day", icon: CalendarCheck, route: "/end-of-day", onClick: () => navigate("/end-of-day") },
        { label: "Admin Panel", icon: ShieldCheck, route: "/admin", onClick: () => navigate("/admin") },
        { label: "Documentation", icon: FileText, route: "/documentation", onClick: () => navigate("/documentation") },
        { label: "Settings", icon: Settings, route: "/settings", onClick: () => navigate("/settings") },
      ],
    },
  ];

  return (
    <AppLayout title="Home">
      <div className="space-y-1">
        {/* Maintenance Lock Overlay */}
        {isMaintenanceLocked && (
          <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center">
            <div className="max-w-md text-center space-y-4 p-8">
              <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <Lock className="h-10 w-10 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold">Dashboard Temporarily Locked</h2>
              <p className="text-muted-foreground">
                Your monthly maintenance fee is overdue. Please make a payment to restore access to all features.
              </p>
              <Button size="lg" onClick={() => navigate("/upgrade")} className="gap-2">
                <CreditCard className="h-4 w-4" /> Pay Maintenance Fee
              </Button>
            </div>
          </div>
        )}

        {/* Maintenance Warning Banner */}
        {maintenanceWarning && !isMaintenanceLocked && maintenanceDaysLeft !== null && (
          <div className="flex items-center justify-between px-4 py-3 rounded-xl border-2 mb-3 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full flex items-center justify-center font-extrabold text-lg bg-amber-200 dark:bg-amber-900">
                {maintenanceDaysLeft}
              </div>
              <div>
                <p className="font-bold text-sm">
                  Monthly maintenance due in {maintenanceDaysLeft} day{maintenanceDaysLeft !== 1 ? "s" : ""}
                </p>
                <p className="text-xs opacity-80">Pay your KES {maintenanceFee.toLocaleString()} maintenance fee to avoid dashboard lock</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowMaintMpesa(true)} className="gap-1.5 shrink-0 border-amber-400">
              <CreditCard className="h-3.5 w-3.5" /> Pay Now
            </Button>
          </div>
        )}

        <MpesaPaymentModal
          open={showMaintMpesa}
          onClose={() => setShowMaintMpesa(false)}
          amount={maintenanceFee}
          reference={`MAINT-${hospitalId?.slice(0, 8)}-${Date.now()}`}
          onSuccess={handleMaintenancePaid}
        />

        {/* Trial Banner */}
        {trialDaysLeft !== null && (
          <div className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 mb-3 ${
            trialDaysLeft <= 3 
              ? "bg-destructive/10 border-destructive/30 text-destructive" 
              : trialDaysLeft <= 7 
                ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300"
                : "bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center font-extrabold text-lg ${
                trialDaysLeft <= 3 ? "bg-destructive/20" : trialDaysLeft <= 7 ? "bg-amber-200 dark:bg-amber-900" : "bg-blue-200 dark:bg-blue-900"
              }`}>
                {trialDaysLeft}
              </div>
              <div>
                <p className="font-bold text-sm">
                  {trialDaysLeft === 0 
                    ? "Your free trial expires today!" 
                    : `${trialDaysLeft} day${trialDaysLeft > 1 ? "s" : ""} left in your free trial`}
                </p>
                <p className="text-xs opacity-80">Activate a license key or upgrade to keep all features</p>
              </div>
            </div>
            <Button size="sm" onClick={() => navigate("/upgrade")} className="gap-1.5 shrink-0">
              <Zap className="h-3.5 w-3.5" /> Upgrade Now
            </Button>
          </div>
        )}

        {/* Announcements Banner */}
        <AnnouncementBanner />

        {/* Welcome bar with hospital background */}
        <div className="relative rounded-2xl overflow-hidden mb-4">
          <img src={bgDashboard} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-primary/40" />
          <div className="relative z-10 flex items-center justify-between px-6 py-5">
            <div>
              <h2 className="text-lg font-bold text-white">Welcome back, {displayName}</h2>
              <p className="text-sm text-slate-300">
                {hospital?.name && <span className="font-medium text-white">{hospital.name} — </span>}
                {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigate("/patients")} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/20 backdrop-blur-sm text-white text-sm font-bold hover:bg-white/30 transition-all border border-white/10">
                <UserPlus className="h-4 w-4" /> Register Patient
              </button>
              <button onClick={() => navigate("/pos")} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:brightness-110 transition-all shadow-md">
                <ShoppingCart className="h-5 w-5" /> Open POS
              </button>
            </div>
          </div>
        </div>

        {/* Workflow sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sections.map((section) => {
            const visibleActions = section.actions.filter(a => !a.route || isEnabled(a.route));
            if (visibleActions.length === 0) return null;
            return (
            <div key={section.title} className={`rounded-xl border-2 ${section.borderColor} ${section.bgColor} overflow-hidden`}>
              <div className={`px-4 py-2.5 border-b ${section.borderColor}`}>
                <h3 className={`text-xs font-extrabold tracking-widest ${section.color}`}>{section.title}</h3>
              </div>
              <div className="p-2.5 grid grid-cols-2 gap-1.5">
                {visibleActions.map((action) => {
                  const locked = action.route ? !canAccessRoute(action.route, userRole, permissions) : false;
                  return (
                    <button
                      key={action.label}
                      onClick={locked ? undefined : action.onClick}
                      className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-transparent transition-all text-left ${
                        locked
                          ? "bg-muted/40 opacity-50 grayscale cursor-not-allowed"
                          : "bg-card/80 hover:bg-card hover:border-border hover:shadow-sm"
                      }`}
                    >
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${section.bgColor} ${!locked ? "group-hover:scale-105" : ""} transition-transform`}>
                        {locked ? <Lock className="h-4 w-4 text-muted-foreground" /> : <action.icon className={`h-4 w-4 ${section.iconColor}`} />}
                      </div>
                      <span className={`text-xs font-semibold leading-tight ${locked ? "text-muted-foreground" : "text-foreground"}`}>
                        {action.label} {locked && <span className="text-[10px]">🔒</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            );
          })}
        </div>

        {/* Quick status bar */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Today's Revenue", value: isAdmin ? `KES ${stats.todayRevenue.toLocaleString()}` : "••••••", icon: DollarSign, bg: "bg-emerald-50 dark:bg-emerald-950/40", fg: "text-emerald-600 dark:text-emerald-400", hidden: !isAdmin },
            { label: "Patients Today", value: String(stats.patientsToday), icon: Heart, bg: "bg-blue-50 dark:bg-blue-950/40", fg: "text-blue-600 dark:text-blue-400", hidden: false },
            { label: "Pending Tests", value: String(stats.pendingTests), icon: FlaskConical, bg: "bg-purple-50 dark:bg-purple-950/40", fg: "text-purple-600 dark:text-purple-400", hidden: false },
            { label: "Unpaid Bills", value: isAdmin ? String(stats.unpaidBills) : "••", icon: AlertTriangle, bg: "bg-amber-50 dark:bg-amber-950/40", fg: "text-amber-600 dark:text-amber-400", hidden: !isAdmin },
          ].filter(s => !s.hidden).map((stat) => (
            <div key={stat.label} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${stat.bg}`}>
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.fg}`} />
              </div>
              <div>
                <p className="text-lg font-bold leading-tight">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
