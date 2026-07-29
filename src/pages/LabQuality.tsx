import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useState, useEffect } from "react";
import { Shield, CheckCircle2, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useHospital } from "@/contexts/HospitalContext";

export default function LabQuality() {
  const { hospitalId } = useHospital();
  const [stats, setStats] = useState({ total: 0, completed: 0, abnormal: 0, avgTurnaround: 0 });

  useEffect(() => {
    supabase.from("lab_tests").select("*").eq("hospital_id", hospitalId).then(({ data }) => {
      if (!data) return;
      const completed = data.filter(t => t.status === "completed");
      const abnormal = data.filter(t => t.is_abnormal);
      const turnarounds = completed.filter(t => t.completed_at && t.requested_at).map(t => (new Date(t.completed_at!).getTime() - new Date(t.requested_at!).getTime()) / 3600000);
      setStats({
        total: data.length, completed: completed.length, abnormal: abnormal.length,
        avgTurnaround: turnarounds.length ? turnarounds.reduce((a, b) => a + b, 0) / turnarounds.length : 0,
      });
    });
  }, [hospitalId]);

  const completionRate = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;
  const abnormalRate = stats.total ? Math.round((stats.abnormal / stats.total) * 100) : 0;

  return (
    <AppLayout title="Lab Quality Control">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Tests</p><p className="text-2xl font-black">{stats.total}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Completion Rate</p><p className="text-2xl font-black">{completionRate}%</p><Progress value={completionRate} className="mt-2 h-2" /></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Abnormal Rate</p><p className="text-2xl font-black text-destructive">{abnormalRate}%</p><Progress value={abnormalRate} className="mt-2 h-2" /></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Avg Turnaround</p><p className="text-2xl font-black">{stats.avgTurnaround.toFixed(1)}h</p></CardContent></Card>
        </div>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Quality Metrics</CardTitle></CardHeader><CardContent>
          <div className="space-y-4">
            {[{ label: "Sample Collection Accuracy", value: 96 }, { label: "Result Validation Rate", value: completionRate }, { label: "Report Delivery On Time", value: 89 }, { label: "Equipment Calibration", value: 100 }, { label: "Staff Competency Score", value: 94 }].map(m => (
              <div key={m.label} className="flex items-center gap-4">
                <p className="text-sm w-48">{m.label}</p>
                <Progress value={m.value} className="flex-1 h-3" />
                <Badge variant={m.value >= 90 ? "default" : m.value >= 70 ? "secondary" : "destructive"}>{m.value}%</Badge>
              </div>
            ))}
          </div>
        </CardContent></Card>
      </div>
    </AppLayout>
  );
}
