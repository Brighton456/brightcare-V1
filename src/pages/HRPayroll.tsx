import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useState, useEffect } from "react";
import { DollarSign, Users } from "lucide-react";
import { useHospital } from "@/contexts/HospitalContext";

export default function HRPayroll() {
  const { hospitalId } = useHospital();
  const [staff, setStaff] = useState<any[]>([]);
  useEffect(() => { supabase.from("staff").select("*, departments(name)").eq("hospital_id", hospitalId).eq("is_active", true).order("first_name").then(({ data }) => setStaff(data || [])); }, [hospitalId]);

  return (
    <AppLayout title="HR & Payroll">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="pt-4 flex items-center gap-3"><Users className="h-8 w-8 text-primary" /><div><p className="text-2xl font-black">{staff.length}</p><p className="text-xs text-muted-foreground">Active Staff</p></div></CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3"><DollarSign className="h-8 w-8 text-success" /><div><p className="text-2xl font-black">KES {(staff.length * 45000).toLocaleString()}</p><p className="text-xs text-muted-foreground">Est. Monthly Payroll</p></div></CardContent></Card>
        </div>
        <Card><CardHeader><CardTitle>Staff Payroll</CardTitle></CardHeader><CardContent>
          <Table><TableHeader><TableRow><TableHead>Staff#</TableHead><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Department</TableHead><TableHead>Base Salary</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>{staff.map(s => (
              <TableRow key={s.id}><TableCell className="font-mono text-xs">{s.staff_no}</TableCell><TableCell className="font-medium">{s.first_name} {s.last_name}</TableCell><TableCell><Badge variant="secondary">{s.role}</Badge></TableCell><TableCell>{s.departments?.name || "—"}</TableCell><TableCell>KES 45,000</TableCell><TableCell><Badge variant="default">Active</Badge></TableCell></TableRow>
            ))}</TableBody></Table>
        </CardContent></Card>
      </div>
    </AppLayout>
  );
}
