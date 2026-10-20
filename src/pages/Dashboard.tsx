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
import { useFacility } from "@/hooks/useFacility";
import { navToWorkflowSections, attachNavigate } from "@/config/dashboardSections";
import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { MpesaPaymentModal } from "@/components/payments/MpesaPaymentModal";
import { useToast } from "@/hooks/use-toast";
import ClinicDashboard from "@/pages/ClinicDashboard";

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
  const { pkg } = useFacility();
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
    if (!hospitalId || pkg.dashboard !== "hospital") return;
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
  }, [hospitalId, pkg.dashboard]);

  // Build workflow sections from the active facility package's nav.
  // Hospital & clinic: one section per nav group (mirrors today's 8 sections).
  // Herbal: compressed 3-section layout (Clinic, Medicines & Sales, Business).
  const sections = navToWorkflowSections(pkg.nav, pkg.dashboard === "herbal" ? "herbal" : "hospital");
  // Attach navigate closures to every action.
  attachNavigate(sections, navigate);

  if (pkg.dashboard === "clinic" || pkg.dashboard === "herbal") {
    return <ClinicDashboard />;
  }

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
