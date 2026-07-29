import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useHospital } from "@/contexts/HospitalContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  Bed, Activity, Heart, ClipboardList, UserPlus, Search,
  Plus, CheckCircle, AlertTriangle, Thermometer, Clock,
  FileText, ArrowRightLeft,
} from "lucide-react";

interface Ward { id: string; name: string; ward_type: string; total_beds: number; floor: string | null; is_active: boolean; }
interface BedRecord { id: string; ward_id: string; bed_number: string; bed_type: string; status: string; daily_rate: number; notes: string | null; wards?: { name: string }; }
interface Admission {
  id: string; admission_no: string; patient_id: string; bed_id: string | null; doctor_id: string | null;
  admission_type: string; reason: string | null; diagnosis: string | null; status: string;
  admitted_at: string; discharged_at: string | null; discharge_summary: string | null; notes: string | null;
  patients?: { first_name: string; last_name: string; patient_no: string };
  staff?: { first_name: string; last_name: string };
  beds?: { bed_number: string; wards?: { name: string } };
}
interface VitalRecord {
  id: string; admission_id: string; blood_pressure: string | null; pulse: number | null;
  temperature: number | null; respiratory_rate: number | null; spo2: number | null;
  weight: number | null; blood_sugar: number | null; pain_level: number | null;
  notes: string | null; recorded_at: string;
  staff?: { first_name: string; last_name: string };
}
interface NursingNote {
  id: string; admission_id: string; note_type: string; content: string; shift: string | null; created_at: string;
  staff?: { first_name: string; last_name: string };
}

export default function InpatientWard() {
  const [wards, setWards] = useState<Ward[]>([]);
  const [beds, setBeds] = useState<BedRecord[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [nurses, setNurses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Dialogs
  const [showAdmit, setShowAdmit] = useState(false);
  const [showWard, setShowWard] = useState(false);
  const [showBed, setShowBed] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
  const [showVitals, setShowVitals] = useState(false);
  const [showNursingNote, setShowNursingNote] = useState(false);
  const [showDischarge, setShowDischarge] = useState(false);
  const [vitalsHistory, setVitalsHistory] = useState<VitalRecord[]>([]);
  const [nursingNotes, setNursingNotes] = useState<NursingNote[]>([]);

  // Forms
  const [wardForm, setWardForm] = useState({ name: "", ward_type: "general", total_beds: "10", floor: "" });
  const [bedForm, setBedForm] = useState({ ward_id: "", bed_number: "", bed_type: "standard", daily_rate: "1000" });
  const [admitForm, setAdmitForm] = useState({ patient_id: "", bed_id: "", doctor_id: "", admission_type: "planned", reason: "", notes: "" });
  const [vitalsForm, setVitalsForm] = useState({ blood_pressure: "", pulse: "", temperature: "", respiratory_rate: "", spo2: "", weight: "", blood_sugar: "", pain_level: "", notes: "" });
  const [noteForm, setNoteForm] = useState({ note_type: "general", content: "", shift: "day" });
  const [dischargeForm, setDischargeForm] = useState({ discharge_summary: "" });

  const { hospitalId } = useHospital();

  const fetchAll = async () => {
    if (!hospitalId) return;
    const [wRes, bRes, aRes, pRes, dRes, nRes] = await Promise.all([
      supabase.from("wards").select("*").eq("hospital_id", hospitalId).order("name"),
      supabase.from("beds").select("*, wards(name)").eq("hospital_id", hospitalId).order("bed_number"),
      supabase.from("admissions").select("*, patients(first_name,last_name,patient_no), staff(first_name,last_name), beds(bed_number, wards(name))").eq("hospital_id", hospitalId).order("admitted_at", { ascending: false }).limit(100),
      supabase.from("patients").select("id,first_name,last_name,patient_no").eq("hospital_id", hospitalId).order("first_name"),
      supabase.from("staff").select("id,first_name,last_name").eq("hospital_id", hospitalId).eq("role", "doctor"),
      supabase.from("staff").select("id,first_name,last_name").eq("hospital_id", hospitalId).eq("role", "nurse"),
    ]);
    if (wRes.data) setWards(wRes.data as any[]);
    if (bRes.data) setBeds(bRes.data as any[]);
    if (aRes.data) setAdmissions(aRes.data as any[]);
    if (pRes.data) setPatients(pRes.data as any[]);
    if (dRes.data) setDoctors(dRes.data as any[]);
    if (nRes.data) setNurses(nRes.data as any[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [hospitalId]);

  const createWard = async () => {
    if (!wardForm.name) { toast({ title: "Error", description: "Ward name required", variant: "destructive" }); return; }
    const { error } = await supabase.from("wards").insert({ name: wardForm.name, ward_type: wardForm.ward_type, total_beds: parseInt(wardForm.total_beds) || 10, floor: wardForm.floor || null, hospital_id: hospitalId } as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Ward Created" }); setShowWard(false); fetchAll();
  };

  const createBed = async () => {
    if (!bedForm.ward_id || !bedForm.bed_number) { toast({ title: "Error", description: "Fill all fields", variant: "destructive" }); return; }
    const { error } = await supabase.from("beds").insert({ ward_id: bedForm.ward_id, bed_number: bedForm.bed_number, bed_type: bedForm.bed_type, daily_rate: parseFloat(bedForm.daily_rate) || 0, hospital_id: hospitalId } as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Bed Added" }); setShowBed(false); fetchAll();
  };

  const admitPatient = async () => {
    if (!admitForm.patient_id) { toast({ title: "Error", description: "Select a patient", variant: "destructive" }); return; }
    const { error } = await supabase.from("admissions").insert({
      admission_no: `ADM-${Date.now().toString().slice(-6)}`,
      patient_id: admitForm.patient_id,
      bed_id: admitForm.bed_id || null,
      doctor_id: admitForm.doctor_id || null,
      admission_type: admitForm.admission_type,
      reason: admitForm.reason || null,
      notes: admitForm.notes || null,
      hospital_id: hospitalId,
    } as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    if (admitForm.bed_id) await supabase.from("beds").update({ status: "occupied" } as any).eq("id", admitForm.bed_id);
    toast({ title: "Patient Admitted" }); setShowAdmit(false); fetchAll();
  };

  const openAdmissionDetail = async (a: Admission) => {
    setSelectedAdmission(a);
    const [vRes, nRes] = await Promise.all([
      supabase.from("vitals_records").select("*, staff(first_name,last_name)").eq("admission_id", a.id).order("recorded_at", { ascending: false }),
      supabase.from("nursing_notes").select("*, staff(first_name,last_name)").eq("admission_id", a.id).order("created_at", { ascending: false }),
    ]);
    if (vRes.data) setVitalsHistory(vRes.data as any[]);
    if (nRes.data) setNursingNotes(nRes.data as any[]);
  };

  const recordVitals = async () => {
    if (!selectedAdmission) return;
    const { error } = await supabase.from("vitals_records").insert({
      admission_id: selectedAdmission.id,
      patient_id: selectedAdmission.patient_id,
      blood_pressure: vitalsForm.blood_pressure || null,
      pulse: vitalsForm.pulse ? parseInt(vitalsForm.pulse) : null,
      temperature: vitalsForm.temperature ? parseFloat(vitalsForm.temperature) : null,
      respiratory_rate: vitalsForm.respiratory_rate ? parseInt(vitalsForm.respiratory_rate) : null,
      spo2: vitalsForm.spo2 ? parseInt(vitalsForm.spo2) : null,
      weight: vitalsForm.weight ? parseFloat(vitalsForm.weight) : null,
      blood_sugar: vitalsForm.blood_sugar ? parseFloat(vitalsForm.blood_sugar) : null,
      pain_level: vitalsForm.pain_level ? parseInt(vitalsForm.pain_level) : null,
      notes: vitalsForm.notes || null,
          hospital_id: hospitalId,
    } as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Vitals Recorded" }); setShowVitals(false);
    setVitalsForm({ blood_pressure: "", pulse: "", temperature: "", respiratory_rate: "", spo2: "", weight: "", blood_sugar: "", pain_level: "", notes: "" });
    openAdmissionDetail(selectedAdmission);
  };

  const addNursingNote = async () => {
    if (!selectedAdmission || !noteForm.content) return;
    const { error } = await supabase.from("nursing_notes").insert({
      admission_id: selectedAdmission.id,
      note_type: noteForm.note_type,
      content: noteForm.content,
      shift: noteForm.shift,
          hospital_id: hospitalId,
    } as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Note Added" }); setShowNursingNote(false);
    setNoteForm({ note_type: "general", content: "", shift: "day" });
    openAdmissionDetail(selectedAdmission);
  };

  const dischargePatient = async () => {
    if (!selectedAdmission) return;
    await supabase.from("admissions").update({
      status: "discharged", discharged_at: new Date().toISOString(),
      discharge_summary: dischargeForm.discharge_summary || null,
    } as any).eq("id", selectedAdmission.id);
    if (selectedAdmission.bed_id) await supabase.from("beds").update({ status: "available" } as any).eq("id", selectedAdmission.bed_id);
    toast({ title: "Patient Discharged" }); setShowDischarge(false); setSelectedAdmission(null); fetchAll();
  };

  const activeAdmissions = admissions.filter(a => a.status === "admitted");
  const availableBeds = beds.filter(b => b.status === "available");
  const occupiedBeds = beds.filter(b => b.status === "occupied");

  const statusColors: Record<string, string> = {
    admitted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    discharged: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    transferred: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  };

  const bedStatusColors: Record<string, string> = {
    available: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    occupied: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    maintenance: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    reserved: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  };

  return (
    <AppLayout title="Inpatient & Ward Management">
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Active Patients", value: activeAdmissions.length, icon: Heart, color: "text-blue-600" },
            { label: "Total Beds", value: beds.length, icon: Bed, color: "text-primary" },
            { label: "Available", value: availableBeds.length, icon: CheckCircle, color: "text-emerald-600" },
            { label: "Occupied", value: occupiedBeds.length, icon: Activity, color: "text-red-600" },
            { label: "Wards", value: wards.length, icon: ClipboardList, color: "text-purple-600" },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-3 p-3 rounded-xl border bg-card">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div><p className="text-lg font-bold">{s.value}</p><p className="text-[11px] text-muted-foreground">{s.label}</p></div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setShowAdmit(true)} className="gap-1"><UserPlus className="h-4 w-4" /> Admit Patient</Button>
          <Button variant="outline" onClick={() => setShowWard(true)} className="gap-1"><Plus className="h-4 w-4" /> Add Ward</Button>
          <Button variant="outline" onClick={() => setShowBed(true)} className="gap-1"><Bed className="h-4 w-4" /> Add Bed</Button>
        </div>

        <Tabs defaultValue="admissions">
          <TabsList>
            <TabsTrigger value="admissions">Admissions ({activeAdmissions.length})</TabsTrigger>
            <TabsTrigger value="beds">Bed Map ({beds.length})</TabsTrigger>
            <TabsTrigger value="history">Discharge History</TabsTrigger>
          </TabsList>

          {/* Admissions Tab */}
          <TabsContent value="admissions">
            <div className="rounded-xl border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold">Patient</th>
                  <th className="text-left p-3 font-semibold hidden md:table-cell">Bed / Ward</th>
                  <th className="text-left p-3 font-semibold hidden md:table-cell">Doctor</th>
                  <th className="text-left p-3 font-semibold">Type</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold hidden lg:table-cell">Admitted</th>
                  <th className="text-right p-3 font-semibold">Actions</th>
                </tr></thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
                  ) : activeAdmissions.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No active admissions</td></tr>
                  ) : activeAdmissions.map(a => (
                    <tr key={a.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <p className="font-semibold">{a.patients?.first_name} {a.patients?.last_name}</p>
                        <p className="text-xs text-muted-foreground">{a.admission_no}</p>
                      </td>
                      <td className="p-3 text-xs hidden md:table-cell">{a.beds?.bed_number || "—"} · {(a.beds as any)?.wards?.name || "—"}</td>
                      <td className="p-3 text-xs hidden md:table-cell">Dr. {a.staff?.first_name} {a.staff?.last_name}</td>
                      <td className="p-3"><Badge variant="outline" className="text-xs">{a.admission_type}</Badge></td>
                      <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[a.status]}`}>{a.status}</span></td>
                      <td className="p-3 text-xs hidden lg:table-cell">{new Date(a.admitted_at).toLocaleDateString()}</td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => openAdmissionDetail(a)}>Manage</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Bed Map */}
          <TabsContent value="beds">
            <div className="space-y-4">
              {wards.map(ward => {
                const wardBeds = beds.filter(b => b.ward_id === ward.id);
                return (
                  <div key={ward.id} className="rounded-xl border bg-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-bold">{ward.name}</h3>
                        <p className="text-xs text-muted-foreground">Floor: {ward.floor || "N/A"} · Type: {ward.ward_type}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{wardBeds.filter(b => b.status === "available").length} / {wardBeds.length} available</Badge>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                      {wardBeds.map(bed => (
                        <div key={bed.id} className={`p-2 rounded-lg border text-center text-xs font-semibold cursor-pointer transition-colors ${bedStatusColors[bed.status]}`}>
                          <Bed className="h-4 w-4 mx-auto mb-0.5" />
                          {bed.bed_number}
                        </div>
                      ))}
                      {wardBeds.length === 0 && <p className="text-xs text-muted-foreground col-span-full">No beds configured</p>}
                    </div>
                  </div>
                );
              })}
              {wards.length === 0 && <p className="text-center text-muted-foreground py-8">No wards created. Add a ward first.</p>}
            </div>
          </TabsContent>

          {/* History */}
          <TabsContent value="history">
            <div className="rounded-xl border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold">Patient</th>
                  <th className="text-left p-3 font-semibold">Admitted</th>
                  <th className="text-left p-3 font-semibold">Discharged</th>
                  <th className="text-left p-3 font-semibold hidden md:table-cell">Reason</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                </tr></thead>
                <tbody>
                  {admissions.filter(a => a.status === "discharged").map(a => (
                    <tr key={a.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 text-xs font-semibold">{a.patients?.first_name} {a.patients?.last_name}</td>
                      <td className="p-3 text-xs">{new Date(a.admitted_at).toLocaleDateString()}</td>
                      <td className="p-3 text-xs">{a.discharged_at ? new Date(a.discharged_at).toLocaleDateString() : "—"}</td>
                      <td className="p-3 text-xs hidden md:table-cell">{a.reason || "—"}</td>
                      <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[a.status]}`}>{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Admit Patient Dialog */}
      <Dialog open={showAdmit} onOpenChange={setShowAdmit}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> Admit Patient</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Patient *</Label>
              <Select value={admitForm.patient_id} onValueChange={v => setAdmitForm(f => ({ ...f, patient_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.patient_no})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Assign Bed</Label>
              <Select value={admitForm.bed_id} onValueChange={v => setAdmitForm(f => ({ ...f, bed_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select available bed" /></SelectTrigger>
                <SelectContent>{availableBeds.map(b => <SelectItem key={b.id} value={b.id}>{b.bed_number} — {b.wards?.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Attending Doctor</Label>
              <Select value={admitForm.doctor_id} onValueChange={v => setAdmitForm(f => ({ ...f, doctor_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                <SelectContent>{doctors.map(d => <SelectItem key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Admission Type</Label>
              <Select value={admitForm.admission_type} onValueChange={v => setAdmitForm(f => ({ ...f, admission_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="maternity">Maternity</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Reason for Admission</Label><Textarea value={admitForm.reason} onChange={e => setAdmitForm(f => ({ ...f, reason: e.target.value }))} placeholder="Describe reason for admission..." /></div>
            <div><Label>Notes</Label><Textarea value={admitForm.notes} onChange={e => setAdmitForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowAdmit(false)}>Cancel</Button>
            <Button onClick={admitPatient}>Admit Patient</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Ward Dialog */}
      <Dialog open={showWard} onOpenChange={setShowWard}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Ward</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Ward Name *</Label><Input value={wardForm.name} onChange={e => setWardForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. General Ward A" /></div>
            <div>
              <Label>Ward Type</Label>
              <Select value={wardForm.ward_type} onValueChange={v => setWardForm(f => ({ ...f, ward_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["general", "private", "semi_private", "icu", "maternity", "pediatric", "surgical", "isolation"].map(t => <SelectItem key={t} value={t}>{t.replace("_", " ").replace(/^\w/, c => c.toUpperCase())}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Floor</Label><Input value={wardForm.floor} onChange={e => setWardForm(f => ({ ...f, floor: e.target.value }))} placeholder="e.g. 2nd Floor" /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowWard(false)}>Cancel</Button>
            <Button onClick={createWard}>Create Ward</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Bed Dialog */}
      <Dialog open={showBed} onOpenChange={setShowBed}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Bed</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Ward *</Label>
              <Select value={bedForm.ward_id} onValueChange={v => setBedForm(f => ({ ...f, ward_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select ward" /></SelectTrigger>
                <SelectContent>{wards.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Bed Number *</Label><Input value={bedForm.bed_number} onChange={e => setBedForm(f => ({ ...f, bed_number: e.target.value }))} placeholder="e.g. B-01" /></div>
            <div>
              <Label>Bed Type</Label>
              <Select value={bedForm.bed_type} onValueChange={v => setBedForm(f => ({ ...f, bed_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["standard", "electric", "bariatric", "pediatric", "icu", "crib"].map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Daily Rate (KES)</Label><Input value={bedForm.daily_rate} onChange={e => setBedForm(f => ({ ...f, daily_rate: e.target.value }))} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowBed(false)}>Cancel</Button>
            <Button onClick={createBed}>Add Bed</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Patient Management Dialog (Vitals, Notes, Discharge) */}
      <Dialog open={!!selectedAdmission} onOpenChange={() => setSelectedAdmission(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" /> Patient Care — {selectedAdmission?.admission_no}
            </DialogTitle>
          </DialogHeader>
          {selectedAdmission && (
            <div className="space-y-4">
              {/* Patient info */}
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="font-semibold">{selectedAdmission.patients?.first_name} {selectedAdmission.patients?.last_name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedAdmission.patients?.patient_no} · Bed: {selectedAdmission.beds?.bed_number || "N/A"} · Dr. {selectedAdmission.staff?.first_name} {selectedAdmission.staff?.last_name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Admitted: {new Date(selectedAdmission.admitted_at).toLocaleString()}</p>
                {selectedAdmission.reason && <p className="text-xs mt-1"><strong>Reason:</strong> {selectedAdmission.reason}</p>}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => setShowVitals(true)} className="gap-1"><Thermometer className="h-3.5 w-3.5" /> Record Vitals</Button>
                <Button size="sm" variant="outline" onClick={() => setShowNursingNote(true)} className="gap-1"><FileText className="h-3.5 w-3.5" /> Add Note</Button>
                {selectedAdmission.status === "admitted" && (
                  <Button size="sm" variant="destructive" onClick={() => setShowDischarge(true)} className="gap-1"><ArrowRightLeft className="h-3.5 w-3.5" /> Discharge</Button>
                )}
              </div>

              {/* Vitals History */}
              <div>
                <h4 className="text-sm font-bold mb-2">📊 Vitals History</h4>
                {vitalsHistory.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No vitals recorded yet</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {vitalsHistory.map(v => (
                      <div key={v.id} className="p-2 rounded-lg border text-xs grid grid-cols-5 gap-1">
                        <span>BP: {v.blood_pressure || "—"}</span>
                        <span>Pulse: {v.pulse || "—"}</span>
                        <span>Temp: {v.temperature ? `${v.temperature}°C` : "—"}</span>
                        <span>SpO2: {v.spo2 ? `${v.spo2}%` : "—"}</span>
                        <span className="text-muted-foreground">{new Date(v.recorded_at).toLocaleString([], { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Nursing Notes */}
              <div>
                <h4 className="text-sm font-bold mb-2">📝 Nursing Notes</h4>
                {nursingNotes.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No notes yet</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {nursingNotes.map(n => (
                      <div key={n.id} className="p-2 rounded-lg border text-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px]">{n.note_type}</Badge>
                          <Badge variant="secondary" className="text-[10px]">{n.shift} shift</Badge>
                          <span className="text-muted-foreground">{new Date(n.created_at).toLocaleString()}</span>
                        </div>
                        <p>{n.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Record Vitals Dialog */}
      <Dialog open={showVitals} onOpenChange={setShowVitals}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Thermometer className="h-5 w-5" /> Record Vitals</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Blood Pressure</Label><Input value={vitalsForm.blood_pressure} onChange={e => setVitalsForm(f => ({ ...f, blood_pressure: e.target.value }))} placeholder="120/80" /></div>
            <div><Label>Pulse (bpm)</Label><Input value={vitalsForm.pulse} onChange={e => setVitalsForm(f => ({ ...f, pulse: e.target.value }))} /></div>
            <div><Label>Temperature (°C)</Label><Input value={vitalsForm.temperature} onChange={e => setVitalsForm(f => ({ ...f, temperature: e.target.value }))} /></div>
            <div><Label>Respiratory Rate</Label><Input value={vitalsForm.respiratory_rate} onChange={e => setVitalsForm(f => ({ ...f, respiratory_rate: e.target.value }))} /></div>
            <div><Label>SpO2 (%)</Label><Input value={vitalsForm.spo2} onChange={e => setVitalsForm(f => ({ ...f, spo2: e.target.value }))} /></div>
            <div><Label>Weight (kg)</Label><Input value={vitalsForm.weight} onChange={e => setVitalsForm(f => ({ ...f, weight: e.target.value }))} /></div>
            <div><Label>Blood Sugar</Label><Input value={vitalsForm.blood_sugar} onChange={e => setVitalsForm(f => ({ ...f, blood_sugar: e.target.value }))} /></div>
            <div><Label>Pain Level (0-10)</Label><Input type="number" min="0" max="10" value={vitalsForm.pain_level} onChange={e => setVitalsForm(f => ({ ...f, pain_level: e.target.value }))} /></div>
            <div className="col-span-2"><Label>Notes</Label><Textarea value={vitalsForm.notes} onChange={e => setVitalsForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowVitals(false)}>Cancel</Button>
            <Button onClick={recordVitals}>Save Vitals</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nursing Note Dialog */}
      <Dialog open={showNursingNote} onOpenChange={setShowNursingNote}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Nursing Note</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Note Type</Label>
              <Select value={noteForm.note_type} onValueChange={v => setNoteForm(f => ({ ...f, note_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["general", "medication", "procedure", "observation", "handover", "incident"].map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Shift</Label>
              <Select value={noteForm.shift} onValueChange={v => setNoteForm(f => ({ ...f, shift: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day Shift</SelectItem>
                  <SelectItem value="evening">Evening Shift</SelectItem>
                  <SelectItem value="night">Night Shift</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Content *</Label><Textarea value={noteForm.content} onChange={e => setNoteForm(f => ({ ...f, content: e.target.value }))} rows={4} placeholder="Enter nursing note..." /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowNursingNote(false)}>Cancel</Button>
            <Button onClick={addNursingNote}>Add Note</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discharge Dialog */}
      <Dialog open={showDischarge} onOpenChange={setShowDischarge}>
        <DialogContent>
          <DialogHeader><DialogTitle>Discharge Patient</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-muted/50 border text-sm">
              <p className="font-semibold">{selectedAdmission?.patients?.first_name} {selectedAdmission?.patients?.last_name}</p>
              <p className="text-xs text-muted-foreground">Admission: {selectedAdmission?.admission_no}</p>
            </div>
            <div><Label>Discharge Summary *</Label><Textarea value={dischargeForm.discharge_summary} onChange={e => setDischargeForm(f => ({ ...f, discharge_summary: e.target.value }))} rows={5} placeholder="Include diagnosis, treatment given, medications to continue, follow-up instructions..." /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowDischarge(false)}>Cancel</Button>
            <Button variant="destructive" onClick={dischargePatient}>Confirm Discharge</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
