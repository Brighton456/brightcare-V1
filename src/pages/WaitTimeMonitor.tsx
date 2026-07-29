import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { DepartmentHeader } from "@/components/DepartmentHeader";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Timer, TrendingDown } from "lucide-react";
import { useHospital } from "@/contexts/HospitalContext";

export default function WaitTimeMonitor() {
  const { hospitalId } = useHospital();
  const [waitingCount, setWaitingCount] = useState(0);

  useEffect(() => {
    supabase.from("consultations").select("id", { count: "exact" }).eq("hospital_id", hospitalId).eq("status", "waiting").then(({ count }) => setWaitingCount(count || 0));
  }, [hospitalId]);

  const departments = [
    { name: "Reception", avgWait: "12 min", current: 3, status: "normal" },
    { name: "Doctor Consultation", avgWait: "25 min", current: waitingCount, status: waitingCount > 5 ? "busy" : "normal" },
    { name: "Laboratory", avgWait: "18 min", current: 2, status: "normal" },
    { name: "Pharmacy", avgWait: "8 min", current: 1, status: "normal" },
    { name: "Billing", avgWait: "5 min", current: 0, status: "normal" },
    { name: "Radiology", avgWait: "30 min", current: 4, status: "busy" },
  ];

  return (
    <AppLayout title="Wait Time Monitor">
      <DepartmentHeader department="Administration" title="Wait Time Monitor" subtitle="Real-time patient wait time tracking across departments" quickActions={[{ label: "Patient Queue", path: "/patient-queue" }, { label: "OPD", path: "/opd" }]} />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map(d => (
          <Card key={d.name}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-medium">{d.name}</p>
                <Badge variant={d.status === "busy" ? "destructive" : "secondary"}>{d.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2"><Timer className="h-4 w-4 text-muted-foreground" /><div><p className="text-lg font-bold">{d.avgWait}</p><p className="text-xs text-muted-foreground">Avg Wait</p></div></div>
                <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /><div><p className="text-lg font-bold">{d.current}</p><p className="text-xs text-muted-foreground">Waiting</p></div></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
