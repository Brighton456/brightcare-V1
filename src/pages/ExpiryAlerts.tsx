import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useState, useEffect } from "react";
import { AlertTriangle, Clock, XCircle } from "lucide-react";
import { useHospital } from "@/contexts/HospitalContext";

export default function ExpiryAlerts() {
  const { hospitalId } = useHospital();
  const [medicines, setMedicines] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("medicines").select("*").eq("hospital_id", hospitalId).eq("is_active", true).not("expiry_date", "is", null).order("expiry_date").then(({ data }) => setMedicines(data || []));
  }, [hospitalId]);

  const now = new Date();
  const expired = medicines.filter(m => new Date(m.expiry_date!) < now);
  const expiringSoon = medicines.filter(m => { const d = new Date(m.expiry_date!); return d >= now && d <= new Date(now.getTime() + 90 * 86400000); });
  const safe = medicines.filter(m => new Date(m.expiry_date!) > new Date(now.getTime() + 90 * 86400000));

  return (
    <AppLayout title="Expiry Date Alerts">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-destructive"><CardContent className="pt-4 flex items-center gap-3"><XCircle className="h-8 w-8 text-destructive" /><div><p className="text-2xl font-black text-destructive">{expired.length}</p><p className="text-xs text-muted-foreground">Expired</p></div></CardContent></Card>
          <Card className="border-warning"><CardContent className="pt-4 flex items-center gap-3"><AlertTriangle className="h-8 w-8 text-warning" /><div><p className="text-2xl font-black text-warning">{expiringSoon.length}</p><p className="text-xs text-muted-foreground">Expiring (90 days)</p></div></CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3"><Clock className="h-8 w-8 text-success" /><div><p className="text-2xl font-black">{safe.length}</p><p className="text-xs text-muted-foreground">Safe</p></div></CardContent></Card>
        </div>
        {expired.length > 0 && <Card className="border-destructive"><CardHeader><CardTitle className="text-destructive">⚠️ Expired Medicines — Remove Immediately</CardTitle></CardHeader><CardContent>
          <Table><TableHeader><TableRow><TableHead>Medicine</TableHead><TableHead>Batch</TableHead><TableHead>Expired</TableHead><TableHead>Stock</TableHead></TableRow></TableHeader>
            <TableBody>{expired.map(m => <TableRow key={m.id}><TableCell className="font-medium">{m.name}</TableCell><TableCell className="font-mono text-xs">{m.batch_no || "—"}</TableCell><TableCell className="text-destructive font-bold">{m.expiry_date}</TableCell><TableCell>{m.stock}</TableCell></TableRow>)}</TableBody></Table>
        </CardContent></Card>}
        {expiringSoon.length > 0 && <Card className="border-warning"><CardHeader><CardTitle className="text-warning">⚡ Expiring Soon (within 90 days)</CardTitle></CardHeader><CardContent>
          <Table><TableHeader><TableRow><TableHead>Medicine</TableHead><TableHead>Batch</TableHead><TableHead>Expiry</TableHead><TableHead>Stock</TableHead></TableRow></TableHeader>
            <TableBody>{expiringSoon.map(m => <TableRow key={m.id}><TableCell className="font-medium">{m.name}</TableCell><TableCell className="font-mono text-xs">{m.batch_no || "—"}</TableCell><TableCell className="text-warning font-bold">{m.expiry_date}</TableCell><TableCell>{m.stock}</TableCell></TableRow>)}</TableBody></Table>
        </CardContent></Card>}
      </div>
    </AppLayout>
  );
}
