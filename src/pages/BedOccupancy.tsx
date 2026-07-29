import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { DepartmentHeader } from "@/components/DepartmentHeader";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bed, Activity } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useHospital } from "@/contexts/HospitalContext";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "#94a3b8"];

export default function BedOccupancy() {
  const { hospitalId } = useHospital();
  const [wards, setWards] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from("wards").select("*").eq("hospital_id", hospitalId).eq("is_active", true),
      supabase.from("beds").select("*").eq("hospital_id", hospitalId),
    ]).then(([w, b]) => { if (w.data) setWards(w.data); if (b.data) setBeds(b.data); });
  }, [hospitalId]);

  const occupied = beds.filter(b => b.status === "occupied").length;
  const available = beds.filter(b => b.status === "available").length;
  const maintenance = beds.filter(b => b.status === "maintenance").length;
  const pieData = [{ name: "Occupied", value: occupied }, { name: "Available", value: available }, { name: "Maintenance", value: maintenance }];
  const rate = beds.length > 0 ? Math.round(occupied / beds.length * 100) : 0;

  return (
    <AppLayout title="Bed Occupancy">
      <DepartmentHeader department="Inpatient & Ward" title="Bed Occupancy Heatmap" subtitle="Visual overview of bed utilization across wards" quickActions={[{ label: "Bed Allocation", path: "/bed-allocation" }, { label: "Ward Overview", path: "/inpatient" }]} />
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="pt-4"><p className="text-2xl font-bold">{beds.length}</p><p className="text-xs text-muted-foreground">Total Beds</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-2xl font-bold text-destructive">{occupied}</p><p className="text-xs text-muted-foreground">Occupied</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-2xl font-bold text-green-600">{available}</p><p className="text-xs text-muted-foreground">Available</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-2xl font-bold">{rate}%</p><p className="text-xs text-muted-foreground">Occupancy Rate</p></CardContent></Card>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Occupancy Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart><Pie data={pieData} cx="50%" cy="50%" outerRadius={90} label dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Ward Breakdown</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {wards.map(w => {
              const wardBeds = beds.filter(b => b.ward_id === w.id);
              const wOcc = wardBeds.filter(b => b.status === "occupied").length;
              const wRate = wardBeds.length > 0 ? Math.round(wOcc / wardBeds.length * 100) : 0;
              return (
                <div key={w.id} className="flex items-center justify-between">
                  <div><p className="font-medium text-sm">{w.name}</p><p className="text-xs text-muted-foreground">{wOcc}/{wardBeds.length} beds</p></div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-muted rounded-full h-2"><div className={`h-2 rounded-full ${wRate >= 80 ? "bg-red-500" : wRate >= 50 ? "bg-amber-500" : "bg-green-500"}`} style={{ width: `${wRate}%` }} /></div>
                    <span className="text-sm font-medium w-10 text-right">{wRate}%</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
