import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useEffect, useState } from "react";
import { Users, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHospital } from "@/contexts/HospitalContext";

export default function PatientQueue() {
  const { hospitalId } = useHospital();
  const [queue, setQueue] = useState<any[]>([]);
  const { toast } = useToast();

  const fetchQueue = async () => {
    const { data } = await supabase.from("consultations").select("*, patients(first_name,last_name,patient_no), staff(first_name,last_name)").eq("hospital_id", hospitalId).in("status", ["waiting", "in_progress"]).order("created_at", { ascending: true });
    setQueue(data || []);
  };
  useEffect(() => { fetchQueue(); }, [hospitalId]);

  const callNext = async (id: string) => {
    await supabase.from("consultations").update({ status: "in_progress" }).eq("id", id);
    toast({ title: "Patient called" });
    fetchQueue();
  };

  const complete = async (id: string) => {
    if (!window.confirm("Complete this consultation now? You can reopen it later from the doctor dashboard.")) return;
    await supabase.from("consultations").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", id);
    toast({ title: "Consultation completed" });
    fetchQueue();
  };

  const waiting = queue.filter(q => q.status === "waiting");
  const inProgress = queue.filter(q => q.status === "in_progress");

  return (
    <AppLayout title="Patient Queue">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="pt-4 flex items-center gap-3"><Users className="h-8 w-8 text-primary" /><div><p className="text-2xl font-black">{waiting.length}</p><p className="text-xs text-muted-foreground">Waiting</p></div></CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3"><Clock className="h-8 w-8 text-warning" /><div><p className="text-2xl font-black">{inProgress.length}</p><p className="text-xs text-muted-foreground">In Progress</p></div></CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3"><CheckCircle2 className="h-8 w-8 text-success" /><div><p className="text-2xl font-black">{queue.length}</p><p className="text-xs text-muted-foreground">Total Today</p></div></CardContent></Card>
        </div>
        <Card>
          <CardHeader><CardTitle>Current Queue</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Patient</TableHead><TableHead>Doctor</TableHead><TableHead>Status</TableHead><TableHead>Wait Time</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {queue.map((q, i) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-bold">{i + 1}</TableCell>
                    <TableCell className="font-medium">{q.patients?.first_name} {q.patients?.last_name}</TableCell>
                    <TableCell>Dr. {q.staff?.first_name} {q.staff?.last_name}</TableCell>
                    <TableCell><Badge variant={q.status === "waiting" ? "secondary" : "default"}>{q.status}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{Math.round((Date.now() - new Date(q.created_at).getTime()) / 60000)} min</TableCell>
                    <TableCell className="flex gap-1">
                      {q.status === "waiting" && <Button size="sm" onClick={() => callNext(q.id)}><ArrowRight className="h-3 w-3 mr-1" />Call</Button>}
                      {q.status === "in_progress" && <Button size="sm" variant="outline" onClick={() => complete(q.id)}><CheckCircle2 className="h-3 w-3 mr-1" />Complete</Button>}
                    </TableCell>
                  </TableRow>
                ))}
                {queue.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No patients in queue</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
