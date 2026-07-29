import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useState, useEffect } from "react";
import { Activity, Save, Thermometer, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHospital } from "@/contexts/HospitalContext";

export default function VitalsRecording() {
  const { hospitalId } = useHospital();
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [admissionId, setAdmissionId] = useState("");
  const [vitals, setVitals] = useState({ temperature: "", pulse: "", blood_pressure: "", respiratory_rate: "", spo2: "", weight: "", height: "", blood_sugar: "", pain_level: "" });
  const { toast } = useToast();

  useEffect(() => {
    supabase.from("admissions").select("*, patients(first_name,last_name,patient_no,id)").eq("hospital_id", hospitalId).eq("status", "admitted").then(({ data }) => setAdmissions(data || []));
  }, [hospitalId]);

  const save = async () => {
    const adm = admissions.find(a => a.id === admissionId);
    if (!adm) return;
    await supabase.from("vitals_records").insert({
      admission_id: admissionId, patient_id: adm.patient_id,
      temperature: vitals.temperature ? +vitals.temperature : null, pulse: vitals.pulse ? +vitals.pulse : null,
      blood_pressure: vitals.blood_pressure || null, respiratory_rate: vitals.respiratory_rate ? +vitals.respiratory_rate : null,
      spo2: vitals.spo2 ? +vitals.spo2 : null, weight: vitals.weight ? +vitals.weight : null,
      height: vitals.height ? +vitals.height : null, blood_sugar: vitals.blood_sugar ? +vitals.blood_sugar : null,
      pain_level: vitals.pain_level ? +vitals.pain_level : null,
          hospital_id: hospitalId,
    });
    toast({ title: "Vitals recorded" });
    setVitals({ temperature: "", pulse: "", blood_pressure: "", respiratory_rate: "", spo2: "", weight: "", height: "", blood_sugar: "", pain_level: "" });
  };

  return (
    <AppLayout title="Vital Signs Recording">
      <div className="max-w-2xl space-y-6">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Record Vital Signs</CardTitle></CardHeader><CardContent className="space-y-4">
          <div><Label>Patient (Admitted)</Label><Select value={admissionId} onValueChange={setAdmissionId}><SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger><SelectContent>{admissions.map(a => <SelectItem key={a.id} value={a.id}>{a.patients?.first_name} {a.patients?.last_name} ({a.admission_no})</SelectItem>)}</SelectContent></Select></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><Label className="flex items-center gap-1"><Thermometer className="h-3 w-3" />Temperature (°C)</Label><Input value={vitals.temperature} onChange={e => setVitals({ ...vitals, temperature: e.target.value })} placeholder="36.5" /></div>
            <div><Label className="flex items-center gap-1"><Heart className="h-3 w-3" />Pulse (bpm)</Label><Input value={vitals.pulse} onChange={e => setVitals({ ...vitals, pulse: e.target.value })} placeholder="72" /></div>
            <div><Label>Blood Pressure</Label><Input value={vitals.blood_pressure} onChange={e => setVitals({ ...vitals, blood_pressure: e.target.value })} placeholder="120/80" /></div>
            <div><Label>Resp. Rate (/min)</Label><Input value={vitals.respiratory_rate} onChange={e => setVitals({ ...vitals, respiratory_rate: e.target.value })} placeholder="16" /></div>
            <div><Label>SpO2 (%)</Label><Input value={vitals.spo2} onChange={e => setVitals({ ...vitals, spo2: e.target.value })} placeholder="98" /></div>
            <div><Label>Weight (kg)</Label><Input value={vitals.weight} onChange={e => setVitals({ ...vitals, weight: e.target.value })} placeholder="70" /></div>
            <div><Label>Height (cm)</Label><Input value={vitals.height} onChange={e => setVitals({ ...vitals, height: e.target.value })} placeholder="170" /></div>
            <div><Label>Blood Sugar</Label><Input value={vitals.blood_sugar} onChange={e => setVitals({ ...vitals, blood_sugar: e.target.value })} placeholder="5.5" /></div>
            <div><Label>Pain Level (0-10)</Label><Input value={vitals.pain_level} onChange={e => setVitals({ ...vitals, pain_level: e.target.value })} placeholder="3" /></div>
          </div>
          <Button onClick={save} className="w-full" disabled={!admissionId}><Save className="h-4 w-4 mr-2" />Record Vitals</Button>
        </CardContent></Card>
      </div>
    </AppLayout>
  );
}
