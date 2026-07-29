import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Scissors, Calendar } from "lucide-react";

export default function SurgeryScheduling() {
  return (
    <AppLayout title="Surgery Scheduling">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Today's Surgeries</p><p className="text-2xl font-black">0</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">This Week</p><p className="text-2xl font-black">0</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">OT Available</p><p className="text-2xl font-black text-success">3</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Pending</p><p className="text-2xl font-black text-warning">0</p></CardContent></Card>
        </div>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Scissors className="h-5 w-5" />Surgery Schedule</CardTitle></CardHeader><CardContent>
          <div className="text-center text-muted-foreground py-12">
            <Scissors className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No surgeries scheduled. Use the Doctor Console to schedule procedures.</p>
          </div>
        </CardContent></Card>
      </div>
    </AppLayout>
  );
}
