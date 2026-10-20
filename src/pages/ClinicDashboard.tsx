import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useHospital } from "@/contexts/HospitalContext";
import { useFacility } from "@/hooks/useFacility";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useBranch } from "@/contexts/BranchContext";
import {
  CalendarDays, ClipboardPlus, Leaf, Package, Pill,
  Plus, ShoppingCart, Stethoscope, Users,
} from "lucide-react";

interface AppointmentRow {
  id: string;
  appointment_time: string | null;
  status: string | null;
  patients?: { first_name?: string | null; last_name?: string | null; patient_no?: string | null } | null;
}

interface StockAlert {
  id: string;
  name: string;
  stock: number | null;
  reorder_level: number | null;
  unit: string | null;
}

interface ClinicStats {
  patientsToday: number;
  visitsToday: number;
  appointmentsToday: number;
  lowStockCount: number;
  productSalesToday: number;
}

const emptyStats: ClinicStats = { patientsToday: 0, visitsToday: 0, appointmentsToday: 0, lowStockCount: 0, productSalesToday: 0 };

export default function ClinicDashboard() {
  const navigate = useNavigate();
  const { staff } = useAuth();
  const { hospital, hospitalId } = useHospital();
  const { facilityType } = useFacility();
  const { branches, selectedBranchId } = useBranch();
  const isHerbal = facilityType === "herbal";
  const isAdmin = useIsAdmin();
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [lowStock, setLowStock] = useState<StockAlert[]>([]);
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadOverview = async () => {
      if (!hospitalId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const today = new Date().toISOString().slice(0, 10);
      const sessionToken = localStorage.getItem("brightcare_session");
      if (!sessionToken) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.functions.invoke("branch-management", {
        body: { action: "summary", session_token: sessionToken, date: today, branch_id: selectedBranchId || undefined },
      });
      if (!active) return;
      if (error || data?.error) throw new Error(data?.error || error?.message || "Unable to load clinic overview.");
      setAppointments((data?.appointments || []) as AppointmentRow[]);
      setLowStock((data?.low_stock || []) as StockAlert[]);
      setStats({
        patientsToday: data?.patients_today || 0,
        visitsToday: data?.visits_today || 0,
        appointmentsToday: data?.appointments_count || 0,
        lowStockCount: data?.low_stock_count || 0,
        productSalesToday: data?.product_sales_today || 0,
      });
      setLoading(false);
    };

    loadOverview().catch(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [hospitalId, isAdmin, selectedBranchId]);

  const activeBranchName = branches.find((branch) => branch.id === selectedBranchId)?.name || "All branches";

  const palette = isHerbal
    ? {
        page: "bg-stone-100",
        hero: "bg-emerald-950",
        accent: "text-emerald-800",
        button: "bg-emerald-800 hover:bg-emerald-900 text-white",
        soft: "bg-emerald-50 border-emerald-100",
        label: "Herbal Clinic",
      }
    : {
        page: "bg-sky-50/70",
        hero: "bg-slate-900",
        accent: "text-sky-800",
        button: "bg-sky-700 hover:bg-sky-800 text-white",
        soft: "bg-sky-50 border-sky-100",
        label: "Medical Clinic",
      };

  const quickActions = [
    { label: "New patient", icon: Plus, route: "/patients" },
    { label: "Start consultation", icon: Stethoscope, route: "/doctor" },
    { label: "Book appointment", icon: CalendarDays, route: "/appointments" },
    { label: "Quick sale", icon: ShoppingCart, route: "/pos" },
    { label: isHerbal ? "Herbal stock" : "Stock control", icon: Package, route: "/inventory" },
  ];

  return (
    <AppLayout title={palette.label}>
      <div className={`min-h-full space-y-5 p-1 ${palette.page}`}>
        <section className={`flex flex-wrap items-end justify-between gap-4 rounded-md px-5 py-5 text-white ${palette.hero}`}>
          <div>
            <p className="text-xs font-semibold uppercase text-white/65">{palette.label} / Daily operations</p>
            <h1 className="mt-1 text-2xl font-semibold">Good {new Date().getHours() < 12 ? "morning" : "afternoon"}, {staff?.first_name || "Team"}</h1>
            <p className="mt-1 text-sm text-white/70">{hospital?.name || "Clinic"} · {activeBranchName} · {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className={palette.button} onClick={() => navigate("/patients")}><ClipboardPlus className="mr-2 h-4 w-4" />New patient</Button>
            <Button variant="outline" className="border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white" onClick={() => navigate("/doctor")}><Stethoscope className="mr-2 h-4 w-4" />Start visit</Button>
          </div>
        </section>

        <section aria-label="Today's overview" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Metric icon={Users} label="New patients" value={loading ? "..." : stats.patientsToday} detail="Registered today" />
          <Metric icon={Stethoscope} label="Visits" value={loading ? "..." : stats.visitsToday} detail="Consultations today" />
          <Metric icon={CalendarDays} label="Appointments" value={loading ? "..." : stats.appointmentsToday} detail="Scheduled today" />
          {isAdmin ? (
            <Metric icon={ShoppingCart} label="Product sales" value={loading ? "..." : `KES ${stats.productSalesToday.toLocaleString()}`} detail="Completed POS sales" />
          ) : (
            <Metric icon={Package} label="Low stock" value={loading ? "..." : stats.lowStockCount} detail="At or below reorder level" />
          )}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
          <Card className="rounded-md border-slate-200 shadow-none">
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div><h2 className="font-semibold">Today’s appointments</h2><p className="text-xs text-muted-foreground">Your next scheduled patients</p></div>
                <Button size="sm" variant="ghost" onClick={() => navigate("/appointments")}>View schedule</Button>
              </div>
              {appointments.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">{loading ? "Loading schedule..." : "No appointments scheduled for today."}</div>
              ) : (
                <div className="divide-y">
                  {appointments.map((appointment) => (
                    <button key={appointment.id} onClick={() => navigate("/appointments")} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/30">
                      <span className={`flex h-9 w-12 shrink-0 items-center justify-center rounded-sm text-xs font-semibold ${palette.soft} ${palette.accent}`}>{appointment.appointment_time?.slice(0, 5) || "—"}</span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{[appointment.patients?.first_name, appointment.patients?.last_name].filter(Boolean).join(" ") || "Patient"}</span><span className="text-xs text-muted-foreground">{appointment.patients?.patient_no || "Patient record"}</span></span>
                      <span className="text-xs capitalize text-muted-foreground">{appointment.status?.replace(/_/g, " ") || "scheduled"}</span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-md border-slate-200 shadow-none">
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div><h2 className="font-semibold">Stock attention</h2><p className="text-xs text-muted-foreground">{isHerbal ? "Herbal medicines and ingredients" : "Medicines and clinic supplies"}</p></div>
                <span className={`rounded-sm px-2 py-1 text-xs font-semibold ${palette.soft} ${palette.accent}`}>{loading ? "..." : stats.lowStockCount} low</span>
              </div>
              {lowStock.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">{loading ? "Checking inventory..." : "No products at or below reorder level."}</div>
              ) : (
                <div className="divide-y">
                  {lowStock.map((item) => (
                    <button key={item.id} onClick={() => navigate("/inventory")} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/30">
                      {isHerbal ? <Leaf className="h-4 w-4 text-emerald-700" /> : <Pill className="h-4 w-4 text-sky-700" />}
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.name}</span>
                      <span className="text-xs text-muted-foreground">{item.stock || 0} {item.unit || "units"}</span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between"><div><h2 className="font-semibold">Clinical workflow</h2><p className="text-xs text-muted-foreground">Patient care and dispensing in the order your team works</p></div></div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            {quickActions.map(({ label, icon: Icon, route }, index) => (
              <button key={route} onClick={() => navigate(route)} className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-3 text-left transition-colors hover:border-slate-400 hover:bg-white/80">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-sm ${palette.soft} ${palette.accent}`}><Icon className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1"><span className="block text-xs text-muted-foreground">0{index + 1}</span><span className="text-sm font-medium">{label}</span></span>
              </button>
            ))}
          </div>
        </section>

        {isAdmin && (
          <section className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
            <div><h2 className="font-semibold">Practice intelligence</h2><p className="text-xs text-muted-foreground">Detailed patient, revenue, and inventory reporting</p></div>
            <Button variant="outline" onClick={() => navigate("/reports")}>Open admin reports</Button>
          </section>
        )}
      </div>
    </AppLayout>
  );
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof Users; label: string; value: string | number; detail: string }) {
  return (
    <Card className="rounded-md border-slate-200 shadow-none">
      <CardContent className="flex items-start gap-3 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-slate-100 text-slate-700"><Icon className="h-4 w-4" /></span>
        <div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 truncate text-xl font-semibold">{value}</p><p className="mt-0.5 text-xs text-muted-foreground">{detail}</p></div>
      </CardContent>
    </Card>
  );
}
