import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ComboInput } from "@/components/ComboInput";
import { WorkflowSuggestions } from "@/components/WorkflowSuggestions";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useEffect, useState } from "react";
import { Pill, FileText, CheckCircle2, Clock, Plus, Trash2, Eye, Stethoscope } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useHospital } from "@/contexts/HospitalContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";

export default function Prescriptions() {
  const { hospitalId } = useHospital();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [labTests, setLabTests] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [detailItems, setDetailItems] = useState<any[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const { options: freqOptions } = useDropdownOptions("prescription_frequency");
  const { options: durationOptions } = useDropdownOptions("prescription_duration");

  // New prescription form
  const [selectedConsultation, setSelectedConsultation] = useState("");
  const [consultSearch, setConsultSearch] = useState("");
  const [prescNotes, setPrescNotes] = useState("");
  const [items, setItems] = useState<any[]>([{ medicine_name: "", medicine_id: null, dosage: "", frequency: "3x daily", duration: "7 days", quantity: "1", instructions: "" }]);
  const [serviceItems, setServiceItems] = useState<{ service_id: string; service_name: string; price: number }[]>([]);

  const fetchAll = async () => {
    const [pRes, cRes, mRes, sRes, lRes] = await Promise.all([
      supabase.from("prescriptions").select("*, patients(first_name,last_name,patient_no), staff(first_name,last_name), prescription_items(*)").eq("hospital_id", hospitalId).order("created_at", { ascending: false }).limit(100),
      supabase.from("consultations").select("id, consultation_no, patient_id, doctor_id, patients(first_name,last_name,patient_no)").eq("hospital_id", hospitalId).eq("status", "in_progress").order("created_at", { ascending: false }),
      supabase.from("medicines").select("id, name, generic_name, brand, price, stock").eq("hospital_id", hospitalId).eq("is_active", true).order("name"),
      supabase.from("lab_service_bundles").select("id, service_name, service_code, price, category").eq("hospital_id", hospitalId).eq("is_active", true).order("service_name"),
      supabase.from("lab_tests").select("id, consultation_id, test_name, fee, status").eq("hospital_id", hospitalId),
    ]);
    setPrescriptions(pRes.data || []);
    setConsultations(cRes.data || []);
    setMedicines(mRes.data || []);
    setServices(sRes.data || []);
    setLabTests(lRes.data || []);
  };
  useEffect(() => { fetchAll(); }, [hospitalId]);

  // When a consultation is picked, auto-pull lab test fees + consultation fee as service items
  useEffect(() => {
    if (!selectedConsultation) return;
    const relatedLabs = labTests.filter(l => l.consultation_id === selectedConsultation && (l.fee || 0) > 0);
    if (relatedLabs.length === 0) return;
    setServiceItems(prev => {
      const existingIds = new Set(prev.map(p => p.service_id));
      const newOnes = relatedLabs
        .filter(l => !existingIds.has(`lab:${l.id}`))
        .map(l => ({ service_id: `lab:${l.id}`, service_name: `Lab Test: ${l.test_name}`, price: Number(l.fee) || 0 }));
      return [...prev, ...newOnes];
    });
  }, [selectedConsultation, labTests]);

  const createPrescription = async () => {
    const consult = consultations.find(c => c.id === selectedConsultation);
    if (!consult) { toast({ title: "Select a consultation", variant: "destructive" }); return; }
    const validItems = items.filter(i => i.medicine_name);
    if (validItems.length === 0 && serviceItems.length === 0) { toast({ title: "Add at least one medicine or service", variant: "destructive" }); return; }

    const { data: presc, error } = await supabase.from("prescriptions").insert({
      consultation_id: consult.id,
      patient_id: consult.patient_id,
      doctor_id: consult.doctor_id,
      prescription_no: `RX-${Date.now().toString().slice(-6)}`,
      notes: prescNotes || null,
          hospital_id: hospitalId,
    } as any).select().single();

    if (error || !presc) { toast({ title: "Error", description: error?.message, variant: "destructive" }); return; }

    const dbItems = validItems.map(i => ({
      prescription_id: (presc as any).id,
      medicine_name: i.medicine_name,
      medicine_id: (i as any).medicine_id || null,
      dosage: i.dosage || "As directed",
      frequency: i.frequency || "3x daily",
      duration: i.duration || "7 days",
      quantity: parseInt(i.quantity) || 1,
      instructions: i.instructions || null,
    }));
    const allDbItems: any[] = dbItems.map((i: any) => ({ ...i, item_type: 'medicine', hospital_id: hospitalId }));
    // Add service items
    for (const si of serviceItems) {
      // Only set service_bundle_id when it's a real bundle UUID (not the synthetic "lab:<uuid>" key)
      const isBundle = si.service_id && !si.service_id.startsWith("lab:");
      allDbItems.push({
        prescription_id: (presc as any).id,
        medicine_name: si.service_name,
        dosage: "N/A",
        frequency: "N/A",
        duration: "N/A",
        quantity: 1,
        item_type: 'service',
        service_bundle_id: isBundle ? si.service_id : null,
        unit_price: si.price,
        hospital_id: hospitalId,
      });
    }
    const { error: itemsError } = await supabase.from("prescription_items").insert(allDbItems as any);
    if (itemsError) {
      toast({ title: "Items failed to save", description: itemsError.message, variant: "destructive" });
      return;
    }
    // Auto-notify pharmacy
    await supabase.from("notifications").insert({
      title: "New Prescription Created",
      message: `Prescription ${(presc as any).prescription_no} for patient is ready for dispensing.`,
      module: "pharmacy",
      expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
          hospital_id: hospitalId,
    } as any);
    toast({ title: "Prescription created successfully" });
    setShowNew(false);
    resetForm();
    setServiceItems([]);
    fetchAll();
  };

  // No direct dispense - all dispensing goes through Pharmacy POS

  const viewDetail = async (p: any) => {
    setShowDetail(p);
    const { data } = await supabase.from("prescription_items").select("*").eq("hospital_id", hospitalId).eq("prescription_id", p.id);
    setDetailItems(data || []);
  };

  const sendToPharmacy = async (p: any) => {
    await supabase.from("prescriptions").update({ status: "sent_to_pharmacy" } as any).eq("id", p.id);
    toast({ title: "Sent to Pharmacy POS", description: `Prescription ${p.prescription_no} is now queued for dispensing at the Pharmacy.` });
    fetchAll();
  };

  const deletePrescription = async () => {
    if (!deleteTarget) return;
    await supabase.from("prescription_items").delete().eq("prescription_id", deleteTarget.id);
    await supabase.from("prescriptions").delete().eq("id", deleteTarget.id);
    setDeleteTarget(null);
    setShowDetail(null);
    toast({ title: "Prescription deleted" });
    fetchAll();
  };

  const resetForm = () => {
    setSelectedConsultation("");
    setPrescNotes("");
    setItems([{ medicine_name: "", dosage: "", frequency: "3x daily", duration: "7 days", quantity: "1", instructions: "" }]);
  };

  const addItem = () => setItems(i => [...i, { medicine_name: "", dosage: "", frequency: "3x daily", duration: "7 days", quantity: "1", instructions: "" }]);
  const removeItem = (idx: number) => setItems(i => i.filter((_, j) => j !== idx));
  const updateItem = (idx: number, field: string, value: string) => setItems(i => i.map((item, j) => j === idx ? { ...item, [field]: value } : item));

  const statusColor: Record<string, string> = { pending: "secondary", queued: "outline", sent_to_pharmacy: "outline", partial: "secondary", dispensed: "default", cancelled: "destructive" };
  const statusLabel = (s: string) => s === "sent_to_pharmacy" ? "queued" : s;

  const revertFromPharmacy = async (p: any) => {
    await supabase.from("prescriptions").update({ status: "pending" } as any).eq("id", p.id);
    toast({ title: "Reverted from pharmacy queue", description: `${p.prescription_no} is back to pending.` });
    fetchAll();
  };

  return (
    <AppLayout title="Prescriptions">
      <div className="space-y-6">
        <WorkflowSuggestions context="prescription-created" title="Quick Navigation" />
        <div className="flex justify-between items-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 mr-4">
            <Card><CardContent className="pt-4 flex items-center gap-3"><Clock className="h-8 w-8 text-warning" /><div><p className="text-2xl font-black">{prescriptions.filter(p => p.status === "pending").length}</p><p className="text-xs text-muted-foreground">Pending</p></div></CardContent></Card>
            <Card><CardContent className="pt-4 flex items-center gap-3"><CheckCircle2 className="h-8 w-8 text-success" /><div><p className="text-2xl font-black">{prescriptions.filter(p => p.status === "dispensed").length}</p><p className="text-xs text-muted-foreground">Dispensed</p></div></CardContent></Card>
            <Card><CardContent className="pt-4 flex items-center gap-3"><Pill className="h-8 w-8 text-primary" /><div><p className="text-2xl font-black">{prescriptions.length}</p><p className="text-xs text-muted-foreground">Total</p></div></CardContent></Card>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-sm">All Prescriptions</h3>
          <Button onClick={() => setShowNew(true)} className="gap-1"><Plus className="h-4 w-4" /> New Prescription</Button>
        </div>

        <Card>
          <CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow><TableHead>Rx #</TableHead><TableHead>Patient</TableHead><TableHead>Doctor</TableHead><TableHead>Items</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {prescriptions.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.prescription_no}</TableCell>
                    <TableCell>{p.patients?.first_name} {p.patients?.last_name}</TableCell>
                    <TableCell>Dr. {p.staff?.first_name}</TableCell>
                    <TableCell>{p.prescription_items?.length || 0} items</TableCell>
                    <TableCell><Badge variant={statusColor[p.status] as any || "secondary"}>{statusLabel(p.status)}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => viewDetail(p)}><Eye className="h-3.5 w-3.5" /></Button>
                        {p.status === "pending" && (
                          <Button size="sm" variant="outline" onClick={() => sendToPharmacy(p)}>→ Send to Pharmacy</Button>
                        )}
                        {(p.status === "sent_to_pharmacy" || p.status === "queued") && (
                          <Button size="sm" variant="outline" onClick={() => revertFromPharmacy(p)}>↩ Revert from queue</Button>
                        )}
                        {isAdmin && (
                          <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(p)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {prescriptions.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No prescriptions found</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* New Prescription Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Pill className="h-5 w-5" /> New Prescription</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Consultation *</Label>
              <ComboInput
                options={consultations.map(c => ({
                  label: `${c.consultation_no} — ${c.patients?.first_name || ''} ${c.patients?.last_name || ''} (${c.patients?.patient_no || ''})`,
                  value: c.id,
                }))}
                value={consultSearch}
                onChange={(v) => {
                  setConsultSearch(v);
                  // Match by label (when picked from dropdown) or by ID
                  const byId = consultations.find(c => c.id === v);
                  if (byId) { setSelectedConsultation(byId.id); return; }
                  const byLabel = consultations.find(c =>
                    `${c.consultation_no} — ${c.patients?.first_name || ''} ${c.patients?.last_name || ''} (${c.patients?.patient_no || ''})` === v
                  );
                  if (byLabel) setSelectedConsultation(byLabel.id);
                  else setSelectedConsultation("");
                }}
                placeholder="Type patient name, number, or consultation #..."
              />
              {consultations.length === 0 && <p className="text-xs text-destructive mt-1">No active consultations. Start a consultation from Doctor Dashboard first.</p>}
            </div>

            <div className="border-t pt-3">
              <div className="flex justify-between items-center mb-2">
                <Label className="font-bold">Medicines</Label>
                <Button variant="outline" size="sm" onClick={addItem}><Plus className="h-3 w-3 mr-1" /> Add Medicine</Button>
              </div>
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 mb-3 p-3 rounded-lg bg-muted/30 border">
                  <div className="col-span-12 sm:col-span-4">
                    <Label className="text-xs">Medicine *</Label>
                    <ComboInput
                      options={medicines.map(m => {
                        const parts = [m.name];
                        if (m.generic_name) parts.push(m.generic_name);
                        if (m.brand) parts.push(m.brand);
                        return { label: `${parts.join(" | ")} — KES ${m.price} (Stock: ${m.stock})`, value: m.id };
                      })}
                      value={item.medicine_name}
                      onChange={v => {
                        // ComboInput emits the LABEL when user picks an option, raw text when they type.
                        // Match by label to find the medicine, then store name + id properly via state.
                        const med = medicines.find(m => {
                          const parts = [m.name];
                          if (m.generic_name) parts.push(m.generic_name);
                          if (m.brand) parts.push(m.brand);
                          return `${parts.join(" | ")} — KES ${m.price} (Stock: ${m.stock})` === v;
                        });
                        if (med) {
                          setItems(prev => prev.map((it, j) => j === i ? { ...it, medicine_name: med.name, medicine_id: med.id } : it));
                        } else {
                          setItems(prev => prev.map((it, j) => j === i ? { ...it, medicine_name: v, medicine_id: null } : it));
                        }
                      }}
                      placeholder="Search medicine (name, generic, brand)..."
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2"><Label className="text-xs">Dosage</Label><Input className="h-8 text-xs" value={item.dosage} onChange={e => updateItem(i, "dosage", e.target.value)} placeholder="500mg" /></div>
                  <div className="col-span-4 sm:col-span-2">
                    <Label className="text-xs">Frequency</Label>
                    <ComboInput
                      options={freqOptions.map(o => ({ label: o.label, value: o.value }))}
                      value={item.frequency}
                      onChange={v => updateItem(i, "frequency", v)}
                      placeholder="Select or type..."
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Label className="text-xs">Duration</Label>
                    <ComboInput
                      options={durationOptions.map(o => ({ label: o.label, value: o.value }))}
                      value={item.duration}
                      onChange={v => updateItem(i, "duration", v)}
                      placeholder="Select or type..."
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-1"><Label className="text-xs">Qty</Label><Input className="h-8 text-xs w-full min-w-[60px]" type="number" value={item.quantity} onChange={e => updateItem(i, "quantity", e.target.value)} /></div>
                  <div className="col-span-1 flex items-end">
                    {items.length > 1 && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(i)}><Trash2 className="h-3 w-3 text-destructive" /></Button>}
                  </div>
                  <div className="col-span-12"><Label className="text-xs">Instructions</Label><Input className="h-8 text-xs" value={item.instructions} onChange={e => updateItem(i, "instructions", e.target.value)} placeholder="Take after meals, avoid alcohol..." /></div>
                </div>
              ))}
            </div>

            <div><Label>Notes</Label><Textarea value={prescNotes} onChange={e => setPrescNotes(e.target.value)} placeholder="Additional prescription notes..." rows={2} /></div>

            <div className="flex justify-end gap-2">
            </div>

            <div className="border-t pt-3">
              <div className="flex justify-between items-center mb-2">
                <Label className="font-bold flex items-center gap-1"><Stethoscope className="h-4 w-4" /> Services & Fees</Label>
                <span className="text-[10px] text-muted-foreground">Lab fees auto-loaded · add more below</span>
              </div>
              <div className="flex gap-2 mb-2">
                <div className="flex-1">
                  <ComboInput
                    options={services.map(s => ({ label: `${s.service_name} — KES ${s.price}`, value: s.id }))}
                    value=""
                    onChange={(v) => {
                      const svc = services.find(s => s.id === v);
                      if (svc) {
                        setServiceItems(prev => [...prev, { service_id: svc.id, service_name: svc.service_name, price: Number(svc.price) || 0 }]);
                      }
                    }}
                    placeholder="Search services (consultation, procedure, etc.)..."
                  />
                </div>
                <Button variant="outline" size="sm" className="h-8 text-xs whitespace-nowrap" onClick={async () => {
                  const name = window.prompt("New service name:");
                  if (!name) return;
                  const priceStr = window.prompt(`Price for "${name}" (KES):`, "0");
                  const price = parseFloat(priceStr || "0") || 0;
                  const code = `SVC-${Date.now().toString().slice(-6)}`;
                  const { data, error } = await supabase.from("lab_service_bundles").insert({
                    service_name: name, service_code: code, price, category: "general",
                    is_active: true, hospital_id: hospitalId,
                  } as any).select().single();
                  if (error || !data) { toast({ title: "Could not add service", description: error?.message, variant: "destructive" }); return; }
                  setServices(prev => [...prev, data]);
                  setServiceItems(prev => [...prev, { service_id: (data as any).id, service_name: name, price }]);
                  toast({ title: "Custom service added", description: `${name} saved to catalog` });
                }}><Plus className="h-3 w-3 mr-1" /> Custom</Button>
              </div>
              {serviceItems.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No services added yet.</p>
              ) : (
                <div className="space-y-1">
                  {serviceItems.map((si, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded border bg-muted/30 text-xs">
                      <span className="flex-1 font-medium">{si.service_name}</span>
                      <Input className="h-7 w-24 text-xs" type="number" value={si.price} onChange={e => {
                        const p = parseFloat(e.target.value) || 0;
                        setServiceItems(prev => prev.map((x, i) => i === idx ? { ...x, price: p } : x));
                      }} />
                      <span className="text-[10px] text-muted-foreground">KES</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setServiceItems(prev => prev.filter((_, i) => i !== idx))}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <p className="text-xs font-bold text-right pt-1">
                    Services Total: KES {serviceItems.reduce((s, si) => s + (si.price || 0), 0).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button onClick={createPrescription}>Create Prescription</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Prescription Detail Dialog */}
      <Dialog open={!!showDetail} onOpenChange={() => setShowDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Prescription {showDetail?.prescription_no}</DialogTitle></DialogHeader>
          {showDetail && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/50 border text-sm">
                <p><strong>Patient:</strong> {showDetail.patients?.first_name} {showDetail.patients?.last_name} ({showDetail.patients?.patient_no})</p>
                <p><strong>Doctor:</strong> Dr. {showDetail.staff?.first_name} {showDetail.staff?.last_name}</p>
                <p><strong>Status:</strong> <Badge variant={statusColor[showDetail.status] as any}>{showDetail.status}</Badge></p>
                <p><strong>Date:</strong> {new Date(showDetail.created_at).toLocaleString()}</p>
                {showDetail.notes && <p><strong>Notes:</strong> {showDetail.notes}</p>}
              </div>
              <div>
                <Label className="font-bold">Prescribed Items</Label>
                {detailItems.filter(i => (i.item_type || 'medicine') === 'medicine').length > 0 && (
                  <p className="text-xs font-semibold text-muted-foreground mt-2 mb-1">💊 Medicines</p>
                )}
                {detailItems.filter(i => (i.item_type || 'medicine') === 'medicine').map((item, i) => (
                  <div key={i} className="p-2 border rounded-lg mt-1 text-sm">
                    <p className="font-semibold">{item.medicine_name}</p>
                    <p className="text-xs text-muted-foreground">{item.dosage} · {item.frequency} · {item.duration} · Qty: {item.quantity}</p>
                    {item.instructions && <p className="text-xs italic mt-1">{item.instructions}</p>}
                  </div>
                ))}
                {detailItems.filter(i => i.item_type === 'service').length > 0 && (
                  <p className="text-xs font-semibold text-muted-foreground mt-3 mb-1">🩺 Services</p>
                )}
                {detailItems.filter(i => i.item_type === 'service').map((item, i) => (
                  <div key={i} className="p-2 border rounded-lg mt-1 text-sm bg-blue-50 dark:bg-blue-900/10">
                    <p className="font-semibold">{item.medicine_name}</p>
                    <p className="text-xs text-primary font-bold">KES {item.unit_price || 0}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                {showDetail.status === "pending" && (
                  <Button size="sm" variant="outline" onClick={() => { sendToPharmacy(showDetail); setShowDetail(null); }}>→ Send to Pharmacy</Button>
                )}
                {(showDetail.status === "sent_to_pharmacy" || showDetail.status === "queued") && (
                  <Button size="sm" variant="outline" onClick={() => { revertFromPharmacy(showDetail); setShowDetail(null); }}>↩ Revert from queue</Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deletePrescription}
        title="Delete Prescription"
        itemName={deleteTarget?.prescription_no}
      />
    </AppLayout>
  );
}
