import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Phone, Calendar, Users } from "lucide-react";

export default function TelemedicineHub() {
  return (
    <AppLayout title="Telemedicine Hub">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-4 flex items-center gap-3"><Video className="h-8 w-8 text-primary" /><div><p className="text-2xl font-black">0</p><p className="text-xs text-muted-foreground">Active Sessions</p></div></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Today's Appointments</p><p className="text-2xl font-black">0</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Doctors Online</p><p className="text-2xl font-black text-success">0</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Sessions</p><p className="text-2xl font-black">0</p></CardContent></Card>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Video className="h-5 w-5" />Start Consultation</CardTitle></CardHeader><CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Launch a video consultation with a patient</p>
            <Button className="w-full" size="lg"><Video className="h-4 w-4 mr-2" />Start Video Call</Button>
            <Button variant="outline" className="w-full" size="lg"><Phone className="h-4 w-4 mr-2" />Start Audio Call</Button>
          </CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />Upcoming Sessions</CardTitle></CardHeader><CardContent>
            <div className="text-center py-8 text-muted-foreground"><Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>No upcoming telemedicine sessions</p></div>
          </CardContent></Card>
        </div>
      </div>
    </AppLayout>
  );
}
