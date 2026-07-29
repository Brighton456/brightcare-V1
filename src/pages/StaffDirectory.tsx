import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { DepartmentHeader } from "@/components/DepartmentHeader";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Phone, Mail, User } from "lucide-react";
import { useHospital } from "@/contexts/HospitalContext";

export default function StaffDirectory() {
  const { hospitalId } = useHospital();
  const [staff, setStaff] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    supabase.from("staff").select("*, departments(name)").eq("hospital_id", hospitalId).eq("is_active", true).order("first_name").then(({ data }) => { if (data) setStaff(data); });
  }, [hospitalId]);

  const roles = [...new Set(staff.map(s => s.role))];
  const filtered = staff.filter(s => `${s.first_name} ${s.last_name} ${s.email || ""}`.toLowerCase().includes(search.toLowerCase()) && (roleFilter === "all" || s.role === roleFilter));

  return (
    <AppLayout title="Staff Directory">
      <DepartmentHeader department="Administration" title="Staff Directory" subtitle="Quick access to all staff contact information" quickActions={[{ label: "Staff Management", path: "/staff" }, { label: "HR & Payroll", path: "/hr-payroll" }]} />
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={roleFilter} onValueChange={setRoleFilter}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Roles</SelectItem>{roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => (
          <Card key={s.id}>
            <CardContent className="pt-4 flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">{s.first_name[0]}{s.last_name[0]}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{s.first_name} {s.last_name}</p>
                <Badge variant="outline" className="text-xs">{s.role}</Badge>
                {s.phone && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Phone className="h-3 w-3" />{s.phone}</p>}
                {s.email && <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{s.email}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
