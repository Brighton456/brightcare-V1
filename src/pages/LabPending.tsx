import { AppLayout } from "@/components/AppLayout";
import { usePermissions } from "@/hooks/usePermissions";
import { useHospital } from "@/contexts/HospitalContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useState, useEffect } from "react";
import { Clock, AlertTriangle, FlaskConical, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LabPending() {
  const { can } = usePermissions();
  const [tests, setTests] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ patient_id: "", test_name: "", test_category: "Blood", fee: "200", notes: "" });
  const { toast } = useToast();

  const { hospitalId } = useHospital();

  const fetchAll = async () => {
    if (!hospitalId) return;
    const [tRes, pRes, dRes] = await Promise.all([
      supabase.from("lab_tests").select("*, patients(first_name,last_name,patient_no)").eq("hospital_id", hospitalId).in("status", ["requested", "in_progress"]).order("requested_at", { ascending: true }),
      supabase.from("patients").select("id,first_name,last_name,patient_no").eq("hospital_id", hospitalId).order("first_name"),
      supabase.from("staff").select("id,first_name,last_name").eq("hospital_id", hospitalId).eq("role", "doctor"),
    ]);
    setTests(tRes.data || []);
    setPatients(pRes.data || []);
    setDoctors(dRes.data || []);
  };
  useEffect(() => { fetchAll(); }, [hospitalId]);

  const startTest = async (id: string) => {
    await supabase.from("lab_tests").update({ status: "in_progress" } as any).eq("id", id);
    toast({ title: "Test started" }); fetchAll();
  };

  const createLabTest = async () => {
    if (!form.patient_id || !form.test_name) { toast({ title: "Fill required fields", variant: "destructive" }); return; }
    const requestedBy = doctors[0]?.id;
    if (!requestedBy) { toast({ title: "No doctors found. Add staff first.", variant: "destructive" }); return; }
    const { error } = await supabase.from("lab_tests").insert({
      patient_id: form.patient_id,
      requested_by: requestedBy,
      test_no: `LAB-${Date.now().toString().slice(-6)}`,
      test_name: form.test_name,
      test_category: form.test_category,
      fee: parseFloat(form.fee) || 0,
      notes: form.notes || null,
          hospital_id: hospitalId,
    } as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Lab test created" });
    setShowNew(false);
    setForm({ patient_id: "", test_name: "", test_category: "Blood", fee: "200", notes: "" });
    fetchAll();
  };

  return (
    <AppLayout title="Pending Lab Tests">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="pt-4 flex items-center gap-3"><Clock className="h-8 w-8 text-warning" /><div><p className="text-2xl font-black">{tests.filter(t => t.status === "requested").length}</p><p className="text-xs text-muted-foreground">Awaiting</p></div></CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3"><FlaskConical className="h-8 w-8 text-primary" /><div><p className="text-2xl font-black">{tests.filter(t => t.status === "in_progress").length}</p><p className="text-xs text-muted-foreground">In Progress</p></div></CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3"><AlertTriangle className="h-8 w-8 text-destructive" /><div><p className="text-2xl font-black">{tests.filter(t => t.status === "requested" && (Date.now() - new Date(t.requested_at).getTime()) > 3600000).length}</p><p className="text-xs text-muted-foreground">Urgent (1h+)</p></div></CardContent></Card>
        </div>

        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-sm">Pending Tests Queue</h3>
          <Button onClick={() => setShowNew(true)} className="gap-1"><Plus className="h-4 w-4" /> New Lab Test</Button>
        </div>

        <Card><CardContent className="pt-4">
          <Table><TableHeader><TableRow><TableHead>Test#</TableHead><TableHead>Patient</TableHead><TableHead>Test</TableHead><TableHead>Category</TableHead><TableHead>Priority</TableHead><TableHead>Wait</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>{tests.map(t => <TableRow key={t.id}><TableCell className="font-mono text-xs">{t.test_no}</TableCell><TableCell>{t.patients?.first_name} {t.patients?.last_name}</TableCell><TableCell className="font-medium">{t.test_name}</TableCell><TableCell>{t.test_category || "General"}</TableCell><TableCell><Badge variant={(Date.now() - new Date(t.requested_at).getTime()) > 3600000 ? "destructive" : "secondary"}>{(Date.now() - new Date(t.requested_at).getTime()) > 3600000 ? "URGENT" : "Normal"}</Badge></TableCell><TableCell className="text-sm">{Math.round((Date.now() - new Date(t.requested_at).getTime()) / 60000)} min</TableCell><TableCell>{t.status === "requested" && <Button size="sm" onClick={() => startTest(t.id)}>Start Test</Button>}</TableCell></TableRow>)}
              {tests.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No pending tests</TableCell></TableRow>}
            </TableBody></Table>
        </CardContent></Card>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><FlaskConical className="h-5 w-5" /> New Lab Test Request</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Patient *</Label>
              <Select value={form.patient_id} onValueChange={v => setForm(f => ({ ...f, patient_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.patient_no})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Test Name *</Label><Input value={form.test_name} onChange={e => setForm(f => ({ ...f, test_name: e.target.value }))} placeholder="e.g. Complete Blood Count, Urinalysis, X-Ray" /></div>
            <div>
              <Label>Category</Label>
              <Select value={form.test_category} onValueChange={v => setForm(f => ({ ...f, test_category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Blood", "Urine", "Stool", "Imaging", "Microbiology", "Biochemistry", "Serology", "Histopathology"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Fee (KES)</Label><Input value={form.fee} onChange={e => setForm(f => ({ ...f, fee: e.target.value }))} /></div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Clinical indication, special instructions..." /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button onClick={createLabTest}>Submit Request</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
