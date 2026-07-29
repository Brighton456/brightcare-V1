import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scissors, Clock, CheckCircle2 } from "lucide-react";

const OTS = [
  { name: "OT-1 (General)", status: "available", type: "Major" },
  { name: "OT-2 (Ortho)", status: "in_use", type: "Major", currentOp: "Knee Replacement" },
  { name: "OT-3 (Minor)", status: "available", type: "Minor" },
  { name: "OT-4 (Cardiac)", status: "cleaning", type: "Major" },
];

export default function OperationTheatre() {
  const statusColor: Record<string, string> = { available: "default", in_use: "destructive", cleaning: "secondary", maintenance: "outline" };
  return (
    <AppLayout title="Operation Theatre">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total OTs</p><p className="text-2xl font-black">{OTS.length}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Available</p><p className="text-2xl font-black text-success">{OTS.filter(o => o.status === "available").length}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">In Use</p><p className="text-2xl font-black text-destructive">{OTS.filter(o => o.status === "in_use").length}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Scheduled Today</p><p className="text-2xl font-black">0</p></CardContent></Card>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {OTS.map(ot => (
            <Card key={ot.name} className={ot.status === "in_use" ? "border-destructive" : ""}>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center justify-between"><p className="font-bold flex items-center gap-2"><Scissors className="h-4 w-4" />{ot.name}</p><Badge variant={statusColor[ot.status] as any}>{ot.status.replace("_", " ")}</Badge></div>
                <p className="text-sm text-muted-foreground">Type: {ot.type}</p>
                {ot.currentOp && <p className="text-sm font-medium text-destructive">Current: {ot.currentOp}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
