import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useHospital } from "@/contexts/HospitalContext";
import { useFacility } from "@/hooks/useFacility";
import { useBranch } from "@/contexts/BranchContext";
import { exportToCSV } from "@/utils/exportUtils";
import { Activity, Download, Leaf, Package, RotateCw, ShieldAlert, Users } from "lucide-react";

interface RevenuePoint {
  month: string;
  consultation: number;
  products: number;
}

const today = new Date().toISOString().slice(0, 10);
const defaultFrom = new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1).toISOString().slice(0, 10);

export default function ClinicReports() {
  const { staff } = useAuth();
  const { hospitalId } = useHospital();
  const { facilityType } = useFacility();
  const { branches, selectedBranchId } = useBranch();
  const isAdmin = ["admin", "hospital_admin", "platform_admin", "super_admin"].includes(staff?.role || "");
  const isHerbal = facilityType === "herbal";
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(today);
  const [topProducts, setTopProducts] = useState<{ name: string; quantity: number }[]>([]);
  const [visitFrequency, setVisitFrequency] = useState({ uniquePatients: 0, returningPatients: 0, frequentPatients: 0 });
  const [revenue, setRevenue] = useState<RevenuePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const loadReports = async () => {
      if (!hospitalId || !isAdmin) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      const sessionToken = localStorage.getItem("brightcare_session");
      if (!sessionToken) {
        setError("Your session has expired. Sign in again to view clinic reports.");
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.functions.invoke("branch-management", {
        body: { action: "reports", session_token: sessionToken, date_from: dateFrom, date_to: dateTo, branch_id: selectedBranchId || undefined },
      });
      if (!active) return;
      if (error || data?.error) throw new Error(data?.error || error?.message || "Clinic reports could not be loaded.");

      setTopProducts(data?.top_products || []);
      setVisitFrequency({
        uniquePatients: data?.unique_patients || 0,
        returningPatients: data?.returning_patients || 0,
        frequentPatients: data?.frequent_patients || 0,
      });
      setRevenue((data?.revenue || []) as RevenuePoint[]);
      setLoading(false);
    };

    loadReports().catch((loadError) => {
      if (!active) return;
      setError(loadError instanceof Error ? loadError.message : "Clinic reports could not be loaded.");
      setLoading(false);
    });

    return () => { active = false; };
  }, [hospitalId, isAdmin, dateFrom, dateTo, selectedBranchId]);

  const consultationRevenue = revenue.reduce((sum, month) => sum + month.consultation, 0);
  const productRevenue = revenue.reduce((sum, month) => sum + month.products, 0);

  if (!isAdmin) {
    return (
      <AppLayout title="Practice Reports">
        <div role="alert" className="flex min-h-[50vh] flex-col items-center justify-center gap-2 p-8 text-center">
          <ShieldAlert className="h-8 w-8 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Administrator access required</h1>
          <p className="max-w-md text-sm text-muted-foreground">Detailed patient, financial, and inventory reports are restricted to clinic administrators.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={isHerbal ? "Herbal Practice Reports" : "Clinic Reports"}>
      <div className={`space-y-5 ${isHerbal ? "[--report-accent:rgb(6_95_70)]" : "[--report-accent:rgb(3_105_161)]"}`}>
        <header className={`flex flex-wrap items-end justify-between gap-4 border-b pb-4 ${isHerbal ? "border-emerald-200" : "border-sky-200"}`}>
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--report-accent)]">Administrator / Analytics</p>
            <h1 className="mt-1 text-2xl font-semibold">{isHerbal ? "Herbal Practice Performance" : "Clinic Performance"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{branches.find((branch) => branch.id === selectedBranchId)?.name || "All branches"} · Revenue, prescribed products, and patient visit frequency</p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="grid gap-1 text-xs text-muted-foreground">From<Input aria-label="Report start date" type="date" value={dateFrom} max={dateTo} onChange={(event) => setDateFrom(event.target.value)} /></label>
            <label className="grid gap-1 text-xs text-muted-foreground">To<Input aria-label="Report end date" type="date" value={dateTo} min={dateFrom} max={today} onChange={(event) => setDateTo(event.target.value)} /></label>
            <Button variant="outline" onClick={() => exportToCSV(revenue.map((row) => ({ Month: row.month, "Consultation Revenue": row.consultation, "Product Sales": row.products })), isHerbal ? "herbal-practice-revenue" : "clinic-revenue")} disabled={loading}>
              <Download className="mr-2 h-4 w-4" />Export revenue
            </Button>
          </div>
        </header>

        {error && <div role="alert" className="rounded-sm border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div>}

        <section aria-label="Reporting overview" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={Activity} label="Consultation revenue" value={loading ? "..." : `KES ${consultationRevenue.toLocaleString()}`} detail="Paid consultation bill items" />
          <Metric icon={Package} label="Product sales" value={loading ? "..." : `KES ${productRevenue.toLocaleString()}`} detail="Completed POS receipts" />
          <Metric icon={Users} label="Patients seen" value={loading ? "..." : visitFrequency.uniquePatients} detail="Unique patients in period" />
          <Metric icon={RotateCw} label="Returning patients" value={loading ? "..." : visitFrequency.returningPatients} detail={`${visitFrequency.frequentPatients} seen 4+ times`} />
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <Card className="rounded-md shadow-none">
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b px-4 py-3"><div><h2 className="font-semibold">Most prescribed products</h2><p className="text-xs text-muted-foreground">Ranked by prescribed quantity</p></div><Badge variant="outline">{topProducts.length} products</Badge></div>
              {topProducts.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">{loading ? "Loading prescriptions..." : "No prescription items found."}</p> : (
                <div className="divide-y">{topProducts.map((item, index) => <div key={item.name} className="flex items-center gap-3 px-4 py-3"><span className="flex h-7 w-7 items-center justify-center rounded-sm bg-muted text-xs font-semibold">{index + 1}</span><span className="min-w-0 flex-1 truncate text-sm font-medium">{item.name}</span><span className="text-sm tabular-nums">{item.quantity} prescribed</span></div>)}</div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-md shadow-none">
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b px-4 py-3"><div><h2 className="font-semibold">Monthly revenue</h2><p className="text-xs text-muted-foreground">Consultations compared with product sales</p></div><Badge variant="outline">KES</Badge></div>
              {revenue.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">{loading ? "Loading revenue..." : "No paid revenue in this date range."}</p> : (
                <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground"><th className="px-4 py-2 font-medium">Month</th><th className="px-4 py-2 text-right font-medium">Consultations</th><th className="px-4 py-2 text-right font-medium">Products</th><th className="px-4 py-2 text-right font-medium">Total</th></tr></thead><tbody>{revenue.map((month) => <tr key={month.month} className="border-b last:border-0"><td className="px-4 py-3 font-medium">{new Date(`${month.month}-01T00:00:00`).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</td><td className="px-4 py-3 text-right tabular-nums">{month.consultation.toLocaleString()}</td><td className="px-4 py-3 text-right tabular-nums">{month.products.toLocaleString()}</td><td className="px-4 py-3 text-right font-semibold tabular-nums">{(month.consultation + month.products).toLocaleString()}</td></tr>)}</tbody></table></div>
              )}
            </CardContent>
          </Card>
        </section>

        <p className="text-xs text-muted-foreground">Visit frequency is calculated from consultation records in the selected date range. Product prescription rankings use the shared Brightcare prescription catalog.</p>
      </div>
    </AppLayout>
  );
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof Activity; label: string; value: string | number; detail: string }) {
  return <Card className="rounded-md shadow-none"><CardContent className="flex items-start gap-3 p-4"><span className="flex h-9 w-9 items-center justify-center rounded-sm bg-muted text-[var(--report-accent)]"><Icon className="h-4 w-4" /></span><div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 truncate text-xl font-semibold">{value}</p><p className="mt-0.5 text-xs text-muted-foreground">{detail}</p></div></CardContent></Card>;
}
