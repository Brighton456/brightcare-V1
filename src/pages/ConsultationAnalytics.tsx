import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Users, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useHospital } from "@/contexts/HospitalContext";

const COLORS = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(var(--muted))"];

export default function ConsultationAnalytics() {
  const { hospitalId } = useHospital();
  const [stats, setStats] = useState({ total: 0, completed: 0, revenue: 0, avgFee: 0, byType: [] as any[], byDoctor: [] as any[] });

  useEffect(() => {
    supabase.from("consultations").select("*, staff(first_name,last_name)").eq("hospital_id", hospitalId).then(({ data }) => {
      if (!data) return;
      const completed = data.filter(d => d.status === "completed");
      const revenue = data.reduce((s, d) => s + (d.consultation_fee || 0), 0);
      const typeMap: Record<string, number> = {};
      const docMap: Record<string, number> = {};
      data.forEach(d => {
        typeMap[d.visit_type || "outpatient"] = (typeMap[d.visit_type || "outpatient"] || 0) + 1;
        const doc = `Dr. ${d.staff?.first_name || "Unknown"}`;
        docMap[doc] = (docMap[doc] || 0) + 1;
      });
      setStats({
        total: data.length, completed: completed.length, revenue, avgFee: data.length ? revenue / data.length : 0,
        byType: Object.entries(typeMap).map(([name, value]) => ({ name, value })),
        byDoctor: Object.entries(docMap).map(([name, count]) => ({ name, count })),
      });
    });
  }, [hospitalId]);

  return (
    <AppLayout title="Consultation Analytics">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-4 flex items-center gap-3"><Users className="h-8 w-8 text-primary" /><div><p className="text-2xl font-black">{stats.total}</p><p className="text-xs text-muted-foreground">Total Consultations</p></div></CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3"><BarChart3 className="h-8 w-8 text-success" /><div><p className="text-2xl font-black">{stats.completed}</p><p className="text-xs text-muted-foreground">Completed</p></div></CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3"><DollarSign className="h-8 w-8 text-warning" /><div><p className="text-2xl font-black">KES {stats.revenue.toLocaleString()}</p><p className="text-xs text-muted-foreground">Total Revenue</p></div></CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3"><TrendingUp className="h-8 w-8 text-primary" /><div><p className="text-2xl font-black">KES {Math.round(stats.avgFee).toLocaleString()}</p><p className="text-xs text-muted-foreground">Avg Fee</p></div></CardContent></Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card><CardHeader><CardTitle>By Visit Type</CardTitle></CardHeader><CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={stats.byType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{stats.byType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
          </CardContent></Card>
          <Card><CardHeader><CardTitle>By Doctor</CardTitle></CardHeader><CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%"><BarChart data={stats.byDoctor}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={12} /><YAxis /><Tooltip /><Bar dataKey="count" fill="hsl(var(--primary))" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer>
          </CardContent></Card>
        </div>
      </div>
    </AppLayout>
  );
}
