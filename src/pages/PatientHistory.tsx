import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useHospital } from "@/contexts/HospitalContext";
import { useState, useEffect } from "react";
import { Search, User, FileText, Pill, FlaskConical } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PatientHistory() {
  const { hospitalId } = useHospital();
  const [patients, setPatients] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [history, setHistory] = useState<{ consultations: any[]; prescriptions: any[]; labs: any[] }>({ consultations: [], prescriptions: [], labs: [] });
  const [search, setSearch] = useState("");

  useEffect(() => { if (hospitalId) supabase.from("patients").select("*").eq("hospital_id", hospitalId).eq("is_active", true).order("first_name").then(({ data }) => setPatients(data || [])); }, [hospitalId]);

  const loadHistory = async (patientId: string) => {
    const [c, p, l] = await Promise.all([
      supabase.from("consultations").select("*, staff(first_name,last_name)").eq("patient_id", patientId).order("created_at", { ascending: false }),
      supabase.from("prescriptions").select("*, prescription_items(*), staff(first_name,last_name)").eq("patient_id", patientId).order("created_at", { ascending: false }),
      supabase.from("lab_tests").select("*").eq("patient_id", patientId).order("requested_at", { ascending: false }),
    ]);
    setHistory({ consultations: c.data || [], prescriptions: p.data || [], labs: l.data || [] });
  };

  const filtered = patients.filter(p => !search || `${p.first_name} ${p.last_name} ${p.patient_no}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppLayout title="Patient History Viewer">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-sm">Patients</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} /></div>
            <div className="space-y-1 max-h-[500px] overflow-auto">
              {filtered.map(p => (
                <button key={p.id} onClick={() => { setSelected(p); loadHistory(p.id); }} className={`w-full text-left p-2 rounded text-sm hover:bg-muted ${selected?.id === p.id ? "bg-muted font-semibold" : ""}`}>
                  <p className="font-medium">{p.first_name} {p.last_name}</p>
                  <p className="text-xs text-muted-foreground">{p.patient_no}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader><CardTitle>{selected ? `${selected.first_name} ${selected.last_name} — Medical History` : "Select a patient"}</CardTitle></CardHeader>
          <CardContent>
            {selected ? (
              <Tabs defaultValue="consultations">
                <TabsList><TabsTrigger value="consultations"><FileText className="h-3 w-3 mr-1" />Consultations ({history.consultations.length})</TabsTrigger><TabsTrigger value="prescriptions"><Pill className="h-3 w-3 mr-1" />Prescriptions ({history.prescriptions.length})</TabsTrigger><TabsTrigger value="labs"><FlaskConical className="h-3 w-3 mr-1" />Lab Tests ({history.labs.length})</TabsTrigger></TabsList>
                <TabsContent value="consultations">
                  <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Doctor</TableHead><TableHead>Complaint</TableHead><TableHead>Diagnosis</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{history.consultations.map(c => <TableRow key={c.id}><TableCell className="text-xs">{new Date(c.created_at).toLocaleDateString()}</TableCell><TableCell>Dr. {c.staff?.first_name}</TableCell><TableCell>{c.chief_complaint || "—"}</TableCell><TableCell>{c.diagnosis || "—"}</TableCell><TableCell><Badge variant="secondary">{c.status}</Badge></TableCell></TableRow>)}</TableBody></Table>
                </TabsContent>
                <TabsContent value="prescriptions">
                  <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Rx#</TableHead><TableHead>Doctor</TableHead><TableHead>Items</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{history.prescriptions.map(p => <TableRow key={p.id}><TableCell className="text-xs">{new Date(p.created_at).toLocaleDateString()}</TableCell><TableCell className="font-mono text-xs">{p.prescription_no}</TableCell><TableCell>Dr. {p.staff?.first_name}</TableCell><TableCell>{p.prescription_items?.length}</TableCell><TableCell><Badge variant="secondary">{p.status}</Badge></TableCell></TableRow>)}</TableBody></Table>
                </TabsContent>
                <TabsContent value="labs">
                  <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Test</TableHead><TableHead>Result</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{history.labs.map(l => <TableRow key={l.id}><TableCell className="text-xs">{new Date(l.requested_at).toLocaleDateString()}</TableCell><TableCell>{l.test_name}</TableCell><TableCell>{l.results || "Pending"}</TableCell><TableCell><Badge variant={l.is_abnormal ? "destructive" : "secondary"}>{l.status}</Badge></TableCell></TableRow>)}</TableBody></Table>
                </TabsContent>
              </Tabs>
            ) : <p className="text-center text-muted-foreground py-12">Select a patient to view history</p>}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
