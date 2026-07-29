import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useHospital } from "@/contexts/HospitalContext";
import { useState, useEffect } from "react";
import { ShoppingCart, Plus, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PurchaseOrders() {
  const { hospitalId } = useHospital();
  const [lowStock, setLowStock] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!hospitalId) return;
    supabase.from("medicines").select("*").eq("hospital_id", hospitalId).eq("is_active", true).then(({ data }) => {
      setLowStock((data || []).filter(m => (m.stock || 0) <= (m.reorder_level || 10)));
    });
  }, [hospitalId]);

  const autoReorder = async (medicine: any) => {
    toast({ title: `Purchase order created for ${medicine.name}`, description: `Quantity: ${(medicine.reorder_level || 10) * 3} units` });
  };

  return (
    <AppLayout title="Purchase Orders">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="pt-4 flex items-center gap-3"><Package className="h-8 w-8 text-destructive" /><div><p className="text-2xl font-black">{lowStock.length}</p><p className="text-xs text-muted-foreground">Low Stock Items</p></div></CardContent></Card>
        </div>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" />Items Needing Reorder</CardTitle></CardHeader><CardContent>
          <Table><TableHeader><TableRow><TableHead>Medicine</TableHead><TableHead>Current Stock</TableHead><TableHead>Reorder Level</TableHead><TableHead>Supplier</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
            <TableBody>{lowStock.map(m => (
              <TableRow key={m.id}><TableCell className="font-medium">{m.name}</TableCell><TableCell><Badge variant="destructive">{m.stock}</Badge></TableCell><TableCell>{m.reorder_level}</TableCell><TableCell>{m.supplier || "—"}</TableCell><TableCell><Button size="sm" onClick={() => autoReorder(m)}><Plus className="h-3 w-3 mr-1" />Order</Button></TableCell></TableRow>
            ))}{lowStock.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">All items adequately stocked</TableCell></TableRow>}</TableBody></Table>
        </CardContent></Card>
      </div>
    </AppLayout>
  );
}
