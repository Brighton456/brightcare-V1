import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { DepartmentHeader } from "@/components/DepartmentHeader";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import { Package, TrendingUp, AlertTriangle, DollarSign } from "lucide-react";
import { useHospital } from "@/contexts/HospitalContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function InventoryAnalytics() {
  const { hospitalId } = useHospital();
  const isAdmin = useIsAdmin();
  const [medicines, setMedicines] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("medicines").select("*").eq("hospital_id", hospitalId).eq("is_active", true).then(({ data }) => { if (data) setMedicines(data); });
  }, [hospitalId]);

  const totalValue = medicines.reduce((s, m) => s + (m.cost_price || 0) * (m.stock || 0), 0);
  const retailValue = medicines.reduce((s, m) => s + (m.price || 0) * (m.stock || 0), 0);
  const lowStock = medicines.filter(m => (m.stock || 0) <= (m.reorder_level || 10)).length;
  const catData = Object.entries(medicines.reduce((acc: Record<string, number>, m) => { acc[m.category || "Other"] = (acc[m.category || "Other"] || 0) + 1; return acc; }, {})).map(([name, value]) => ({ name, value }));
  const topByValue = medicines.sort((a, b) => ((b.cost_price || 0) * (b.stock || 0)) - ((a.cost_price || 0) * (a.stock || 0))).slice(0, 10).map(m => ({ name: m.name.substring(0, 15), value: (m.cost_price || 0) * (m.stock || 0) }));

  return (
    <AppLayout title="Inventory Analytics">
      <DepartmentHeader department="Pharmacy" title="Inventory Analytics" subtitle="Stock valuation, category distribution, and trends" quickActions={[{ label: "Inventory", path: "/inventory" }, { label: "Expiry Alerts", path: "/expiry-alerts" }]} />
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        {isAdmin && <Card><CardContent className="pt-4"><DollarSign className="h-6 w-6 text-primary mb-1" /><p className="text-2xl font-bold">KES {totalValue.toLocaleString()}</p><p className="text-xs text-muted-foreground">Cost Value</p></CardContent></Card>}
        {isAdmin && <Card><CardContent className="pt-4"><TrendingUp className="h-6 w-6 text-chart-2 mb-1" /><p className="text-2xl font-bold">KES {retailValue.toLocaleString()}</p><p className="text-xs text-muted-foreground">Retail Value</p></CardContent></Card>}
        <Card><CardContent className="pt-4"><Package className="h-6 w-6 text-chart-3 mb-1" /><p className="text-2xl font-bold">{medicines.length}</p><p className="text-xs text-muted-foreground">Total SKUs</p></CardContent></Card>
        <Card><CardContent className="pt-4"><AlertTriangle className="h-6 w-6 text-destructive mb-1" /><p className="text-2xl font-bold">{lowStock}</p><p className="text-xs text-muted-foreground">Low Stock</p></CardContent></Card>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle className="text-sm">Category Distribution</CardTitle></CardHeader><CardContent>
          <ResponsiveContainer width="100%" height={250}><PieChart><Pie data={catData} cx="50%" cy="50%" outerRadius={90} label dataKey="value">{catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Top 10 by Stock Value</CardTitle></CardHeader><CardContent>
          <ResponsiveContainer width="100%" height={250}><BarChart data={topByValue}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 9 }} /><YAxis /><Tooltip /><Bar dataKey="value" fill="hsl(var(--primary))" /></BarChart></ResponsiveContainer>
        </CardContent></Card>
      </div>
    </AppLayout>
  );
}
