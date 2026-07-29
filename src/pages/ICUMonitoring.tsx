import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useHospital } from "@/contexts/HospitalContext";
import { useState, useEffect } from "react";
import { Activity, Heart, Thermometer, Wind } from "lucide-react";

export default function ICUMonitoring() {
  const { hospitalId } = useHospital();
  const [records, setRecords] = useState<any[]>([]);
  useEffect(() => {
    if (!hospitalId) return;
    supabase.from("vitals_records").select("*, patients(first_name,last_name), admissions(admission_no)").eq("hospital_id", hospitalId).order("recorded_at", { ascending: false }).limit(20).then(({ data }) => setRecords(data || []));
  }, [hospitalId]);

  return (
    <AppLayout title="ICU Monitoring">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {records.length > 0 ? records.slice(0, 6).map(r => (
            <Card key={r.id} className="border-l-4 border-l-primary">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between"><p className="font-bold">{r.patients?.first_name} {r.patients?.last_name}</p><Badge variant="secondary">{r.admissions?.admission_no}</Badge></div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-muted rounded p-2"><Heart className="h-4 w-4 mx-auto text-destructive mb-1" /><p className="text-lg font-black">{r.pulse || "—"}</p><p className="text-[10px] text-muted-foreground">Pulse</p></div>
                  <div className="bg-muted rounded p-2"><Thermometer className="h-4 w-4 mx-auto text-warning mb-1" /><p className="text-lg font-black">{r.temperature || "—"}°</p><p className="text-[10px] text-muted-foreground">Temp</p></div>
                  <div className="bg-muted rounded p-2"><Wind className="h-4 w-4 mx-auto text-primary mb-1" /><p className="text-lg font-black">{r.spo2 || "—"}%</p><p className="text-[10px] text-muted-foreground">SpO2</p></div>
                </div>
                <div className="text-xs text-muted-foreground">BP: {r.blood_pressure || "—"} | RR: {r.respiratory_rate || "—"} | Pain: {r.pain_level ?? "—"}/10</div>
                <p className="text-[10px] text-muted-foreground">Recorded: {new Date(r.recorded_at).toLocaleString()}</p>
              </CardContent>
            </Card>
          )) : (
            <Card className="col-span-full"><CardContent className="py-12 text-center text-muted-foreground"><Activity className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>No ICU vitals recorded yet</p></CardContent></Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
