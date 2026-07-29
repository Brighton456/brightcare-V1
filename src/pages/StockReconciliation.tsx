import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useState, useEffect } from "react";
import { ClipboardCheck, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHospital } from "@/contexts/HospitalContext";

export default function StockReconciliation() {
  const { hospitalId } = useHospital();
  const [medicines, setMedicines] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;

    const loadMedicines = async () => {
      if (!hospitalId) {
        setMedicines([]);
        setCounts({});
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("medicines")
          .select("id,name,stock,hospital_id,is_active")
          .eq("hospital_id", hospitalId)
          .eq("is_active", true)
          .order("name");

        if (error) throw error;
        if (cancelled) return;

        setMedicines(data || []);
        const initial: Record<string, number> = {};
        (data || []).forEach((m) => {
          initial[m.id] = m.stock || 0;
        });
        setCounts(initial);
      } catch (error: any) {
        if (!cancelled) {
          setMedicines([]);
          setCounts({});
          toast({ title: "Failed to load stock", description: error?.message || "Please try again.", variant: "destructive" });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadMedicines();
    return () => {
      cancelled = true;
    };
  }, [hospitalId, toast]);

  const saveAll = async () => {
    if (!hospitalId) return;
    const updates = medicines.filter(m => counts[m.id] !== (m.stock || 0));
    if (!updates.length) {
      toast({ title: "No changes to save" });
      return;
    }

    try {
      await Promise.all(
        updates.map((m) =>
          supabase
            .from("medicines")
            .update({ stock: counts[m.id] })
            .eq("id", m.id)
            .eq("hospital_id", hospitalId),
        ),
      );
      setMedicines((prev) => prev.map((medicine) => (counts[medicine.id] !== undefined ? { ...medicine, stock: counts[medicine.id] } : medicine)));
      toast({ title: `${updates.length} items reconciled` });
    } catch (error: any) {
      toast({ title: "Failed to save reconciliation", description: error?.message || "Please try again.", variant: "destructive" });
    }
  };

  return (
    <AppLayout title="Stock Reconciliation">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">Count physical stock and update system records</p>
          <Button onClick={saveAll}><Save className="h-4 w-4 mr-2" />Save All Changes</Button>
        </div>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5" />Physical Count</CardTitle></CardHeader><CardContent>
          <Table><TableHeader><TableRow><TableHead>Medicine</TableHead><TableHead>System Stock</TableHead><TableHead>Physical Count</TableHead><TableHead>Variance</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Loading stock items...</TableCell></TableRow>
              ) : medicines.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No active medicines found for reconciliation.</TableCell></TableRow>
              ) : medicines.map(m => {
                const variance = (counts[m.id] || 0) - (m.stock || 0);
                return <TableRow key={m.id}><TableCell className="font-medium">{m.name}</TableCell><TableCell>{m.stock || 0}</TableCell><TableCell><Input type="number" className="w-24 h-8" value={counts[m.id] || 0} onChange={e => setCounts({ ...counts, [m.id]: +e.target.value })} /></TableCell><TableCell><Badge variant={variance === 0 ? "secondary" : "destructive"}>{variance > 0 ? `+${variance}` : variance}</Badge></TableCell></TableRow>;
              })}
            </TableBody></Table>
        </CardContent></Card>
      </div>
    </AppLayout>
  );
}
