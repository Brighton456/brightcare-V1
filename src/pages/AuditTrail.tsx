import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { DepartmentHeader } from "@/components/DepartmentHeader";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Shield, Clock, Activity } from "lucide-react";
import { format } from "date-fns";
import { useHospital } from "@/contexts/HospitalContext";

export default function AuditTrail() {
  const { hospitalId, loading: hospitalLoading } = useHospital();
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");

  useEffect(() => {
    const fetchLogs = async () => {
      if (hospitalLoading) return;
      if (!hospitalId) {
        setLogs([]);
        return;
      }

      const { data: staffRows } = await supabase.from("staff").select("id").eq("hospital_id", hospitalId);
      const staffIds = (staffRows || []).map((row: any) => row.id).filter(Boolean);

      let query = supabase.from("activity_log").select("*, staff(first_name,last_name)").order("created_at", { ascending: false }).limit(200);
      query = staffIds.length > 0
        ? query.or(`hospital_id.eq.${hospitalId},staff_id.in.(${staffIds.join(",")})`)
        : query.eq("hospital_id", hospitalId);

      const { data } = await query;
      if (data) setLogs(Array.from(new Map(data.map((log: any) => [log.id, log])).values()));
    };

    fetchLogs();
  }, [hospitalId, hospitalLoading]);

  const modules = [...new Set(logs.map(l => l.module).filter(Boolean))];
  const filtered = logs.filter(l => {
    const matchSearch = l.action.toLowerCase().includes(search.toLowerCase()) || (l.details || "").toLowerCase().includes(search.toLowerCase());
    return matchSearch && (moduleFilter === "all" || l.module === moduleFilter);
  });

  return (
    <AppLayout title="Audit Trail">
      <DepartmentHeader department="Administration" title="Comprehensive Audit Trail" subtitle="Track all system activities and changes" quickActions={[{ label: "Admin Panel", path: "/admin" }, { label: "Security", path: "/compliance" }]} />
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="pt-4"><Activity className="h-6 w-6 text-primary mb-1" /><p className="text-2xl font-bold">{logs.length}</p><p className="text-xs text-muted-foreground">Total Logs</p></CardContent></Card>
        <Card><CardContent className="pt-4"><Shield className="h-6 w-6 text-chart-2 mb-1" /><p className="text-2xl font-bold">{modules.length}</p><p className="text-xs text-muted-foreground">Modules Tracked</p></CardContent></Card>
        <Card><CardContent className="pt-4"><Clock className="h-6 w-6 text-chart-3 mb-1" /><p className="text-2xl font-bold">{logs.filter(l => { const d = new Date(l.created_at); const now = new Date(); return now.getTime() - d.getTime() < 86400000; }).length}</p><p className="text-xs text-muted-foreground">Last 24h</p></CardContent></Card>
      </div>
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search actions..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={moduleFilter} onValueChange={setModuleFilter}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Modules</SelectItem>{modules.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
      </div>
      <Card>
        <CardContent className="pt-4">
          <div className="overflow-auto max-h-[500px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card"><tr className="border-b text-left"><th className="p-2">Time</th><th className="p-2">Staff</th><th className="p-2">Module</th><th className="p-2">Action</th><th className="p-2">Details</th></tr></thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.id} className="border-b hover:bg-muted/30">
                    <td className="p-2 text-xs whitespace-nowrap">{l.created_at ? format(new Date(l.created_at), "MMM dd HH:mm") : "-"}</td>
                    <td className="p-2">{l.staff ? `${l.staff.first_name} ${l.staff.last_name}` : "-"}</td>
                    <td className="p-2"><Badge variant="outline" className="text-xs">{l.module || "-"}</Badge></td>
                    <td className="p-2 font-medium">{l.action}</td>
                    <td className="p-2 text-xs text-muted-foreground max-w-xs truncate">{l.details || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
