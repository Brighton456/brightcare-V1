import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useState, useEffect } from "react";
import { FileText, Save, Search, Plus, FlaskConical, Pill, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useHospital } from "@/contexts/HospitalContext";

export default function ClinicalNotes() {
  const { hospitalId } = useHospital();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");
  const [showLabRequest, setShowLabRequest] = useState(false);
  const [showPrescription, setShowPrescription] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Lab form
  const [labForm, setLabForm] = useState({ test_name: "", test_category: "Blood", fee: "200", notes: "" });
  // Prescription quick-add
  const [prescItems, setPrescItems] = useState([{ medicine_name: "", dosage: "", frequency: "3x daily", duration: "7 days", quantity: "1", instructions: "" }]);
  const [prescServices, setPrescServices] = useState<{ service_id: string; service_name: string; price: number }[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [labServices, setLabServices] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from("consultations").select("*, patients(first_name,last_name,patient_no)").eq("hospital_id", hospitalId).order("created_at", { ascending: false }).limit(50),
      supabase.from("medicines").select("id, name, stock").eq("hospital_id", hospitalId).eq("is_active", true).order("name"),
      supabase.from("lab_service_bundles").select("id, service_name, service_code, price, category").eq("hospital_id", hospitalId).eq("is_active", true).order("service_name"),
    ]).then(([cRes, mRes, sRes]) => {
      setConsultations(cRes.data || []);
      setMedicines(mRes.data || []);
      setLabServices(sRes.data || []);
    });
  }, [hospitalId]);

  const saveNotes = async () => {
    if (!selected) return;
    await supabase.from("consultations").update({ doctor_notes: notes } as any).eq("id", selected.id);
    toast({ title: "Clinical notes saved" });
  };

  const requestLabTest = async () => {
    if (!selected || !labForm.test_name) return;
    await supabase.from("lab_tests").insert({
      consultation_id: selected.id,
      patient_id: selected.patient_id,
      requested_by: selected.doctor_id,
      test_no: `LAB-${Date.now().toString().slice(-6)}`,
      test_name: labForm.test_name,
      test_category: labForm.test_category,
      fee: parseFloat(labForm.fee) || 0,
      notes: labForm.notes || null,
          hospital_id: hospitalId,
    } as any);
    toast({ title: "Lab test requested", description: "Visible in Laboratory → Pending Tests" });
    setShowLabRequest(false);
    setLabForm({ test_name: "", test_category: "Blood", fee: "200", notes: "" });
  };

  const createPrescription = async () => {
    if (!selected) return;
    const validItems = prescItems.filter(i => i.medicine_name);
    if (validItems.length === 0 && prescServices.length === 0) return;
    const { data: presc, error } = await supabase.from("prescriptions").insert({
      consultation_id: selected.id,
      patient_id: selected.patient_id,
      doctor_id: selected.doctor_id,
      prescription_no: `RX-${Date.now().toString().slice(-6)}`,
          hospital_id: hospitalId,
    } as any).select().single();
    if (error || !presc) { toast({ title: "Error", description: error?.message, variant: "destructive" }); return; }
    const medItems = validItems.map(i => ({
      prescription_id: (presc as any).id,
      medicine_name: i.medicine_name,
      medicine_id: (i as any).medicine_id || null,
      dosage: i.dosage || "As directed",
      frequency: i.frequency,
      duration: i.duration,
      quantity: parseInt(i.quantity) || 1,
      instructions: i.instructions || null,
      item_type: 'medicine',
      hospital_id: hospitalId,
    }));
    const svcItems = prescServices.map(si => ({
      prescription_id: (presc as any).id,
      medicine_name: si.service_name,
      dosage: "N/A",
      frequency: "N/A",
      duration: "N/A",
      quantity: 1,
      item_type: 'service',
      service_bundle_id: si.service_id,
      unit_price: si.price,
      hospital_id: hospitalId,
    }));
    const allItems = [...medItems, ...svcItems];
    if (allItems.length > 0) {
      await supabase.from("prescription_items").insert(allItems as any);
    }
    toast({ title: "Prescription created", description: "Visible in Prescriptions & Pharmacy" });
    setShowPrescription(false);
    setPrescItems([{ medicine_name: "", dosage: "", frequency: "3x daily", duration: "7 days", quantity: "1", instructions: "" }]);
    setPrescServices([]);
  };

  const filtered = consultations.filter(c => !search || `${c.patients?.first_name} ${c.patients?.last_name}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppLayout title="Clinical Notes">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-sm">Consultations</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search patient..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} /></div>
            <div className="space-y-1 max-h-96 overflow-auto">
              {filtered.map(c => (
                <button key={c.id} onClick={() => { setSelected(c); setNotes(c.doctor_notes || ""); }} className={`w-full text-left p-2 rounded text-sm hover:bg-muted ${selected?.id === c.id ? "bg-muted font-semibold" : ""}`}>
                  <p className="font-medium">{c.patients?.first_name} {c.patients?.last_name}</p>
                  <p className="text-xs text-muted-foreground">{c.consultation_no} • {new Date(c.created_at).toLocaleDateString()}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />{selected ? `Notes: ${selected.patients?.first_name} ${selected.patients?.last_name}` : "Select a consultation"}</CardTitle>
              {selected && (
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setShowLabRequest(true)}><FlaskConical className="h-3.5 w-3.5" /> Request Lab</Button>
                  <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setShowPrescription(true)}><Pill className="h-3.5 w-3.5" /> Prescribe</Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selected ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><Label>Chief Complaint</Label><p className="text-muted-foreground">{selected.chief_complaint || "N/A"}</p></div>
                  <div><Label>Diagnosis</Label><p className="text-muted-foreground">{selected.diagnosis || "N/A"}</p></div>
                </div>
                <div><Label>Clinical Notes</Label><Textarea rows={12} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Enter detailed clinical notes, observations, examination findings..." /></div>
                <Button onClick={saveNotes}><Save className="h-4 w-4 mr-2" />Save Notes</Button>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-12">Select a consultation from the left panel to view or edit notes</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lab Request Dialog */}
      <Dialog open={showLabRequest} onOpenChange={setShowLabRequest}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><FlaskConical className="h-5 w-5" /> Request Lab Test</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Patient: <strong>{selected?.patients?.first_name} {selected?.patients?.last_name}</strong></p>
            <div><Label>Test Name *</Label><Input value={labForm.test_name} onChange={e => setLabForm(f => ({ ...f, test_name: e.target.value }))} placeholder="e.g. Complete Blood Count" /></div>
            <div>
              <Label>Category</Label>
              <Select value={labForm.test_category} onValueChange={v => setLabForm(f => ({ ...f, test_category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Blood", "Urine", "Stool", "Imaging", "Microbiology", "Biochemistry", "Serology", "Histopathology"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Fee (KES)</Label><Input value={labForm.fee} onChange={e => setLabForm(f => ({ ...f, fee: e.target.value }))} /></div>
            <div><Label>Notes</Label><Textarea value={labForm.notes} onChange={e => setLabForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowLabRequest(false)}>Cancel</Button>
              <Button onClick={requestLabTest}>Send to Lab</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Prescription Dialog */}
      <Dialog open={showPrescription} onOpenChange={setShowPrescription}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Pill className="h-5 w-5" /> Quick Prescription</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Patient: <strong>{selected?.patients?.first_name} {selected?.patients?.last_name}</strong></p>
            {prescItems.map((item, i) => (
              <div key={i} className="p-3 border rounded-lg space-y-2 bg-muted/30">
                <div className="flex justify-between">
                  <Label className="text-xs font-bold">Medicine #{i + 1}</Label>
                  {prescItems.length > 1 && <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive" onClick={() => setPrescItems(p => p.filter((_, j) => j !== i))}>Remove</Button>}
                </div>
                <Select value={item.medicine_name} onValueChange={v => setPrescItems(p => p.map((it, j) => j === i ? { ...it, medicine_name: v } : it))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select medicine" /></SelectTrigger>
                  <SelectContent>{medicines.map(m => <SelectItem key={m.id} value={m.name}>{m.name} (Stock: {m.stock})</SelectItem>)}</SelectContent>
                </Select>
                <div className="grid grid-cols-3 gap-2">
                  <Input className="h-8 text-xs" value={item.dosage} onChange={e => setPrescItems(p => p.map((it, j) => j === i ? { ...it, dosage: e.target.value } : it))} placeholder="Dosage" />
                  <Input className="h-8 text-xs" value={item.frequency} onChange={e => setPrescItems(p => p.map((it, j) => j === i ? { ...it, frequency: e.target.value } : it))} placeholder="Frequency" />
                  <Input className="h-8 text-xs" value={item.duration} onChange={e => setPrescItems(p => p.map((it, j) => j === i ? { ...it, duration: e.target.value } : it))} placeholder="Duration" />
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setPrescItems(p => [...p, { medicine_name: "", dosage: "", frequency: "3x daily", duration: "7 days", quantity: "1", instructions: "" }])}><Plus className="h-3 w-3 mr-1" /> Add Medicine</Button>
            
            {/* Services Section */}
            <div className="border-t pt-3">
              <div className="flex justify-between items-center mb-2">
                <Label className="text-xs font-bold">🩺 Clinical Services</Label>
                <Button variant="outline" size="sm" onClick={() => setPrescServices(s => [...s, { service_id: "", service_name: "", price: 0 }])}>
                  <Plus className="h-3 w-3 mr-1" /> Add Service
                </Button>
              </div>
              {prescServices.map((si, i) => (
                <div key={i} className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-muted/50 border">
                  <div className="flex-1">
                    <Select value={si.service_id} onValueChange={v => {
                      const svc = labServices.find(s => s.id === v);
                      setPrescServices(prev => prev.map((item, j) => j === i ? { service_id: v, service_name: svc?.service_name || "", price: svc?.price || 0 } : item));
                    }}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select service..." /></SelectTrigger>
                      <SelectContent>
                        {labServices.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.service_name} — KES {s.price}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <span className="text-xs font-bold text-primary">KES {si.price}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPrescServices(prev => prev.filter((_, j) => j !== i))}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPrescription(false)}>Cancel</Button>
              <Button onClick={createPrescription}>Create Prescription</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
