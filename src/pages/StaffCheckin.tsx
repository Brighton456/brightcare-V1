import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { toast } from "@/hooks/use-toast";
import { UserCheck, UserX, Clock, Users, Calendar } from "lucide-react";
import { useHospital } from "@/contexts/HospitalContext";

export default function StaffCheckin() {
  const { hospitalId } = useHospital();
  const [staff, setStaff] = useState<any[]>([]);
  const [checkins, setCheckins] = useState<any[]>([]);
  const today = new Date().toISOString().split("T")[0];

  const fetchData = async () => {
    const [sRes, cRes] = await Promise.all([
      supabase.from("staff").select("id,first_name,last_name,role").eq("hospital_id", hospitalId).eq("is_active", true).order("first_name"),
      supabase.from("staff_checkins").select("*").eq("hospital_id", hospitalId).eq("date", today),
    ]);
    if (sRes.data) setStaff(sRes.data as any[]);
    if (cRes.data) setCheckins(cRes.data as any[]);
  };

  useEffect(() => { fetchData(); }, [hospitalId]);

  const checkIn = async (staffId: string) => {
    const existing = checkins.find((c: any) => c.staff_id === staffId);
    if (existing) { toast({ title: "Already checked in today" }); return; }
    const { error } = await supabase.from("staff_checkins").insert({
      staff_id: staffId, date: today, status: "checked_in",
          hospital_id: hospitalId,
    } as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Checked In" });
    fetchData();
  };

  const checkOut = async (staffId: string) => {
    const existing = checkins.find((c: any) => c.staff_id === staffId);
    if (!existing) return;
    await supabase.from("staff_checkins").update({
      check_out_time: new Date().toISOString(), status: "checked_out",
    } as any).eq("id", existing.id);
    toast({ title: "Checked Out" });
    fetchData();
  };

  const checkedInCount = checkins.filter((c: any) => c.status === "checked_in").length;

  return (
    <AppLayout title="Staff Check-In">
      <div className="space-y-4 max-w-4xl">
        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="p-4 text-center"><Users className="h-5 w-5 mx-auto text-primary mb-1" /><p className="text-2xl font-bold">{staff.length}</p><p className="text-xs text-muted-foreground">Total Staff</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><UserCheck className="h-5 w-5 mx-auto text-success mb-1" /><p className="text-2xl font-bold text-success">{checkedInCount}</p><p className="text-xs text-muted-foreground">Present Today</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><UserX className="h-5 w-5 mx-auto text-destructive mb-1" /><p className="text-2xl font-bold text-destructive">{staff.length - checkedInCount}</p><p className="text-xs text-muted-foreground">Absent</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4" />Today — {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-semibold text-xs">Staff</th>
                <th className="text-left p-3 font-semibold text-xs">Role</th>
                <th className="text-left p-3 font-semibold text-xs">Status</th>
                <th className="text-left p-3 font-semibold text-xs">Check In</th>
                <th className="text-left p-3 font-semibold text-xs">Check Out</th>
                <th className="text-right p-3 font-semibold text-xs">Action</th>
              </tr></thead>
              <tbody>
                {staff.map((s: any) => {
                  const ci = checkins.find((c: any) => c.staff_id === s.id);
                  return (
                    <tr key={s.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-semibold text-xs">{s.first_name} {s.last_name}</td>
                      <td className="p-3 text-xs capitalize">{s.role?.replace("_", " ")}</td>
                      <td className="p-3">
                        {ci ? (
                          <Badge className={ci.status === "checked_in" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-blue-100 text-blue-800"} variant="secondary">
                            {ci.status === "checked_in" ? "Present" : "Left"}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Absent</Badge>
                        )}
                      </td>
                      <td className="p-3 text-xs">{ci ? new Date(ci.check_in_time).toLocaleTimeString() : "—"}</td>
                      <td className="p-3 text-xs">{ci?.check_out_time ? new Date(ci.check_out_time).toLocaleTimeString() : "—"}</td>
                      <td className="p-3 text-right">
                        {!ci ? (
                          <Button size="sm" className="h-7 text-xs gap-1" onClick={() => checkIn(s.id)}>
                            <UserCheck className="h-3 w-3" /> Check In
                          </Button>
                        ) : ci.status === "checked_in" ? (
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => checkOut(s.id)}>
                            <UserX className="h-3 w-3" /> Check Out
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
