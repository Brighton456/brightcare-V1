import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useState, useEffect } from "react";
import { ClipboardList, CheckCircle2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHospital } from "@/contexts/HospitalContext";

export default function WardRounds() {
  const { hospitalId } = useHospital();
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [roundedIds, setRoundedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    supabase.from("admissions").select("*, patients(first_name,last_name,patient_no), beds(bed_number), staff(first_name,last_name)").eq("hospital_id", hospitalId).eq("status", "admitted").then(({ data }) => setAdmissions(data || []));
  }, [hospitalId]);

  const markRounded = (id: string) => {
    setRoundedIds(prev => new Set([...prev, id]));
    toast({ title: "Ward round completed for patient" });
  };

  return (
    <AppLayout title="Ward Rounds">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Patients</p><p className="text-2xl font-black">{admissions.length}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Rounds Completed</p><p className="text-2xl font-black text-success">{roundedIds.size}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Remaining</p><p className="text-2xl font-black text-warning">{admissions.length - roundedIds.size}</p></CardContent></Card>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {admissions.map(a => (
            <Card key={a.id} className={roundedIds.has(a.id) ? "border-success/50 bg-success/5" : ""}>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-bold">{a.patients?.first_name} {a.patients?.last_name}</p>
                  {roundedIds.has(a.id) ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Clock className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>Admission: {a.admission_no}</p>
                  <p>Bed: {a.beds?.bed_number || "Unassigned"}</p>
                  <p>Doctor: Dr. {a.staff?.first_name || "Unassigned"}</p>
                  <p>Diagnosis: {a.diagnosis || "Pending"}</p>
                </div>
                {!roundedIds.has(a.id) && <Button size="sm" className="w-full" onClick={() => markRounded(a.id)}>Complete Round</Button>}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
