import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useState, useEffect } from "react";
import { FileText, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHospital } from "@/contexts/HospitalContext";

export default function NursingNotes() {
  const { hospitalId } = useHospital();
  const [notes, setNotes] = useState<any[]>([]);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ admission_id: "", note_type: "general", content: "", shift: "day" });
  const { toast } = useToast();

  const fetchAll = async () => {
    const [nRes, aRes] = await Promise.all([
      supabase.from("nursing_notes").select("*, admissions(admission_no, patients(first_name,last_name))").eq("hospital_id", hospitalId).order("created_at", { ascending: false }).limit(100),
      supabase.from("admissions").select("id, admission_no, patients(first_name,last_name)").eq("hospital_id", hospitalId).eq("status", "admitted").order("admitted_at", { ascending: false }),
    ]);
    setNotes(nRes.data || []);
    setAdmissions(aRes.data || []);
  };

  useEffect(() => { fetchAll(); }, [hospitalId]);

  const createNote = async () => {
    if (!form.admission_id || !form.content) { toast({ title: "Select admission and enter note", variant: "destructive" }); return; }
    const { error } = await supabase.from("nursing_notes").insert({
      admission_id: form.admission_id,
      note_type: form.note_type,
      content: form.content,
      shift: form.shift,
          hospital_id: hospitalId,
    } as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Nursing note added" });
    setShowNew(false);
    setForm({ admission_id: "", note_type: "general", content: "", shift: "day" });
    fetchAll();
  };

  return (
    <AppLayout title="Nursing Notes">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-sm">All Nursing Notes</h3>
          <Button onClick={() => setShowNew(true)} className="gap-1"><Plus className="h-4 w-4" /> New Note</Button>
        </div>
        <Card><CardContent className="pt-4">
          <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Patient</TableHead><TableHead>Type</TableHead><TableHead>Shift</TableHead><TableHead>Notes</TableHead></TableRow></TableHeader>
            <TableBody>{notes.map(n => (
              <TableRow key={n.id}><TableCell className="text-xs">{new Date(n.created_at).toLocaleString()}</TableCell><TableCell>{n.admissions?.patients?.first_name} {n.admissions?.patients?.last_name}</TableCell><TableCell><Badge variant="secondary">{n.note_type}</Badge></TableCell><TableCell><Badge variant="outline">{n.shift}</Badge></TableCell><TableCell className="max-w-md truncate">{n.content}</TableCell></TableRow>
            ))}{notes.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No nursing notes</TableCell></TableRow>}</TableBody></Table>
        </CardContent></Card>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> New Nursing Note</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Admitted Patient *</Label>
              <Select value={form.admission_id} onValueChange={v => setForm(f => ({ ...f, admission_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>{admissions.map(a => <SelectItem key={a.id} value={a.id}>{a.admission_no} — {a.patients?.first_name} {a.patients?.last_name}</SelectItem>)}</SelectContent>
              </Select>
              {admissions.length === 0 && <p className="text-xs text-destructive mt-1">No active admissions. Admit a patient first.</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Note Type</Label>
                <Select value={form.note_type} onValueChange={v => setForm(f => ({ ...f, note_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["general", "medication", "vitals", "observation", "handover", "incident", "wound_care", "pain_assessment"].map(t => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Shift</Label>
                <Select value={form.shift} onValueChange={v => setForm(f => ({ ...f, shift: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                    <SelectItem value="night">Night</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Note Content *</Label><Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={5} placeholder="Enter nursing observations, patient status, medication administered, vital signs trends..." /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button onClick={createNote}>Save Note</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
