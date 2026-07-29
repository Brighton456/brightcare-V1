import { useState, useEffect } from "react";
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
import { toast } from "@/hooks/use-toast";
import { Calendar, Clock, Plus, CheckCircle, XCircle, User, Search } from "lucide-react";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  reason: string | null;
  notes: string | null;
  created_at: string;
  patients?: { first_name: string; last_name: string; patient_no: string };
  staff?: { first_name: string; last_name: string };
}

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ patient_id: "", doctor_id: "", date: "", time: "", reason: "", notes: "" });

  const { hospitalId } = useHospital();

  const fetchData = async () => {
    if (!hospitalId) return;
    const [aRes, pRes, dRes] = await Promise.all([
      supabase.from("appointments").select("*, patients(first_name,last_name,patient_no), staff(first_name,last_name)").eq("hospital_id", hospitalId).order("appointment_date", { ascending: true }),
      supabase.from("patients").select("id,first_name,last_name,patient_no").eq("hospital_id", hospitalId).order("first_name"),
      supabase.from("staff").select("id,first_name,last_name").eq("hospital_id", hospitalId).eq("role", "doctor"),
    ]);
    if (aRes.data) setAppointments(aRes.data as unknown as Appointment[]);
    if (pRes.data) setPatients(pRes.data as any[]);
    if (dRes.data) setDoctors(dRes.data as any[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [hospitalId]);

  const createAppointment = async () => {
    if (!form.patient_id || !form.doctor_id || !form.date || !form.time) {
      toast({ title: "Error", description: "Fill all required fields", variant: "destructive" }); return;
    }
    const { error } = await supabase.from("appointments").insert({
      patient_id: form.patient_id, doctor_id: form.doctor_id,
      appointment_date: form.date, appointment_time: form.time,
      reason: form.reason || null, notes: form.notes || null,
          hospital_id: hospitalId,
    } as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Appointment Scheduled" });
    setShowNew(false);
    setForm({ patient_id: "", doctor_id: "", date: "", time: "", reason: "", notes: "" });
    fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("appointments").update({ status } as any).eq("id", id);
    toast({ title: `Appointment ${status}` });
    fetchData();
  };

  const statusColors: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    confirmed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    checked_in: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    no_show: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  };

  const today = new Date().toISOString().split("T")[0];
  const todayAppts = appointments.filter(a => a.appointment_date === today);

  return (
    <AppLayout title="Appointments">
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Today", value: todayAppts.length, icon: Calendar, color: "text-primary" },
            { label: "Scheduled", value: appointments.filter(a => a.status === "scheduled").length, icon: Clock, color: "text-blue-600" },
            { label: "Completed", value: appointments.filter(a => a.status === "completed").length, icon: CheckCircle, color: "text-emerald-600" },
            { label: "No Show", value: appointments.filter(a => a.status === "no_show").length, icon: XCircle, color: "text-destructive" },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-3 p-3 rounded-xl border bg-card">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div><p className="text-lg font-bold">{s.value}</p><p className="text-[11px] text-muted-foreground">{s.label}</p></div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search appointments..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Button onClick={() => setShowNew(true)} className="gap-2"><Plus className="h-4 w-4" /> Schedule Appointment</Button>
        </div>

        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-semibold">Patient</th>
                <th className="text-left p-3 font-semibold">Doctor</th>
                <th className="text-left p-3 font-semibold">Date & Time</th>
                <th className="text-left p-3 font-semibold hidden md:table-cell">Reason</th>
                <th className="text-left p-3 font-semibold">Status</th>
                <th className="text-right p-3 font-semibold">Actions</th>
              </tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : appointments.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No appointments</td></tr>
                ) : appointments.map(a => (
                  <tr key={a.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 text-xs font-semibold">{a.patients?.first_name} {a.patients?.last_name}</td>
                    <td className="p-3 text-xs">Dr. {a.staff?.first_name} {a.staff?.last_name}</td>
                    <td className="p-3 text-xs">{a.appointment_date} at {a.appointment_time}</td>
                    <td className="p-3 text-xs hidden md:table-cell">{a.reason || "—"}</td>
                    <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[a.status] || ""}`}>{a.status.replace("_", " ")}</span></td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {a.status === "scheduled" && <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStatus(a.id, "checked_in")}>Check In</Button>}
                        {a.status === "checked_in" && <Button size="sm" className="text-xs h-7" onClick={() => updateStatus(a.id, "completed")}>Complete</Button>}
                        {["scheduled", "confirmed"].includes(a.status) && <Button size="sm" variant="ghost" className="text-xs h-7 text-destructive" onClick={() => updateStatus(a.id, "cancelled")}>Cancel</Button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Schedule Appointment</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Patient *</Label>
              <Select value={form.patient_id} onValueChange={v => setForm(f => ({ ...f, patient_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Doctor *</Label>
              <Select value={form.doctor_id} onValueChange={v => setForm(f => ({ ...f, doctor_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                <SelectContent>{doctors.map(d => <SelectItem key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Date *</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
            <div><Label>Time *</Label><Input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} /></div>
            <div><Label>Reason</Label><Input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} /></div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={createAppointment}>Schedule</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
