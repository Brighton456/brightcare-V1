import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useState, useEffect } from "react";
import { Users, Clock, CheckCircle2, Stethoscope } from "lucide-react";
import { useHospital } from "@/contexts/HospitalContext";

export default function OutpatientDept() {
  const { hospitalId } = useHospital();
  const [consultations, setConsultations] = useState<any[]>([]);
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    supabase.from("consultations").select("*, patients(first_name,last_name,patient_no), staff(first_name,last_name)").eq("hospital_id", hospitalId).eq("visit_type", "outpatient").gte("created_at", today).order("created_at").then(({ data }) => setConsultations(data || []));
  }, [hospitalId]);

  return (
    <AppLayout title="Outpatient Department (OPD)">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-4 flex items-center gap-3"><Users className="h-8 w-8 text-primary" /><div><p className="text-2xl font-black">{consultations.length}</p><p className="text-xs text-muted-foreground">Today's Visits</p></div></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Waiting</p><p className="text-2xl font-black text-warning">{consultations.filter(c => c.status === "waiting").length}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">In Consultation</p><p className="text-2xl font-black">{consultations.filter(c => c.status === "in_progress").length}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Completed</p><p className="text-2xl font-black text-success">{consultations.filter(c => c.status === "completed").length}</p></CardContent></Card>
        </div>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Stethoscope className="h-5 w-5" />OPD Queue</CardTitle></CardHeader><CardContent>
          <Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>Patient</TableHead><TableHead>Doctor</TableHead><TableHead>Complaint</TableHead><TableHead>Status</TableHead><TableHead>Time</TableHead></TableRow></TableHeader>
            <TableBody>{consultations.map((c, i) => (
              <TableRow key={c.id}><TableCell>{i + 1}</TableCell><TableCell className="font-medium">{c.patients?.first_name} {c.patients?.last_name}</TableCell><TableCell>Dr. {c.staff?.first_name}</TableCell><TableCell>{c.chief_complaint || "—"}</TableCell><TableCell><Badge variant={c.status === "completed" ? "default" : c.status === "waiting" ? "secondary" : "outline"}>{c.status}</Badge></TableCell><TableCell className="text-xs">{new Date(c.created_at).toLocaleTimeString()}</TableCell></TableRow>
            ))}{consultations.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No OPD visits today</TableCell></TableRow>}</TableBody></Table>
        </CardContent></Card>
      </div>
    </AppLayout>
  );
}
