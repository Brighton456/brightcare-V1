import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Droplet, Heart } from "lucide-react";

const BLOOD_STOCK = [
  { type: "A+", units: 15, capacity: 25 }, { type: "A-", units: 5, capacity: 15 },
  { type: "B+", units: 20, capacity: 25 }, { type: "B-", units: 3, capacity: 15 },
  { type: "O+", units: 25, capacity: 30 }, { type: "O-", units: 8, capacity: 20 },
  { type: "AB+", units: 10, capacity: 15 }, { type: "AB-", units: 2, capacity: 10 },
];

export default function BloodBank() {
  const totalUnits = BLOOD_STOCK.reduce((s, b) => s + b.units, 0);
  return (
    <AppLayout title="Blood Bank">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="pt-4 flex items-center gap-3"><Droplet className="h-8 w-8 text-destructive" /><div><p className="text-2xl font-black">{totalUnits}</p><p className="text-xs text-muted-foreground">Total Units Available</p></div></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Blood Types</p><p className="text-2xl font-black">{BLOOD_STOCK.length}</p></CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3"><Heart className="h-8 w-8 text-success" /><div><p className="text-xs text-muted-foreground">Critical Low</p><p className="text-2xl font-black text-destructive">{BLOOD_STOCK.filter(b => b.units < 5).length}</p></div></CardContent></Card>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {BLOOD_STOCK.map(b => (
            <Card key={b.type} className={b.units < 5 ? "border-destructive" : ""}>
              <CardContent className="pt-4 text-center space-y-2">
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto"><span className="font-black text-destructive">{b.type}</span></div>
                <p className="text-2xl font-black">{b.units}</p>
                <p className="text-xs text-muted-foreground">of {b.capacity} units</p>
                <Progress value={(b.units / b.capacity) * 100} className="h-2" />
                <Badge variant={b.units < 5 ? "destructive" : b.units < 10 ? "secondary" : "default"}>{b.units < 5 ? "Critical" : b.units < 10 ? "Low" : "Adequate"}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
