import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useState, useEffect } from "react";
import { Stethoscope, Plus, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHospital } from "@/contexts/HospitalContext";

export default function NurseConsole() {
  const { hospitalId } = useHospital();
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [selectedAdmission, setSelectedAdmission] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState("general");
  const [shift, setShift] = useState("day");
  const { toast } = useToast();

  useEffect(() => {
    supabase.from("admissions").select("*, patients(first_name,last_name,patient_no)").eq("hospital_id", hospitalId).eq("status", "admitted").then(({ data }) => setAdmissions(data || []));
  }, [hospitalId]);

  useEffect(() => {
    if (selectedAdmission) {
      supabase.from("nursing_notes").select("*").eq("hospital_id", hospitalId).eq("admission_id", selectedAdmission).order("created_at", { ascending: false }).then(({ data }) => setNotes(data || []));
    }
  }, [selectedAdmission]);

  const addNote = async () => {
    if (!selectedAdmission || !noteContent) return;
    await supabase.from("nursing_notes").insert({ admission_id: selectedAdmission, content: noteContent, note_type: noteType, shift , hospital_id: hospitalId });
    toast({ title: "Nursing note added" });
    setNoteContent("");
    supabase.from("nursing_notes").select("*").eq("hospital_id", hospitalId).eq("admission_id", selectedAdmission).order("created_at", { ascending: false }).then(({ data }) => setNotes(data || []));
  };

  return (
    <AppLayout title="Nurse Console">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card><CardHeader><CardTitle className="text-sm">Admitted Patients</CardTitle></CardHeader><CardContent>
          <div className="space-y-1 max-h-[500px] overflow-auto">
            {admissions.map(a => (
              <button key={a.id} onClick={() => setSelectedAdmission(a.id)} className={`w-full text-left p-2 rounded text-sm hover:bg-muted ${selectedAdmission === a.id ? "bg-muted font-semibold" : ""}`}>
                <p className="font-medium">{a.patients?.first_name} {a.patients?.last_name}</p>
                <p className="text-xs text-muted-foreground">{a.admission_no} • Bed: {a.bed_id ? "Assigned" : "Unassigned"}</p>
              </button>
            ))}
            {admissions.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No admitted patients</p>}
          </div>
        </CardContent></Card>
        <Card className="lg:col-span-2"><CardHeader><CardTitle className="flex items-center gap-2"><Stethoscope className="h-5 w-5" />Nursing Notes</CardTitle></CardHeader><CardContent className="space-y-4">
          {selectedAdmission ? (<>
            <div className="grid grid-cols-2 gap-3">
              <Select value={noteType} onValueChange={setNoteType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="general">General</SelectItem><SelectItem value="medication">Medication</SelectItem><SelectItem value="vitals">Vitals</SelectItem><SelectItem value="observation">Observation</SelectItem><SelectItem value="handover">Handover</SelectItem></SelectContent></Select>
              <Select value={shift} onValueChange={setShift}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="day">Day Shift</SelectItem><SelectItem value="night">Night Shift</SelectItem><SelectItem value="evening">Evening Shift</SelectItem></SelectContent></Select>
            </div>
            <Textarea value={noteContent} onChange={e => setNoteContent(e.target.value)} placeholder="Enter nursing note..." rows={3} />
            <Button onClick={addNote}><Save className="h-4 w-4 mr-2" />Add Note</Button>
            <div className="space-y-2 max-h-64 overflow-auto">{notes.map(n => (
              <div key={n.id} className="p-3 bg-muted rounded-lg"><div className="flex items-center gap-2 mb-1"><Badge variant="secondary">{n.note_type}</Badge><Badge variant="outline">{n.shift}</Badge><span className="text-xs text-muted-foreground ml-auto">{new Date(n.created_at).toLocaleString()}</span></div><p className="text-sm">{n.content}</p></div>
            ))}</div>
          </>) : <p className="text-center text-muted-foreground py-12">Select a patient</p>}
        </CardContent></Card>
      </div>
    </AppLayout>
  );
}
