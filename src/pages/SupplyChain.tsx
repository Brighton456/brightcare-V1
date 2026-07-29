import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { DepartmentHeader } from "@/components/DepartmentHeader";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, AlertTriangle, Clock, Package, TrendingUp } from "lucide-react";
import { useHospital } from "@/contexts/HospitalContext";

export default function SupplyChain() {
  const { hospitalId } = useHospital();
  const [medicines, setMedicines] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("medicines").select("*").eq("hospital_id", hospitalId).eq("is_active", true).order("name").then(({ data }) => { if (data) setMedicines(data); });
  }, [hospitalId]);

  const withLeadTime = medicines.filter(m => (m.lead_time_days || 0) > 0);
  const critical = medicines.filter(m => (m.stock || 0) <= (m.reorder_level || 10) && (m.lead_time_days || 0) > 7);
  const avgLeadTime = withLeadTime.length > 0 ? Math.round(withLeadTime.reduce((s, m) => s + (m.lead_time_days || 0), 0) / withLeadTime.length) : 0;

  return (
    <AppLayout title="Supply Chain">
      <DepartmentHeader department="Pharmacy" title="Supply Chain & Lead Time Tracking" subtitle="Monitor supplier performance and prevent critical stock-outs" quickActions={[{ label: "Purchase Orders", path: "/purchase-orders" }, { label: "Inventory", path: "/inventory" }]} />
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="pt-4"><Package className="h-6 w-6 text-primary mb-1" /><p className="text-2xl font-bold">{medicines.length}</p><p className="text-xs text-muted-foreground">Total Items</p></CardContent></Card>
        <Card><CardContent className="pt-4"><Clock className="h-6 w-6 text-chart-2 mb-1" /><p className="text-2xl font-bold">{avgLeadTime}d</p><p className="text-xs text-muted-foreground">Avg Lead Time</p></CardContent></Card>
        <Card><CardContent className="pt-4"><AlertTriangle className="h-6 w-6 text-destructive mb-1" /><p className="text-2xl font-bold">{critical.length}</p><p className="text-xs text-muted-foreground">Critical Items</p></CardContent></Card>
        <Card><CardContent className="pt-4"><Truck className="h-6 w-6 text-chart-3 mb-1" /><p className="text-2xl font-bold">{withLeadTime.length}</p><p className="text-xs text-muted-foreground">With Lead Times</p></CardContent></Card>
      </div>
      {critical.length > 0 && (
        <Card className="mb-6 border-destructive/50">
          <CardHeader><CardTitle className="text-sm text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Critical Supply Alerts</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">{critical.map(m => (
              <div key={m.id} className="flex items-center justify-between p-2 bg-destructive/5 rounded">
                <div><p className="font-medium text-sm">{m.name}</p><p className="text-xs text-muted-foreground">{m.supplier || "No supplier"} · Lead: {m.lead_time_days}d</p></div>
                <div className="text-right"><Badge variant="destructive">{m.stock} left</Badge></div>
              </div>
            ))}</div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader><CardTitle className="text-sm">All Items with Lead Times</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left"><th className="p-2">Medicine</th><th className="p-2">Supplier</th><th className="p-2 text-center">Stock</th><th className="p-2 text-center">Reorder</th><th className="p-2 text-center">Lead Time</th><th className="p-2">Status</th></tr></thead>
            <tbody>
              {withLeadTime.map(m => (
                <tr key={m.id} className="border-b hover:bg-muted/30">
                  <td className="p-2 font-medium">{m.name}</td>
                  <td className="p-2">{m.supplier || "-"}</td>
                  <td className="p-2 text-center">{m.stock}</td>
                  <td className="p-2 text-center">{m.reorder_level}</td>
                  <td className="p-2 text-center">{m.lead_time_days}d</td>
                  <td className="p-2"><Badge variant={(m.stock || 0) <= (m.reorder_level || 10) ? "destructive" : "secondary"} className="text-xs">{(m.stock || 0) <= (m.reorder_level || 10) ? "Reorder" : "OK"}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
