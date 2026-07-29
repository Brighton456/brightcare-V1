import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useHospital } from "@/contexts/HospitalContext";
import { useState, useEffect } from "react";
import { FileText, Search, Archive } from "lucide-react";

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

export default function MedicalRecords() {
  const { hospitalId } = useHospital();
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => { if (hospitalId) supabase.from("patients").select("*").eq("hospital_id", hospitalId).order("created_at", { ascending: false }).then(({ data }) => setPatients(data || [])); }, [hospitalId]);

  const filtered = patients.filter(p => !search || `${p.first_name} ${p.last_name} ${p.patient_no}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppLayout title="Medical Records & Archives">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="pt-4 flex items-center gap-3"><Archive className="h-8 w-8 text-primary" /><div><p className="text-2xl font-black">{patients.length}</p><p className="text-xs text-muted-foreground">Total Records</p></div></CardContent></Card>
        </div>
        <div className="relative max-w-md"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search patient records..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Patient Records</CardTitle></CardHeader><CardContent>
          <Table><TableHeader><TableRow><TableHead>Patient#</TableHead><TableHead>Name</TableHead><TableHead>Age</TableHead><TableHead>Gender</TableHead><TableHead>Blood Type</TableHead><TableHead>Insurance</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>{filtered.slice(0, 50).map(p => (
              <TableRow key={p.id}><TableCell className="font-mono text-xs">{p.patient_no}</TableCell><TableCell className="font-medium">{p.first_name} {p.last_name}</TableCell><TableCell className="text-xs">{calcAge(p.date_of_birth) || "—"}</TableCell><TableCell>{p.gender || "—"}</TableCell><TableCell>{p.blood_type || "—"}</TableCell><TableCell>{p.insurance_provider || "None"}</TableCell><TableCell><Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "Active" : "Inactive"}</Badge></TableCell></TableRow>
            ))}</TableBody></Table>
        </CardContent></Card>
      </div>
    </AppLayout>
  );
}
