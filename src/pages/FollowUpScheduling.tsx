import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useState, useEffect } from "react";
import { CalendarCheck, Clock, Bell } from "lucide-react";
import { useHospital } from "@/contexts/HospitalContext";

export default function FollowUpScheduling() {
  const { hospitalId } = useHospital();
  const [followUps, setFollowUps] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("consultations").select("*, patients(first_name,last_name,phone), staff(first_name,last_name)").eq("hospital_id", hospitalId).not("follow_up_date", "is", null).order("follow_up_date", { ascending: true }).then(({ data }) => setFollowUps(data || []));
  }, [hospitalId]);

  const isOverdue = (date: string) => new Date(date) < new Date();
  const isToday = (date: string) => new Date(date).toDateString() === new Date().toDateString();

  return (
    <AppLayout title="Follow-up Scheduling">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="pt-4 flex items-center gap-3"><CalendarCheck className="h-8 w-8 text-primary" /><div><p className="text-2xl font-black">{followUps.filter(f => isToday(f.follow_up_date)).length}</p><p className="text-xs text-muted-foreground">Today</p></div></CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3"><Clock className="h-8 w-8 text-warning" /><div><p className="text-2xl font-black">{followUps.filter(f => isOverdue(f.follow_up_date)).length}</p><p className="text-xs text-muted-foreground">Overdue</p></div></CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3"><Bell className="h-8 w-8 text-success" /><div><p className="text-2xl font-black">{followUps.length}</p><p className="text-xs text-muted-foreground">Total Scheduled</p></div></CardContent></Card>
        </div>
        <Card>
          <CardHeader><CardTitle>Follow-up Appointments</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Patient</TableHead><TableHead>Doctor</TableHead><TableHead>Follow-up Date</TableHead><TableHead>Diagnosis</TableHead><TableHead>Status</TableHead><TableHead>Contact</TableHead></TableRow></TableHeader>
              <TableBody>
                {followUps.map(f => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.patients?.first_name} {f.patients?.last_name}</TableCell>
                    <TableCell>Dr. {f.staff?.first_name}</TableCell>
                    <TableCell className="font-mono text-sm">{f.follow_up_date}</TableCell>
                    <TableCell>{f.diagnosis || "—"}</TableCell>
                    <TableCell><Badge variant={isOverdue(f.follow_up_date) ? "destructive" : isToday(f.follow_up_date) ? "default" : "secondary"}>{isOverdue(f.follow_up_date) ? "Overdue" : isToday(f.follow_up_date) ? "Today" : "Upcoming"}</Badge></TableCell>
                    <TableCell className="text-sm">{f.patients?.phone || "—"}</TableCell>
                  </TableRow>
                ))}
                {followUps.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No follow-ups scheduled</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
