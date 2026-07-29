import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useState, useEffect } from "react";
import { ClipboardList, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHospital } from "@/contexts/HospitalContext";

export default function TreatmentPlans() {
  const { hospitalId } = useHospital();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [plan, setPlan] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    supabase.from("consultations").select("*, patients(first_name,last_name)").eq("hospital_id", hospitalId).order("created_at", { ascending: false }).limit(50).then(({ data }) => setConsultations(data || []));
  }, [hospitalId]);

  const save = async () => {
    if (!editId) return;
    await supabase.from("consultations").update({ treatment_plan: plan }).eq("id", editId);
    toast({ title: "Treatment plan saved" });
    setEditId(null);
    supabase.from("consultations").select("*, patients(first_name,last_name)").eq("hospital_id", hospitalId).order("created_at", { ascending: false }).limit(50).then(({ data }) => setConsultations(data || []));
  };

  return (
    <AppLayout title="Treatment Plans">
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5" />Treatment Plans</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Patient</TableHead><TableHead>Diagnosis</TableHead><TableHead>Treatment Plan</TableHead><TableHead>Date</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {consultations.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.patients?.first_name} {c.patients?.last_name}</TableCell>
                    <TableCell>{c.diagnosis || "—"}</TableCell>
                    <TableCell className="max-w-xs truncate">{editId === c.id ? <Textarea value={plan} onChange={e => setPlan(e.target.value)} rows={3} /> : (c.treatment_plan || "—")}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{editId === c.id ? <Button size="sm" onClick={save}><Save className="h-3 w-3 mr-1" />Save</Button> : <Button size="sm" variant="outline" onClick={() => { setEditId(c.id); setPlan(c.treatment_plan || ""); }}>Edit</Button>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
