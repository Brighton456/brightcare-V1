import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useHospital } from "@/contexts/HospitalContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { WorkflowSuggestions } from "@/components/WorkflowSuggestions";
import { toast } from "@/hooks/use-toast";
import { useOfflineMutation, useOfflineQuery } from "@/hooks/useOfflineQuery";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import {
  Search, UserPlus, Phone, Mail, Shield, Heart, AlertTriangle,
  Calendar, Clock, FileText, ChevronRight, Eye, Edit, User, Trash2,
} from "lucide-react";

interface Patient {
  id: string;
  patient_no: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  id_number: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  blood_type: string | null;
  allergies: string[] | null;
  chronic_conditions: string[] | null;
  insurance_provider: string | null;
  insurance_number: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

const calcAge = (dob: string | null | undefined): string => {
  if (!dob) return "";
  const birth = new Date(dob);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) years--;
  if (years < 1) {
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth();
    return months <= 0 ? "Newborn" : `${months}mo`;
  }
  return `${years}y`;
};

const emptyPatient = {
  first_name: "", last_name: "", date_of_birth: "", gender: "",
  phone: "", age: "", id_number: "", address: "",
  emergency_contact_name: "", emergency_contact_phone: "",
  blood_type: "", allergies: "", chronic_conditions: "",
  insurance_provider: "", insurance_number: "", notes: "",
};

export default function Patients() {
  const { hospitalId } = useHospital();
  const isAdmin = useIsAdmin();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showView, setShowView] = useState<Patient | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [form, setForm] = useState(emptyPatient);
  const { data: patients, loading, refetch: fetchPatients } = useOfflineQuery<Patient>({
    table: "patients",
    hospitalId,
    orderBy: "created_at",
    ascending: false,
  });
  const { mutate: mutatePatient } = useOfflineMutation("patients");

  const generatePatientNo = () => `PT-${Date.now().toString().slice(-6)}`;

  const ageToApproxDob = (age: string): string | null => {
    if (!age) return null;
    const now = new Date();
    const lower = age.toLowerCase().trim();
    const num = parseInt(lower);
    if (isNaN(num)) return null;
    if (lower.includes("d")) { now.setDate(now.getDate() - num); }
    else if (lower.includes("mo") || lower.includes("m")) { now.setMonth(now.getMonth() - num); }
    else { now.setFullYear(now.getFullYear() - num); }
    return now.toISOString().split("T")[0];
  };

  const handleSave = async () => {
    if (!form.first_name || !form.last_name) {
      toast({ title: "Error", description: "First and last name are required", variant: "destructive" });
      return;
    }
    const payload = {
      first_name: form.first_name,
      last_name: form.last_name,
      date_of_birth: ageToApproxDob(form.age),
      gender: form.gender || null,
      phone: form.phone || null,
      email: null,
      id_number: form.id_number || null,
      address: form.address || null,
      emergency_contact_name: form.emergency_contact_name || null,
      emergency_contact_phone: form.emergency_contact_phone || null,
      blood_type: form.blood_type || null,
      allergies: form.allergies ? form.allergies.split(",").map(s => s.trim()) : [],
      chronic_conditions: form.chronic_conditions ? form.chronic_conditions.split(",").map(s => s.trim()) : [],
      insurance_provider: form.insurance_provider || null,
      insurance_number: form.insurance_number || null,
      notes: form.notes || null,
    };

    if (editingId) {
      const { error } = await mutatePatient("update", { id: editingId, ...payload }, () =>
        Promise.resolve(supabase.from("patients").update(payload as any).eq("id", editingId))
      );
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Patient Updated" });
    } else {
      const insertPayload = { id: crypto.randomUUID(), ...payload, patient_no: generatePatientNo(), hospital_id: hospitalId } as any;
      const { error } = await mutatePatient("insert", insertPayload, () =>
        Promise.resolve(supabase.from("patients").insert(insertPayload))
      );
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Patient Registered" });
    }
    setShowAdd(false);
    setEditingId(null);
    setForm(emptyPatient);
    fetchPatients();
  };

  const openEdit = (p: Patient) => {
    setEditingId(p.id);
    setForm({
      first_name: p.first_name, last_name: p.last_name,
      date_of_birth: "", gender: p.gender || "",
      phone: p.phone || "", age: calcAge(p.date_of_birth) || "",
      id_number: p.id_number || "", address: p.address || "",
      emergency_contact_name: p.emergency_contact_name || "",
      emergency_contact_phone: p.emergency_contact_phone || "",
      blood_type: p.blood_type || "",
      allergies: (p.allergies || []).join(", "),
      chronic_conditions: (p.chronic_conditions || []).join(", "),
      insurance_provider: p.insurance_provider || "",
      insurance_number: p.insurance_number || "",
      notes: p.notes || "",
    });
    setShowAdd(true);
  };

  const filtered = patients.filter(p => {
    const q = search.toLowerCase();
    return p.first_name.toLowerCase().includes(q) || p.last_name.toLowerCase().includes(q) ||
      p.patient_no.toLowerCase().includes(q) || (p.phone || "").includes(q) || (p.id_number || "").includes(q);
  });

  return (
    <AppLayout title="Patient Management">
      <div className="space-y-4">
        <WorkflowSuggestions context="patient-registered" title="Quick Actions" />
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Register, search, and manage patient records</p>
          </div>
          <Button onClick={() => { setForm(emptyPatient); setEditingId(null); setShowAdd(true); }} className="gap-2">
            <UserPlus className="h-4 w-4" /> Register Patient
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, phone, ID, patient number..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Patients", value: patients.length, icon: User, color: "text-primary" },
            { label: "Registered Today", value: patients.filter(p => new Date(p.created_at).toDateString() === new Date().toDateString()).length, icon: UserPlus, color: "text-emerald-600" },
            { label: "With Insurance", value: patients.filter(p => p.insurance_provider).length, icon: Shield, color: "text-blue-600" },
            { label: "With Allergies", value: patients.filter(p => p.allergies && p.allergies.length > 0).length, icon: AlertTriangle, color: "text-amber-600" },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-3 p-3 rounded-xl border bg-card">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div>
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Patient List */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold">Patient</th>
                  <th className="text-left p-3 font-semibold hidden md:table-cell">Contact</th>
                  <th className="text-left p-3 font-semibold hidden lg:table-cell">Insurance</th>
                  <th className="text-left p-3 font-semibold hidden lg:table-cell">Blood</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-right p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading patients...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No patients found. Register your first patient.</td></tr>
                ) : filtered.map(p => (
                  <tr key={p.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {p.first_name[0]}{p.last_name[0]}
                        </div>
                        <div>
                          <p className="font-semibold">{p.first_name} {p.last_name} {calcAge(p.date_of_birth) && <span className="text-xs font-normal text-muted-foreground">({calcAge(p.date_of_birth)})</span>}</p>
                          <p className="text-xs text-muted-foreground">{p.patient_no} · {p.gender || "N/A"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <p className="text-xs">{p.phone || "—"}</p>
                      <p className="text-xs text-muted-foreground">Age: {calcAge(p.date_of_birth) || "—"}</p>
                    </td>
                    <td className="p-3 hidden lg:table-cell text-xs">{p.insurance_provider || "None"}</td>
                    <td className="p-3 hidden lg:table-cell">
                      {p.blood_type ? <Badge variant="outline" className="text-xs">{p.blood_type}</Badge> : "—"}
                    </td>
                    <td className="p-3">
                      <Badge variant={p.is_active ? "default" : "secondary"} className="text-xs">
                        {p.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowView(p)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        {isAdmin && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteTarget({ id: p.id, name: `${p.first_name} ${p.last_name}` })}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Patient" : "Register New Patient"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>First Name *</Label><Input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} /></div>
            <div><Label>Last Name *</Label><Input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} /></div>
            <div><Label>Age *</Label><Input value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} placeholder="e.g. 34y, 6mo, 2d" /></div>
            <div>
              <Label>Gender</Label>
              <Select value={form.gender} onValueChange={v => setForm(f => ({ ...f, gender: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div><Label>ID Number</Label><Input value={form.id_number} onChange={e => setForm(f => ({ ...f, id_number: e.target.value }))} /></div>
            <div>
              <Label>Blood Type</Label>
              <Select value={form.blood_type} onValueChange={v => setForm(f => ({ ...f, blood_type: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2"><Label>Address</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
            <div><Label>Emergency Contact Name</Label><Input value={form.emergency_contact_name} onChange={e => setForm(f => ({ ...f, emergency_contact_name: e.target.value }))} /></div>
            <div><Label>Emergency Contact Phone</Label><Input value={form.emergency_contact_phone} onChange={e => setForm(f => ({ ...f, emergency_contact_phone: e.target.value }))} /></div>
            <div><Label>Insurance Provider</Label><Input value={form.insurance_provider} onChange={e => setForm(f => ({ ...f, insurance_provider: e.target.value }))} /></div>
            <div><Label>Insurance Number</Label><Input value={form.insurance_number} onChange={e => setForm(f => ({ ...f, insurance_number: e.target.value }))} /></div>
            <div className="md:col-span-2"><Label>Allergies (comma-separated)</Label><Input value={form.allergies} onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))} placeholder="e.g. Penicillin, Aspirin" /></div>
            <div className="md:col-span-2"><Label>Chronic Conditions (comma-separated)</Label><Input value={form.chronic_conditions} onChange={e => setForm(f => ({ ...f, chronic_conditions: e.target.value }))} placeholder="e.g. Diabetes, Hypertension" /></div>
            <div className="md:col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingId ? "Update" : "Register"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Patient Dialog */}
      <Dialog open={!!showView} onOpenChange={() => setShowView(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
          </DialogHeader>
          {showView && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                  {showView.first_name[0]}{showView.last_name[0]}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{showView.first_name} {showView.last_name}</h3>
                  <p className="text-sm text-muted-foreground">{showView.patient_no} · {showView.gender || "N/A"} · {calcAge(showView.date_of_birth) || "Age N/A"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Phone:</span> {showView.phone || "—"}</div>
                <div><span className="text-muted-foreground">Age:</span> {calcAge(showView.date_of_birth) || "—"}</div>
                <div><span className="text-muted-foreground">Age:</span> {calcAge(showView.date_of_birth) || "—"}</div>
                <div><span className="text-muted-foreground">Blood Type:</span> {showView.blood_type || "—"}</div>
                <div><span className="text-muted-foreground">ID Number:</span> {showView.id_number || "—"}</div>
                <div><span className="text-muted-foreground">Insurance:</span> {showView.insurance_provider || "None"}</div>
              </div>
              {showView.allergies && showView.allergies.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-destructive flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Allergies</p>
                  <div className="flex flex-wrap gap-1 mt-1">{showView.allergies.map(a => <Badge key={a} variant="destructive" className="text-xs">{a}</Badge>)}</div>
                </div>
              )}
              {showView.chronic_conditions && showView.chronic_conditions.length > 0 && (
                <div>
                  <p className="text-sm font-semibold flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> Chronic Conditions</p>
                  <div className="flex flex-wrap gap-1 mt-1">{showView.chronic_conditions.map(c => <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>)}</div>
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Registered: {new Date(showView.created_at).toLocaleDateString()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await supabase.from("patients").update({ is_active: false } as any).eq("id", deleteTarget.id);
          toast({ title: "Patient deactivated" });
          setDeleteTarget(null);
          fetchPatients();
        }}
        itemName={deleteTarget?.name || ""}
      />
    </AppLayout>
  );
}
