import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Siren, Clock, Users } from "lucide-react";

export default function Emergency() {
  return (
    <AppLayout title="Emergency Department">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-destructive bg-destructive/5"><CardContent className="pt-4 flex items-center gap-3"><Siren className="h-8 w-8 text-destructive" /><div><p className="text-2xl font-black text-destructive">0</p><p className="text-xs text-muted-foreground">Active Emergencies</p></div></CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3"><Clock className="h-8 w-8 text-warning" /><div><p className="text-2xl font-black">0</p><p className="text-xs text-muted-foreground">Avg Wait Time</p></div></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Today's Cases</p><p className="text-2xl font-black">0</p></CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3"><Users className="h-8 w-8 text-primary" /><div><p className="text-2xl font-black">5</p><p className="text-xs text-muted-foreground">ER Staff On Duty</p></div></CardContent></Card>
        </div>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" />Emergency Triage</CardTitle></CardHeader><CardContent>
          <div className="grid grid-cols-5 gap-3 mb-6">
            {[{ label: "Resuscitation", color: "bg-red-600", count: 0 }, { label: "Emergency", color: "bg-orange-500", count: 0 }, { label: "Urgent", color: "bg-yellow-500", count: 0 }, { label: "Semi-Urgent", color: "bg-green-500", count: 0 }, { label: "Non-Urgent", color: "bg-blue-500", count: 0 }].map(t => (
              <div key={t.label} className="text-center">
                <div className={`${t.color} text-white rounded-lg p-3 mb-1`}><p className="text-2xl font-black">{t.count}</p></div>
                <p className="text-xs font-medium">{t.label}</p>
              </div>
            ))}
          </div>
          <div className="text-center text-muted-foreground py-8"><Siren className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>No active emergency cases</p></div>
        </CardContent></Card>
      </div>
    </AppLayout>
  );
}
