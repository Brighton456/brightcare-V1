import { useState, useEffect, useMemo } from "react";
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
  Stethoscope, Clock, Users, FileText, FlaskConical, Pill,
  CheckCircle, Play, AlertTriangle, Calendar, Plus, ClipboardList, Trash2, Search,
} from "lucide-react";
import { ComboInput } from "@/components/ComboInput";

function calcAge(dob: string | null | undefined): string {
  if (!dob) return "";
  const birth = new Date(dob);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) years--;
  if (years < 1) {
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth();
    return months <= 0 ? "< 1mo" : `${months}mo`;
  }
  return `${years}y`;
}

interface Consultation {
  id: string;
  consultation_no: string;
  patient_id: string;
  doctor_id: string;
  visit_type: string;
  status: string;
  chief_complaint: string | null;
  symptoms: string | null;
  diagnosis: string | null;
  treatment_plan: string | null;
  doctor_notes: string | null;
  vitals: any;
  consultation_fee: number;
  follow_up_date: string | null;
  created_at: string;
  completed_at: string | null;
  patients?: { first_name: string; last_name: string; patient_no: string; gender: string | null; date_of_birth: string | null; allergies: string[] | null; chronic_conditions: string[] | null };
}

export default function DoctorDashboard() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patientHistory, setPatientHistory] = useState<any>(null);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [showLabRequest, setShowLabRequest] = useState(false);
  const [showPrescription, setShowPrescription] = useState(false);
  const [loading, setLoading] = useState(true);

  // Consultation form
  const [consultForm, setConsultForm] = useState({
    patient_id: "", patientSearch: "", visit_type: "outpatient", chief_complaint: "", symptoms: "",
    diagnosis: "", treatment_plan: "", doctor_notes: "", consultation_fee: "0",
    follow_up_date: "",
    // Vitals
    bp: "", pulse: "", temp: "", weight: "", height: "", spo2: "",
  });

  // Lab request form
  const [labForm, setLabForm] = useState({ test_name: "", test_category: "Blood", fee: "200", notes: "" });

  // Prescription form
  const [prescItems, setPrescItems] = useState([{ medicine_name: "", dosage: "", frequency: "", duration: "", quantity: "1", instructions: "" }]);
  const [prescServices, setPrescServices] = useState<{ service_id: string; service_name: string; price: number }[]>([]);
  const [labServices, setLabServices] = useState<any[]>([]);

  const { hospitalId, hospital } = useHospital();
  const taxRate = (hospital?.tax_rate ?? 16) / 100;

  // Sync default consultation fee from hospital settings
  useEffect(() => {
    if (hospital) {
      const fee = String(hospital.default_consultation_fee ?? 0);
      setConsultForm(f => ({ ...f, consultation_fee: fee }));
    }
  }, [hospital?.default_consultation_fee]);
  const fetchData = async () => {
    if (!hospitalId) return;
    const [cRes, pRes, dRes, sRes, medRes] = await Promise.all([
      supabase.from("consultations").select("*, patients(first_name,last_name,patient_no,gender,date_of_birth,allergies,chronic_conditions)").eq("hospital_id", hospitalId).order("created_at", { ascending: false }).limit(50),
      supabase.from("patients").select("id,first_name,last_name,patient_no").eq("hospital_id", hospitalId).order("first_name"),
      supabase.from("staff").select("id,first_name,last_name,staff_no").eq("hospital_id", hospitalId).eq("role", "doctor"),
      supabase.from("lab_service_bundles").select("id, service_name, service_code, price, category").eq("hospital_id", hospitalId).eq("is_active", true).order("service_name"),
      supabase.from("medicines").select("id, name, generic_name, brand, price, stock").eq("hospital_id", hospitalId).eq("is_active", true).order("name"),
    ]);
    if (cRes.data) setConsultations(cRes.data as unknown as Consultation[]);
    if (pRes.data) setPatients(pRes.data as any[]);
    if (dRes.data) setDoctors(dRes.data as any[]);
    if (sRes.data) setLabServices(sRes.data as any[]);
    if (medRes.data) (window as any).__doctorMedicines = medRes.data;
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [hospitalId]);

  useEffect(() => {
    if (selectedConsultation?.patient_id) {
      supabase.from("consultations")
        .select("*, staff(first_name,last_name)")
        .eq("patient_id", selectedConsultation.patient_id)
        .neq("id", selectedConsultation.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => setPatientHistory(data || []));
    } else {
      setPatientHistory(null);
    }
  }, [selectedConsultation?.patient_id]);

  const createConsultation = async () => {
    if (!consultForm.patient_id) {
      toast({ title: "Error", description: "Select a patient", variant: "destructive" });
      return;
    }
    const doctorId = doctors[0]?.id;
    if (!doctorId) {
      toast({ title: "Error", description: "No doctors registered. Add staff first.", variant: "destructive" });
      return;
    }
    const vitals = {
      blood_pressure: consultForm.bp, pulse: consultForm.pulse,
      temperature: consultForm.temp, weight: consultForm.weight,
      height: consultForm.height, spo2: consultForm.spo2,
    };
    const { data: newConsult, error } = await supabase.from("consultations").insert({
      patient_id: consultForm.patient_id,
      doctor_id: doctorId,
      consultation_no: `CON-${Date.now().toString().slice(-6)}`,
      visit_type: consultForm.visit_type,
      chief_complaint: consultForm.chief_complaint || null,
      symptoms: consultForm.symptoms || null,
      diagnosis: consultForm.diagnosis || null,
      treatment_plan: consultForm.treatment_plan || null,
      doctor_notes: consultForm.doctor_notes || null,
      vitals,
      consultation_fee: parseFloat(consultForm.consultation_fee) || 0,
      follow_up_date: consultForm.follow_up_date || null,
      status: "in_progress",
      completed_at: null,
          hospital_id: hospitalId,
    } as any).select("*, patients(first_name,last_name,patient_no,gender,date_of_birth,allergies,chronic_conditions)").single();
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Consultation Created" });
    setShowNew(false);
    setConsultForm({
      patient_id: "", patientSearch: "", visit_type: "outpatient", chief_complaint: "", symptoms: "",
      diagnosis: "", treatment_plan: "", doctor_notes: "", consultation_fee: String(hospital?.default_consultation_fee ?? 0),
      follow_up_date: "", bp: "", pulse: "", temp: "", weight: "", height: "", spo2: "",
    });
    fetchData();
    
    if (newConsult) {
      setSelectedConsultation(newConsult as any);
    }
  };

  const updateConsultation = async (id: string, updates: any) => {
    const consult = consultations.find(c => c.id === id);
    const { error } = await supabase.from("consultations").update(updates as any).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    
    // Auto-generate bill when consultation is completed
    if (updates.status === "completed" && consult?.status !== "completed") {
      if (consult) {
        const fee = consult.consultation_fee || (hospital?.default_consultation_fee ?? 0);
        const { data: existingBill } = await supabase.from("bills").select("id").eq("consultation_id", id).maybeSingle();
        if (!existingBill) {
          await supabase.from("bills").insert({
            patient_id: consult.patient_id,
            consultation_id: id,
            bill_no: `BILL-${Date.now().toString().slice(-6)}`,
            subtotal: fee,
            tax: Math.round(fee * taxRate * 100) / 100,
            discount: 0,
            total: Math.round(fee * (1 + taxRate) * 100) / 100,
            notes: `Consultation ${consult.consultation_no} - ${consult.chief_complaint || "General"}`,
                hospital_id: hospitalId,
      } as any);
        }
        toast({ title: "Consultation Completed", description: "Bill auto-generated and linked to patient record." });
      }
    } else if (consult?.status === "completed" && updates.status && updates.status !== "completed") {
      toast({ title: "Consultation Reopened" });
    } else {
      toast({ title: "Consultation Updated" });
    }
    
    fetchData();
    if (selectedConsultation?.id === id) {
      setSelectedConsultation(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const completeAndCallNext = async () => {
    if (!selectedConsultation) return;
    if (!window.confirm("Complete this consultation and call the next patient?")) return;
    
    await updateConsultation(selectedConsultation.id, { status: "completed", completed_at: new Date().toISOString() });
    
    const nextPatient = consultations.find(c => c.status === "waiting" && c.id !== selectedConsultation.id);
    if (nextPatient) {
      await updateConsultation(nextPatient.id, { status: "in_progress" });
      setSelectedConsultation({ ...nextPatient, status: "in_progress" });
      toast({ title: "Called Next Patient", description: `${nextPatient.patients?.first_name} ${nextPatient.patients?.last_name} is now active.` });
    } else {
      setSelectedConsultation(null);
      toast({ title: "Queue Empty", description: "No more waiting patients." });
    }
  };

  const requestLabTest = async () => {
    if (!selectedConsultation || !labForm.test_name) return;
    const { error } = await supabase.from("lab_tests").insert({
      consultation_id: selectedConsultation.id,
      patient_id: selectedConsultation.patient_id,
      requested_by: selectedConsultation.doctor_id,
      test_no: `LAB-${Date.now().toString().slice(-6)}`,
      test_name: labForm.test_name,
      test_category: labForm.test_category,
      fee: parseFloat(labForm.fee) || 0,
      notes: labForm.notes || null,
          hospital_id: hospitalId,
    } as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Lab Test Requested" });
    setShowLabRequest(false);
    setLabForm({ test_name: "", test_category: "Blood", fee: "200", notes: "" });
  };

  const createPrescription = async () => {
    if (!selectedConsultation || (prescItems.every(i => !i.medicine_name) && prescServices.length === 0)) return;
    const { data: presc, error } = await supabase.from("prescriptions").insert({
      consultation_id: selectedConsultation.id,
      patient_id: selectedConsultation.patient_id,
      doctor_id: selectedConsultation.doctor_id,
      prescription_no: `RX-${Date.now().toString().slice(-6)}`,
          hospital_id: hospitalId,
    } as any).select().single();
    if (error || !presc) { toast({ title: "Error", description: error?.message || "Failed", variant: "destructive" }); return; }
    const medItems = prescItems.filter(i => i.medicine_name).map(i => ({
      prescription_id: (presc as any).id,
      medicine_name: i.medicine_name,
      medicine_id: (i as any).medicine_id || null,
      dosage: i.dosage,
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
    toast({ title: "Prescription Created" });
    setShowPrescription(false);
    setPrescItems([{ medicine_name: "", dosage: "", frequency: "", duration: "", quantity: "1", instructions: "" }]);
    setPrescServices([]);
  };

  const waiting = consultations.filter(c => c.status === "waiting");
  const inProgress = consultations.filter(c => c.status === "in_progress");
  const completed = consultations.filter(c => c.status === "completed");
  const activeAndQueue = [...inProgress, ...waiting];
  const todayCount = consultations.filter(c => new Date(c.created_at).toDateString() === new Date().toDateString()).length;

  const statusColors: Record<string, string> = {
    waiting: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <AppLayout title="Doctor Dashboard">
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Today's Patients", value: todayCount, icon: Users, color: "text-primary" },
            { label: "Waiting", value: waiting.length, icon: Clock, color: "text-amber-600" },
            { label: "In Progress", value: inProgress.length, icon: Play, color: "text-blue-600" },
            { label: "Completed", value: completed.length, icon: CheckCircle, color: "text-emerald-600" },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-3 p-3 rounded-xl border bg-card">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div><p className="text-lg font-bold">{s.value}</p><p className="text-[11px] text-muted-foreground">{s.label}</p></div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-between items-center gap-2">
          <h2 className="text-sm font-bold">Consultations</h2>
          <div className="flex items-center gap-2">
            <div className="relative max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search patient..." className="pl-8 h-8 text-xs w-48" onChange={e => {
                const q = e.target.value.toLowerCase();
                // Simple client-side filter via CSS class toggle isn't needed — we filter in render
                (window as any).__doctorSearch = q;
                // Force re-render
                setConsultations(prev => [...prev]);
              }} />
            </div>
            <Button size="sm" onClick={() => setShowNew(true)} className="gap-1"><Plus className="h-3.5 w-3.5" /> New Consultation</Button>
          </div>
        </div>

        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Active ({activeAndQueue.length})</TabsTrigger>
            <TabsTrigger value="done">Completed ({completed.length})</TabsTrigger>
          </TabsList>
          {["active", "done"].map(tab => {
            const rawList = tab === "active" ? activeAndQueue : completed;
            const searchQ = ((window as any).__doctorSearch || "").toLowerCase();
            const list = searchQ ? rawList.filter(c => {
              const name = `${c.patients?.first_name || ""} ${c.patients?.last_name || ""}`.toLowerCase();
              return name.includes(searchQ) || (c.patients?.patient_no || "").toLowerCase().includes(searchQ);
            }) : rawList;
            return (
              <TabsContent key={tab} value={tab}>
                {list.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">No consultations</p>
                ) : (
                  <div className="space-y-2">
                    {list.map(c => {
                      const age = calcAge(c.patients?.date_of_birth);
                      const gender = c.patients?.gender ? c.patients.gender.charAt(0).toUpperCase() : "";
                      return (
                      <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setSelectedConsultation(c)}>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {c.patients?.first_name?.[0]}{c.patients?.last_name?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">
                              {c.patients?.first_name} {c.patients?.last_name}
                              {(age || gender) && <span className="ml-2 text-xs font-normal text-muted-foreground">({[gender, age].filter(Boolean).join(", ")})</span>}
                            </p>
                            <p className="text-xs text-muted-foreground">{c.consultation_no} · {c.visit_type} · {c.chief_complaint || "No complaint recorded"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {c.status === "waiting" && <Badge variant="secondary" className="text-[10px]">WAITING</Badge>}
                          {c.status === "in_progress" && <Badge className="text-[10px]">IN PROGRESS</Badge>}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[c.status]}`}>{c.status}</span>
                          <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>

      {/* Consultation Detail */}
      <Dialog open={!!selectedConsultation} onOpenChange={() => setSelectedConsultation(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" /> Consultation — {selectedConsultation?.consultation_no}
            </DialogTitle>
          </DialogHeader>
          {selectedConsultation && (
            <Tabs defaultValue="current" className="mt-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="current">Current Visit</TabsTrigger>
                <TabsTrigger value="history">Patient History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="current" className="space-y-4 mt-4">
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="font-semibold">
                    {selectedConsultation.patients?.first_name} {selectedConsultation.patients?.last_name}
                  {(() => {
                    const a = calcAge(selectedConsultation.patients?.date_of_birth);
                    const g = selectedConsultation.patients?.gender;
                    return (a || g) ? <span className="ml-2 text-sm font-normal text-muted-foreground">({[g, a].filter(Boolean).join(", ")})</span> : null;
                  })()}
                </p>
                <p className="text-xs text-muted-foreground">{selectedConsultation.patients?.patient_no} · DOB: {selectedConsultation.patients?.date_of_birth || "N/A"}</p>
                {selectedConsultation.patients?.allergies && selectedConsultation.patients.allergies.length > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <AlertTriangle className="h-3 w-3 text-destructive" />
                    <span className="text-xs text-destructive font-medium">Allergies: {selectedConsultation.patients.allergies.join(", ")}</span>
                  </div>
                )}
                </div>

                <div className="grid gap-3">
                  <div><Label>Chief Complaint</Label><Input defaultValue={selectedConsultation.chief_complaint || ""} onBlur={e => updateConsultation(selectedConsultation.id, { chief_complaint: e.target.value })} /></div>
                  <div><Label>Symptoms</Label><Textarea defaultValue={selectedConsultation.symptoms || ""} onBlur={e => updateConsultation(selectedConsultation.id, { symptoms: e.target.value })} /></div>
                  <div><Label>Diagnosis</Label><Textarea defaultValue={selectedConsultation.diagnosis || ""} onBlur={e => updateConsultation(selectedConsultation.id, { diagnosis: e.target.value })} /></div>
                  <div><Label>Treatment Plan</Label><Textarea defaultValue={selectedConsultation.treatment_plan || ""} onBlur={e => updateConsultation(selectedConsultation.id, { treatment_plan: e.target.value })} /></div>
                  <div><Label>Doctor Notes</Label><Textarea defaultValue={selectedConsultation.doctor_notes || ""} onBlur={e => updateConsultation(selectedConsultation.id, { doctor_notes: e.target.value })} /></div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowLabRequest(true)}>
                    <FlaskConical className="h-3.5 w-3.5" /> Request Lab Test
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowPrescription(true)}>
                    <Pill className="h-3.5 w-3.5" /> Write Prescription
                  </Button>
                  {selectedConsultation.status !== "completed" && (
                    <>
                      <Button size="sm" className="gap-1" onClick={() => {
                        if (!window.confirm("Complete this consultation now? You can reopen it later if needed.")) return;
                        updateConsultation(selectedConsultation.id, { status: "completed", completed_at: new Date().toISOString() });
                      }}>
                        <CheckCircle className="h-3.5 w-3.5" /> Complete
                      </Button>
                      
                      <Button size="sm" variant="secondary" className="gap-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 border-0" onClick={completeAndCallNext}>
                        <Play className="h-3.5 w-3.5" /> Complete & Call Next
                      </Button>
                    </>
                  )}
                  
                  {selectedConsultation.status === "waiting" && (
                    <Button size="sm" variant="secondary" className="gap-1" onClick={() => updateConsultation(selectedConsultation.id, { status: "in_progress" })}>
                      <Play className="h-3.5 w-3.5" /> Start
                    </Button>
                  )}
                  {selectedConsultation.status === "completed" && (
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => {
                      if (!window.confirm("Reopen this consultation?")) return;
                      updateConsultation(selectedConsultation.id, { status: "in_progress", completed_at: null });
                    }}>
                      <Play className="h-3.5 w-3.5" /> Reopen
                    </Button>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="history" className="mt-4">
                {patientHistory === null ? (
                  <div className="py-8 text-center"><span className="animate-pulse">Loading history...</span></div>
                ) : patientHistory.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">No past visits recorded.</div>
                ) : (
                  <div className="space-y-3">
                    {patientHistory.map((h: any) => (
                      <div key={h.id} className="p-3 border rounded-lg bg-card text-sm">
                        <div className="flex justify-between items-center mb-2">
                          <Badge variant="outline">{new Date(h.created_at).toLocaleDateString()}</Badge>
                          <span className="text-xs text-muted-foreground">Dr. {h.staff?.first_name} {h.staff?.last_name}</span>
                        </div>
                        <p><strong>Complaint:</strong> {h.chief_complaint || "N/A"}</p>
                        <p><strong>Diagnosis:</strong> {h.diagnosis || "N/A"}</p>
                        <p><strong>Treatment:</strong> {h.treatment_plan || "N/A"}</p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* New Consultation */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Consultation</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Patient *</Label>
              <ComboInput
                options={patients.map(p => ({
                  label: `${p.first_name} ${p.last_name} (${p.patient_no})`,
                  value: p.id,
                }))}
                value={consultForm.patientSearch}
                onChange={(v, opt) => {
                  if (opt) {
                    setConsultForm(f => ({ ...f, patientSearch: opt.label, patient_id: opt.value }));
                  } else {
                    setConsultForm(f => ({ ...f, patientSearch: v, patient_id: "" }));
                  }
                }}
                placeholder="Type patient name or number..."
              />
            </div>
            <div>
              <Label>Visit Type</Label>
              <Select value={consultForm.visit_type} onValueChange={v => setConsultForm(f => ({ ...f, visit_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="outpatient">Outpatient</SelectItem>
                  <SelectItem value="inpatient">Inpatient</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2"><Label>Chief Complaint</Label><Input value={consultForm.chief_complaint} onChange={e => setConsultForm(f => ({ ...f, chief_complaint: e.target.value }))} /></div>
            <div className="md:col-span-2 border-t pt-3"><p className="text-xs font-bold text-muted-foreground mb-2">VITALS</p></div>
            <div><Label>Blood Pressure</Label><Input value={consultForm.bp} onChange={e => setConsultForm(f => ({ ...f, bp: e.target.value }))} placeholder="120/80" /></div>
            <div><Label>Pulse (bpm)</Label><Input value={consultForm.pulse} onChange={e => setConsultForm(f => ({ ...f, pulse: e.target.value }))} /></div>
            <div><Label>Temperature (°C)</Label><Input value={consultForm.temp} onChange={e => setConsultForm(f => ({ ...f, temp: e.target.value }))} /></div>
            <div><Label>Weight (kg)</Label><Input value={consultForm.weight} onChange={e => setConsultForm(f => ({ ...f, weight: e.target.value }))} /></div>
            <div><Label>SpO2 (%)</Label><Input value={consultForm.spo2} onChange={e => setConsultForm(f => ({ ...f, spo2: e.target.value }))} /></div>
            <div><Label>Consultation Fee (KES)</Label><Input value={consultForm.consultation_fee} onChange={e => setConsultForm(f => ({ ...f, consultation_fee: e.target.value }))} /></div>
            <div className="md:col-span-2"><Label>Symptoms</Label><Textarea value={consultForm.symptoms} onChange={e => setConsultForm(f => ({ ...f, symptoms: e.target.value }))} /></div>
            <div className="md:col-span-2"><Label>Diagnosis</Label><Textarea value={consultForm.diagnosis} onChange={e => setConsultForm(f => ({ ...f, diagnosis: e.target.value }))} /></div>
            <div className="md:col-span-2"><Label>Treatment Plan</Label><Textarea value={consultForm.treatment_plan} onChange={e => setConsultForm(f => ({ ...f, treatment_plan: e.target.value }))} /></div>
            <div><Label>Follow-up Date</Label><Input type="date" value={consultForm.follow_up_date} onChange={e => setConsultForm(f => ({ ...f, follow_up_date: e.target.value }))} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={createConsultation}>Create Consultation</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lab Request */}
      <Dialog open={showLabRequest} onOpenChange={setShowLabRequest}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Lab Test</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Test Name *</Label><Input value={labForm.test_name} onChange={e => setLabForm(f => ({ ...f, test_name: e.target.value }))} placeholder="e.g. Complete Blood Count" /></div>
            <div>
              <Label>Category</Label>
              <Select value={labForm.test_category} onValueChange={v => setLabForm(f => ({ ...f, test_category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Blood","Urine","Imaging","Microbiology","Chemistry","Pathology","Other"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Fee (KES)</Label><Input value={labForm.fee} onChange={e => setLabForm(f => ({ ...f, fee: e.target.value }))} /></div>
            <div><Label>Notes</Label><Textarea value={labForm.notes} onChange={e => setLabForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowLabRequest(false)}>Cancel</Button>
            <Button onClick={requestLabTest}>Request Test</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Prescription */}
      <Dialog open={showPrescription} onOpenChange={setShowPrescription}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Write Prescription</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {prescItems.map((item, i) => {
              const meds = ((window as any).__doctorMedicines || []) as any[];
              const medOptions = meds.map((m: any) => {
                const parts = [m.name];
                if (m.generic_name) parts.push(m.generic_name);
                if (m.brand) parts.push(m.brand);
                const label = `${parts.join(" | ")} — KES ${m.price} (Stock: ${m.stock})`;
                return { label, value: m.id };
              });
              return (
              <div key={i} className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border rounded-lg">
                <div className="col-span-2 md:col-span-3">
                  <Label className="text-xs">Medicine *</Label>
                  <ComboInput
                    options={medOptions}
                    value={item.medicine_name}
                    onChange={(v, opt) => {
                      const n = [...prescItems];
                      if (opt) {
                        n[i].medicine_name = opt.label;
                        (n[i] as any).medicine_id = opt.value;
                      } else {
                        n[i].medicine_name = v;
                        (n[i] as any).medicine_id = null;
                      }
                      setPrescItems(n);
                    }}
                    placeholder="Search medicine (name, generic, brand)..."
                  />
                </div>
                <div><Label className="text-xs">Dosage</Label><Input value={item.dosage} onChange={e => { const n = [...prescItems]; n[i].dosage = e.target.value; setPrescItems(n); }} placeholder="500mg" /></div>
                <div><Label className="text-xs">Frequency</Label><Input value={item.frequency} onChange={e => { const n = [...prescItems]; n[i].frequency = e.target.value; setPrescItems(n); }} placeholder="3x daily" /></div>
                <div><Label className="text-xs">Duration</Label><Input value={item.duration} onChange={e => { const n = [...prescItems]; n[i].duration = e.target.value; setPrescItems(n); }} placeholder="7 days" /></div>
                <div><Label className="text-xs">Qty</Label><Input value={item.quantity} onChange={e => { const n = [...prescItems]; n[i].quantity = e.target.value; setPrescItems(n); }} /></div>
                <div className="col-span-2"><Label className="text-xs">Instructions</Label><Input value={item.instructions} onChange={e => { const n = [...prescItems]; n[i].instructions = e.target.value; setPrescItems(n); }} placeholder="After meals" /></div>
              </div>
              );
            })}
            <Button variant="outline" size="sm" onClick={() => setPrescItems(p => [...p, { medicine_name: "", dosage: "", frequency: "", duration: "", quantity: "1", instructions: "" }])}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Medicine
            </Button>

            {/* Services Section */}
            <div className="border-t pt-3">
              <div className="flex justify-between items-center mb-2">
                <Label className="text-xs font-bold">🩺 Clinical Services</Label>
                <Button variant="outline" size="sm" onClick={() => setPrescServices(s => [...s, { service_id: "", service_name: "", price: 0 }])}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Service
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
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowPrescription(false)}>Cancel</Button>
            <Button onClick={createPrescription}>Save Prescription</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
