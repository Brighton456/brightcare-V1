import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Calendar, Users } from "lucide-react";

export default function Physiotherapy() {
  return (
    <AppLayout title="Physiotherapy & Rehabilitation">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-4 flex items-center gap-3"><Dumbbell className="h-8 w-8 text-primary" /><div><p className="text-2xl font-black">0</p><p className="text-xs text-muted-foreground">Active Patients</p></div></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Sessions Today</p><p className="text-2xl font-black">0</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Therapists Available</p><p className="text-2xl font-black text-success">2</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Avg Sessions/Patient</p><p className="text-2xl font-black">8</p></CardContent></Card>
        </div>
        <Card><CardHeader><CardTitle>Rehabilitation Programs</CardTitle></CardHeader><CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {["Post-Surgery Rehab", "Stroke Recovery", "Sports Injury", "Chronic Pain", "Pediatric PT", "Occupational Therapy"].map(p => (
              <Card key={p}><CardContent className="pt-4"><p className="font-bold text-sm">{p}</p><p className="text-xs text-muted-foreground mt-1">0 active patients</p></CardContent></Card>
            ))}
          </div>
        </CardContent></Card>
      </div>
    </AppLayout>
  );
}
