import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { DepartmentHeader } from "@/components/DepartmentHeader";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRightLeft, Search, Plus, UserPlus } from "lucide-react";
import { useHospital } from "@/contexts/HospitalContext";

export default function ReferralManagement() {
  const { hospitalId } = useHospital();
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.from("patients").select("*").eq("hospital_id", hospitalId).order("created_at", { ascending: false }).limit(50).then(({ data }) => { if (data) setPatients(data); });
  }, [hospitalId]);

  const filtered = patients.filter(p => `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppLayout title="Referral Management">
      <DepartmentHeader department="Doctor & Consultation" title="Referral Management" subtitle="Track and manage patient referrals across departments and external facilities" quickActions={[{ label: "Patient Queue", path: "/patient-queue" }]} />
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search patients..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
        <Button><Plus className="h-4 w-4 mr-1" /> New Referral</Button>
      </div>
      <div className="grid gap-3">
        {filtered.map(p => (
          <Card key={p.id}>
            <CardContent className="pt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><UserPlus className="h-5 w-5 text-primary" /></div>
                <div><p className="font-medium">{p.first_name} {p.last_name}</p><p className="text-xs text-muted-foreground">{p.patient_no}</p></div>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">Internal</Badge>
                <Button size="sm" variant="outline"><ArrowRightLeft className="h-3 w-3 mr-1" /> Refer</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
