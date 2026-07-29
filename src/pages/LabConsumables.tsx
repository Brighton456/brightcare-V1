import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { usePermissions } from "@/hooks/usePermissions";
import { DepartmentHeader } from "@/components/DepartmentHeader";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Plus, Package, TestTube, AlertTriangle, Search, Pencil, Trash2 } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useHospital } from "@/contexts/HospitalContext";

interface Consumable {
  id: string; name: string; category: string | null; unit: string | null;
  size_or_type: string | null; cost_per_unit: number | null; stock: number | null;
  reorder_level: number | null; is_active: boolean | null;
}
interface TestMapping {
  id: string; test_name: string; consumable_id: string | null; quantity_per_test: number | null;
}

export default function LabConsumables() {
  const { hospitalId } = useHospital();
  const { can } = usePermissions();
  const { staff } = useAuth();
  const isAdmin = ["hospital_admin", "super_admin", "platform_admin"].includes(staff?.role || "");
  const [consumables, setConsumables] = useState<Consumable[]>([]);
  const [mappings, setMappings] = useState<TestMapping[]>([]);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [editItem, setEditItem] = useState<Consumable | null>(null);
  const [form, setForm] = useState({ name: "", category: "general", unit: "piece", size_or_type: "", cost_per_unit: "0", stock: "0", reorder_level: "5" });
  const [mapForm, setMapForm] = useState({ test_name: "", consumable_id: "", quantity_per_test: "1" });
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; type: "consumable" | "mapping" } | null>(null);

  const fetchAll = async () => {
    const [c, m] = await Promise.all([
      supabase.from("lab_consumables").select("*").eq("hospital_id", hospitalId).order("name"),
      supabase.from("lab_test_consumables").select("*").eq("hospital_id", hospitalId).order("test_name"),
    ]);
    if (c.data) setConsumables(c.data);
    if (m.data) setMappings(m.data);
  };

  useEffect(() => { fetchAll(); }, [hospitalId]);

  const saveConsumable = async () => {
    const payload = { name: form.name, category: form.category, unit: form.unit, size_or_type: form.size_or_type || null, cost_per_unit: parseFloat(form.cost_per_unit), stock: parseInt(form.stock), reorder_level: parseInt(form.reorder_level) };
    if (!form.name) { toast({ title: "Name required", variant: "destructive" }); return; }
    if (editItem) {
      await supabase.from("lab_consumables").update(payload).eq("id", editItem.id);
      toast({ title: "Updated" });
    } else {
      await supabase.from("lab_consumables").insert(payload);
      toast({ title: "Consumable added" });
    }
    setAddOpen(false); setEditItem(null); setForm({ name: "", category: "general", unit: "piece", size_or_type: "", cost_per_unit: "0", stock: "0", reorder_level: "5" });
    fetchAll();
  };

  const confirmDeleteTarget = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "consumable") {
      await supabase.from("lab_consumables").delete().eq("id", deleteTarget.id);
      toast({ title: "Deleted", description: `"${deleteTarget.name}" removed.` });
    } else {
      await supabase.from("lab_test_consumables").delete().eq("id", deleteTarget.id);
      toast({ title: "Mapping removed" });
    }
    setDeleteTarget(null);
    fetchAll();
  };

  const saveMapping = async () => {
    if (!mapForm.test_name || !mapForm.consumable_id) { toast({ title: "All fields required", variant: "destructive" }); return; }
    await supabase.from("lab_test_consumables").insert({ test_name: mapForm.test_name, consumable_id: mapForm.consumable_id, quantity_per_test: parseInt(mapForm.quantity_per_test), hospital_id: hospitalId });
    toast({ title: "Mapping added" }); setMapOpen(false); setMapForm({ test_name: "", consumable_id: "", quantity_per_test: "1" }); fetchAll();
  };

  const lowStock = consumables.filter(c => (c.stock || 0) <= (c.reorder_level || 5));
  const filtered = consumables.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppLayout title="Lab Consumables">
      <DepartmentHeader department="Laboratory" title="Lab Consumables & Equipment" subtitle="Manage supplies, costs, and per-test mappings" quickActions={[{ label: "Lab Dashboard", path: "/laboratory" }, { label: "Pending Tests", path: "/lab-pending" }]} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="pt-4"><Package className="h-6 w-6 text-primary mb-1" /><p className="text-2xl font-bold">{consumables.length}</p><p className="text-xs text-muted-foreground">Total Items</p></CardContent></Card>
        <Card><CardContent className="pt-4"><AlertTriangle className="h-6 w-6 text-destructive mb-1" /><p className="text-2xl font-bold">{lowStock.length}</p><p className="text-xs text-muted-foreground">Low Stock</p></CardContent></Card>
        <Card><CardContent className="pt-4"><TestTube className="h-6 w-6 text-chart-2 mb-1" /><p className="text-2xl font-bold">{mappings.length}</p><p className="text-xs text-muted-foreground">Test Mappings</p></CardContent></Card>
        <Card><CardContent className="pt-4"><Package className="h-6 w-6 text-chart-3 mb-1" /><p className="text-2xl font-bold">KES {consumables.reduce((s, c) => s + (c.cost_per_unit || 0) * (c.stock || 0), 0).toLocaleString()}</p><p className="text-xs text-muted-foreground">Stock Value</p></CardContent></Card>
      </div>

      <Tabs defaultValue="inventory">
        <TabsList><TabsTrigger value="inventory">Inventory</TabsTrigger><TabsTrigger value="mappings">Test Mappings</TabsTrigger><TabsTrigger value="alerts">Low Stock Alerts</TabsTrigger></TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search consumables..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
            {can("manage_lab_inventory") && <Button onClick={() => { setEditItem(null); setForm({ name: "", category: "general", unit: "piece", size_or_type: "", cost_per_unit: "0", stock: "0", reorder_level: "5" }); setAddOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Item</Button>}
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left"><th className="p-2">Name</th><th className="p-2">Category</th><th className="p-2">Size/Type</th><th className="p-2">Unit</th><th className="p-2 text-right">Cost</th><th className="p-2 text-right">Stock</th><th className="p-2">Status</th><th className="p-2">Actions</th></tr></thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b hover:bg-muted/30">
                    <td className="p-2 font-medium">{c.name}</td>
                    <td className="p-2">{c.category}</td>
                    <td className="p-2">{c.size_or_type || "-"}</td>
                    <td className="p-2">{c.unit}</td>
                    <td className="p-2 text-right">KES {(c.cost_per_unit || 0).toLocaleString()}</td>
                    <td className="p-2 text-right">{c.stock}</td>
                    <td className="p-2"><Badge variant={(c.stock || 0) <= (c.reorder_level || 5) ? "destructive" : "secondary"} className="text-xs">{(c.stock || 0) <= (c.reorder_level || 5) ? "Low" : "OK"}</Badge></td>
                    <td className="p-2 flex gap-1">
                      {can("manage_lab_inventory") && (
                        <>
                         <Button size="sm" variant="ghost" onClick={() => { setEditItem(c); setForm({ name: c.name, category: c.category || "general", unit: c.unit || "piece", size_or_type: c.size_or_type || "", cost_per_unit: String(c.cost_per_unit || 0), stock: String(c.stock || 0), reorder_level: String(c.reorder_level || 5) }); setAddOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                          {isAdmin && <Button size="sm" variant="ghost" onClick={() => setDeleteTarget({ id: c.id, name: c.name, type: "consumable" })}><Trash2 className="h-3 w-3 text-destructive" /></Button>}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="mappings" className="space-y-4">
          <div className="flex justify-end"><Button onClick={() => setMapOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Mapping</Button></div>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left"><th className="p-2">Test Name</th><th className="p-2">Consumable</th><th className="p-2 text-center">Qty/Test</th><th className="p-2">Actions</th></tr></thead>
            <tbody>
              {mappings.map(m => {
                const c = consumables.find(x => x.id === m.consumable_id);
                return (
                  <tr key={m.id} className="border-b hover:bg-muted/30">
                    <td className="p-2 font-medium">{m.test_name}</td>
                    <td className="p-2">{c?.name || "Unknown"}</td>
                    <td className="p-2 text-center">{m.quantity_per_test}</td>
                    <td className="p-2">{isAdmin && <Button size="sm" variant="ghost" onClick={() => setDeleteTarget({ id: m.id, name: m.test_name, type: "mapping" })}><Trash2 className="h-3 w-3 text-destructive" /></Button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TabsContent>

        <TabsContent value="alerts">
          {lowStock.length === 0 ? <p className="text-muted-foreground p-4">All items well-stocked.</p> :
            <div className="space-y-2">{lowStock.map(c => (
              <Card key={c.id}><CardContent className="pt-3 flex items-center justify-between">
                <div><p className="font-medium">{c.name}</p><p className="text-xs text-muted-foreground">{c.category} · {c.unit}</p></div>
                <div className="text-right"><Badge variant="destructive">{c.stock} left</Badge><p className="text-xs text-muted-foreground mt-1">Reorder at {c.reorder_level}</p></div>
              </CardContent></Card>
            ))}</div>
          }
        </TabsContent>
      </Tabs>

      {/* Add/Edit Consumable Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent><DialogHeader><DialogTitle>{editItem ? "Edit" : "Add"} Consumable</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category</Label><Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["general", "reagent", "glassware", "PPE", "specimen", "chemical", "electronic"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Unit</Label><Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["piece", "box", "pack", "bottle", "pair", "set", "roll", "strip"].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label>Size/Type</Label><Input value={form.size_or_type} onChange={e => setForm(f => ({ ...f, size_or_type: e.target.value }))} placeholder="e.g. 5ml, Large, Type A" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Cost/Unit</Label><Input type="number" value={form.cost_per_unit} onChange={e => setForm(f => ({ ...f, cost_per_unit: e.target.value }))} /></div>
              <div><Label>Stock</Label><Input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} /></div>
              <div><Label>Reorder Level</Label><Input type="number" value={form.reorder_level} onChange={e => setForm(f => ({ ...f, reorder_level: e.target.value }))} /></div>
            </div>
            <Button onClick={saveConsumable} className="mt-2">{editItem ? "Update" : "Add"} Consumable</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Mapping Dialog */}
      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent><DialogHeader><DialogTitle>Map Consumable to Test</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Test Name</Label><Input value={mapForm.test_name} onChange={e => setMapForm(f => ({ ...f, test_name: e.target.value }))} placeholder="e.g. Complete Blood Count" /></div>
            <div><Label>Consumable</Label>
              <Select value={mapForm.consumable_id} onValueChange={v => setMapForm(f => ({ ...f, consumable_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select consumable" /></SelectTrigger>
                <SelectContent>{consumables.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.unit})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Quantity per Test</Label><Input type="number" value={mapForm.quantity_per_test} onChange={e => setMapForm(f => ({ ...f, quantity_per_test: e.target.value }))} /></div>
            <Button onClick={saveMapping}>Save Mapping</Button>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteTarget}
        itemName={deleteTarget?.name}
      />
    </AppLayout>
  );
}
