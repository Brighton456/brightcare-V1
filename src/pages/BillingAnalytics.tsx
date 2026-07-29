import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, CreditCard, Receipt } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import { useHospital } from "@/contexts/HospitalContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";

const COLORS = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(var(--muted-foreground))"];

export default function BillingAnalytics() {
  const { hospitalId } = useHospital();
  const [stats, setStats] = useState({ totalRevenue: 0, totalBills: 0, avgBill: 0, collected: 0, byMethod: [] as any[] });

  useEffect(() => {
    supabase.from("bills").select("*").eq("hospital_id", hospitalId).then(({ data }) => {
      if (!data) return;
      const paid = data.filter(d => d.status === "paid");
      const revenue = paid.reduce((s, d) => s + (d.amount_paid || 0), 0);
      const methodMap: Record<string, number> = {};
      paid.forEach(d => { const m = d.payment_method || "cash"; methodMap[m] = (methodMap[m] || 0) + (d.amount_paid || 0); });
      setStats({ totalRevenue: revenue, totalBills: data.length, avgBill: data.length ? revenue / data.length : 0, collected: paid.length, byMethod: Object.entries(methodMap).map(([name, value]) => ({ name, value })) });
    });
  }, [hospitalId]);

  return (
    <AppLayout title="Billing Analytics">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-4 flex items-center gap-3"><DollarSign className="h-8 w-8 text-success" /><div><p className="text-2xl font-black">KES {stats.totalRevenue.toLocaleString()}</p><p className="text-xs text-muted-foreground">Total Revenue</p></div></CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3"><Receipt className="h-8 w-8 text-primary" /><div><p className="text-2xl font-black">{stats.totalBills}</p><p className="text-xs text-muted-foreground">Total Bills</p></div></CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3"><TrendingUp className="h-8 w-8 text-warning" /><div><p className="text-2xl font-black">KES {Math.round(stats.avgBill).toLocaleString()}</p><p className="text-xs text-muted-foreground">Avg Bill</p></div></CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3"><CreditCard className="h-8 w-8 text-primary" /><div><p className="text-2xl font-black">{stats.collected}</p><p className="text-xs text-muted-foreground">Collected</p></div></CardContent></Card>
        </div>
        <Card><CardHeader><CardTitle>Revenue by Payment Method</CardTitle></CardHeader><CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={stats.byMethod} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: KES ${value.toLocaleString()}`}>{stats.byMethod.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
        </CardContent></Card>
      </div>
    </AppLayout>
  );
}
