import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useState, useEffect } from "react";
import { Shield, AlertTriangle } from "lucide-react";
import { useHospital } from "@/contexts/HospitalContext";

export default function ControlledDrugs() {
  const { hospitalId } = useHospital();
  const [medicines, setMedicines] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("medicines").select("*").eq("hospital_id", hospitalId).eq("requires_prescription", true).eq("is_active", true).order("name").then(({ data }) => setMedicines(data || []));
  }, [hospitalId]);

  return (
    <AppLayout title="Controlled Drugs Tracking">
      <div className="space-y-6">
        <Card><CardContent className="pt-4 flex items-center gap-3"><Shield className="h-8 w-8 text-destructive" /><div><p className="text-2xl font-black">{medicines.length}</p><p className="text-xs text-muted-foreground">Controlled Substances</p></div></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-warning" />Prescription-Required Medicines</CardTitle></CardHeader><CardContent>
          <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Stock</TableHead><TableHead>Batch#</TableHead><TableHead>Expiry</TableHead><TableHead>Shelf</TableHead></TableRow></TableHeader>
            <TableBody>{medicines.map(m => (
              <TableRow key={m.id}><TableCell className="font-medium">{m.name}</TableCell><TableCell>{m.category || "—"}</TableCell><TableCell><Badge variant={(m.stock || 0) < 10 ? "destructive" : "secondary"}>{m.stock}</Badge></TableCell><TableCell className="font-mono text-xs">{m.batch_no || "—"}</TableCell><TableCell className="text-xs">{m.expiry_date || "—"}</TableCell><TableCell>{m.shelf_location || "—"}</TableCell></TableRow>
            ))}{medicines.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No controlled drugs found</TableCell></TableRow>}</TableBody></Table>
        </CardContent></Card>
      </div>
    </AppLayout>
  );
}
