import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Wrench } from "lucide-react";

const ASSETS = [
  { name: "X-Ray Machine", department: "Radiology", status: "operational", value: 2500000, lastService: "2025-12-01" },
  { name: "Ventilator A1", department: "ICU", status: "operational", value: 800000, lastService: "2026-01-15" },
  { name: "ECG Monitor", department: "Cardiology", status: "maintenance", value: 350000, lastService: "2026-02-10" },
  { name: "Autoclave Sterilizer", department: "OT", status: "operational", value: 450000, lastService: "2026-03-01" },
  { name: "Ultrasound Scanner", department: "Radiology", status: "operational", value: 1200000, lastService: "2025-11-20" },
  { name: "Defibrillator B2", department: "Emergency", status: "operational", value: 250000, lastService: "2026-01-05" },
];

export default function AssetManagement() {
  const totalValue = ASSETS.reduce((s, a) => s + a.value, 0);
  return (
    <AppLayout title="Asset Management">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="pt-4 flex items-center gap-3"><Package className="h-8 w-8 text-primary" /><div><p className="text-2xl font-black">{ASSETS.length}</p><p className="text-xs text-muted-foreground">Total Assets</p></div></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Value</p><p className="text-2xl font-black">KES {totalValue.toLocaleString()}</p></CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3"><Wrench className="h-8 w-8 text-warning" /><div><p className="text-2xl font-black">{ASSETS.filter(a => a.status === "maintenance").length}</p><p className="text-xs text-muted-foreground">Under Maintenance</p></div></CardContent></Card>
        </div>
        <Card><CardHeader><CardTitle>Hospital Assets</CardTitle></CardHeader><CardContent>
          <Table><TableHeader><TableRow><TableHead>Asset</TableHead><TableHead>Department</TableHead><TableHead>Value</TableHead><TableHead>Status</TableHead><TableHead>Last Service</TableHead></TableRow></TableHeader>
            <TableBody>{ASSETS.map((a, i) => <TableRow key={i}><TableCell className="font-medium">{a.name}</TableCell><TableCell>{a.department}</TableCell><TableCell>KES {a.value.toLocaleString()}</TableCell><TableCell><Badge variant={a.status === "operational" ? "default" : "secondary"}>{a.status}</Badge></TableCell><TableCell className="text-xs">{a.lastService}</TableCell></TableRow>)}</TableBody></Table>
        </CardContent></Card>
      </div>
    </AppLayout>
  );
}
