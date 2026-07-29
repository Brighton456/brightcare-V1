import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useState, useEffect } from "react";
import { Clock, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHospital } from "@/contexts/HospitalContext";

export default function AttendanceTracking() {
  const { hospitalId } = useHospital();
  const [staff, setStaff] = useState<any[]>([]);
  const [checkedIn, setCheckedIn] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => { supabase.from("staff").select("*").eq("hospital_id", hospitalId).eq("is_active", true).order("first_name").then(({ data }) => setStaff(data || [])); }, [hospitalId]);

  const checkIn = (id: string) => { setCheckedIn(prev => new Set([...prev, id])); toast({ title: "Checked in" }); };

  return (
    <AppLayout title="Attendance Tracking">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Staff</p><p className="text-2xl font-black">{staff.length}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Present Today</p><p className="text-2xl font-black text-success">{checkedIn.size}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Absent</p><p className="text-2xl font-black text-destructive">{staff.length - checkedIn.size}</p></CardContent></Card>
        </div>
        <Card><CardHeader><CardTitle>Today's Attendance — {new Date().toLocaleDateString()}</CardTitle></CardHeader><CardContent>
          <Table><TableHeader><TableRow><TableHead>Staff</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
            <TableBody>{staff.map(s => (
              <TableRow key={s.id}><TableCell className="font-medium">{s.first_name} {s.last_name}</TableCell><TableCell><Badge variant="secondary">{s.role}</Badge></TableCell><TableCell>{checkedIn.has(s.id) ? <Badge variant="default"><CheckCircle2 className="h-3 w-3 mr-1" />Present</Badge> : <Badge variant="destructive">Absent</Badge>}</TableCell><TableCell>{!checkedIn.has(s.id) && <Button size="sm" onClick={() => checkIn(s.id)}>Check In</Button>}</TableCell></TableRow>
            ))}</TableBody></Table>
        </CardContent></Card>
      </div>
    </AppLayout>
  );
}
