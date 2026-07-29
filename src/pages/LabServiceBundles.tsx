import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useHospital } from "@/contexts/HospitalContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { PrintButton } from "@/components/PrintButton";
import {
  FlaskConical, Plus, Pencil, Trash2, Package, Search, Layers,
} from "lucide-react";

interface ServiceBundle {
  id: string;
  service_name: string;
  service_code: string;
  price: number;
  category: string;
  description: string | null;
  is_active: boolean;
  consumables?: ServiceConsumable[];
}

interface ServiceConsumable {
  id: string;
  consumable_id: string | null;
  consumable_name: string;
  quantity_required: number;
}

interface LabConsumable {
  id: string;
  name: string;
  stock: number;
  unit: string;
}

export default function LabServiceBundles() {
  const { hospitalId } = useHospital();
  const [bundles, setBundles] = useState<ServiceBundle[]>([]);
  const [consumables, setConsumables] = useState<LabConsumable[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editBundle, setEditBundle] = useState<ServiceBundle | null>(null);

  // Form state
  const [form, setForm] = useState({
    service_name: "", service_code: "", price: 0, category: "general", description: "", is_active: true,
  });
  const [formConsumables, setFormConsumables] = useState<{ consumable_id: string; consumable_name: string; quantity_required: number }[]>([]);

  const fetchAll = async () => {
    if (!hospitalId) return;
    const [{ data: b }, { data: c }] = await Promise.all([
      supabase.from("lab_service_bundles").select("*").eq("hospital_id", hospitalId).order("service_name"),
      supabase.from("lab_consumables").select("id, name, stock, unit").eq("hospital_id", hospitalId).eq("is_active", true),
    ]);
    const bundleList = (b || []) as unknown as ServiceBundle[];

    // Fetch consumables for each bundle
    if (bundleList.length > 0) {
      const { data: sc } = await supabase.from("lab_service_consumables")
        .select("*")
        .in("service_bundle_id", bundleList.map(x => x.id));
      const scList = (sc || []) as unknown as ServiceConsumable[];
      bundleList.forEach(bundle => {
        bundle.consumables = scList.filter(s => (s as any).service_bundle_id === bundle.id);
      });
    }

    setBundles(bundleList);
    setConsumables((c || []) as unknown as LabConsumable[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [hospitalId]);

  const openNew = () => {
    setEditBundle(null);
    setForm({ service_name: "", service_code: `SVC-${Date.now().toString().slice(-5)}`, price: 0, category: "general", description: "", is_active: true });
    setFormConsumables([]);
    setShowForm(true);
  };

  const openEdit = (b: ServiceBundle) => {
    setEditBundle(b);
    setForm({ service_name: b.service_name, service_code: b.service_code, price: b.price, category: b.category, description: b.description || "", is_active: b.is_active });
    setFormConsumables((b.consumables || []).map(c => ({ consumable_id: c.consumable_id || "", consumable_name: c.consumable_name, quantity_required: c.quantity_required })));
    setShowForm(true);
  };

  const addConsumable = () => {
    setFormConsumables(prev => [...prev, { consumable_id: "", consumable_name: "", quantity_required: 1 }]);
  };

  const removeConsumable = (idx: number) => {
    setFormConsumables(prev => prev.filter((_, i) => i !== idx));
  };

  const updateConsumableRow = (idx: number, field: string, value: any) => {
    setFormConsumables(prev => prev.map((c, i) => {
      if (i !== idx) return c;
      if (field === "consumable_id") {
        const found = consumables.find(x => x.id === value);
        return { ...c, consumable_id: value, consumable_name: found?.name || c.consumable_name };
      }
      return { ...c, [field]: value };
    }));
  };

  const handleSave = async () => {
    if (!form.service_name || !form.service_code || form.price <= 0) {
      toast({ title: "Validation", description: "Name, code and price are required.", variant: "destructive" });
      return;
    }

    if (editBundle) {
      // Update
      const { error } = await supabase.from("lab_service_bundles").update({
        service_name: form.service_name, service_code: form.service_code, price: form.price,
        category: form.category, description: form.description || null, is_active: form.is_active, updated_at: new Date().toISOString(),
      } as any).eq("id", editBundle.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }

      // Replace consumables
      await supabase.from("lab_service_consumables").delete().eq("service_bundle_id", editBundle.id);
      if (formConsumables.length > 0) {
        await supabase.from("lab_service_consumables").insert(
          formConsumables.map(c => ({
            service_bundle_id: editBundle.id,
            consumable_id: c.consumable_id || null,
            consumable_name: c.consumable_name,
            quantity_required: c.quantity_required,
            hospital_id: hospitalId,
          })) as any
        );
      }
    } else {
      // Create
      const { data: created, error } = await supabase.from("lab_service_bundles").insert({
        service_name: form.service_name, service_code: form.service_code, price: form.price,
        category: form.category, description: form.description || null, is_active: form.is_active, hospital_id: hospitalId,
      } as any).select().single();
      if (error || !created) { toast({ title: "Error", description: error?.message || "Failed to create", variant: "destructive" }); return; }

      if (formConsumables.length > 0) {
        await supabase.from("lab_service_consumables").insert(
          formConsumables.map(c => ({
            service_bundle_id: (created as any).id,
            consumable_id: c.consumable_id || null,
            consumable_name: c.consumable_name,
            quantity_required: c.quantity_required,
            hospital_id: hospitalId,
          })) as any
        );
      }
    }

    toast({ title: editBundle ? "Bundle Updated" : "Bundle Created" });
    setShowForm(false);
    fetchAll();
  };

  const toggleActive = async (b: ServiceBundle) => {
    await supabase.from("lab_service_bundles").update({ is_active: !b.is_active } as any).eq("id", b.id);
    fetchAll();
  };

  const deleteBundle = async (b: ServiceBundle) => {
    if (!window.confirm(`Delete "${b.service_name}"? This cannot be undone.`)) return;
    await supabase.from("lab_service_bundles").delete().eq("id", b.id);
    toast({ title: "Deleted" });
    fetchAll();
  };

  const filtered = bundles.filter(b => {
    const q = search.toLowerCase();
    return b.service_name.toLowerCase().includes(q) || b.service_code.toLowerCase().includes(q) || b.category.toLowerCase().includes(q);
  });

  return (
    <AppLayout title="Lab Service Bundles">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Bundled Lab Services</h2>
            <Badge variant="secondary">{bundles.length} services</Badge>
          </div>
          <div className="flex items-center gap-2">
            <PrintButton title="Lab Service Bundles" contentId="bundles-table" />
            <Button onClick={openNew} size="sm"><Plus className="h-4 w-4 mr-1" /> New Bundle</Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Configure lab tests as bundled services with fixed prices. Each bundle links to its required consumables for automatic inventory deduction. Patients see only the service name and price on their bill.
        </p>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search bundles..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        <div id="bundles-table" className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-semibold">Service</th>
                <th className="text-left p-3 font-semibold">Code</th>
                <th className="text-left p-3 font-semibold">Category</th>
                <th className="text-right p-3 font-semibold">Price</th>
                <th className="text-center p-3 font-semibold">Consumables</th>
                <th className="text-center p-3 font-semibold">Active</th>
                <th className="text-right p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No bundles configured. Click "New Bundle" to create one.</td></tr>
              ) : filtered.map(b => (
                <tr key={b.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <FlaskConical className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-semibold">{b.service_name}</p>
                        {b.description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{b.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-xs font-mono">{b.service_code}</td>
                  <td className="p-3 text-xs capitalize">{b.category}</td>
                  <td className="p-3 text-right font-bold">KES {b.price.toLocaleString()}</td>
                  <td className="p-3 text-center">
                    <Badge variant="outline" className="text-xs">
                      <Package className="h-3 w-3 mr-1" />
                      {b.consumables?.length || 0} items
                    </Badge>
                  </td>
                  <td className="p-3 text-center">
                    <Switch checked={b.is_active} onCheckedChange={() => toggleActive(b)} />
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(b)} className="h-7 w-7 p-0">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteBundle(b)} className="h-7 w-7 p-0 text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={() => setShowForm(false)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              {editBundle ? "Edit Service Bundle" : "New Service Bundle"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Service Name *</Label><Input value={form.service_name} onChange={e => setForm(f => ({ ...f, service_name: e.target.value }))} placeholder="e.g. Malaria Test" /></div>
              <div><Label>Service Code *</Label><Input value={form.service_code} onChange={e => setForm(f => ({ ...f, service_code: e.target.value }))} /></div>
              <div><Label>Price (KES) *</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} /></div>
              <div><Label>Category</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. hematology" /></div>
            </div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              <Label>Active</Label>
            </div>

            {/* Consumables */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" /> Required Consumables
                </Label>
                <Button size="sm" variant="outline" onClick={addConsumable}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Consumable
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                These consumables will be automatically deducted from inventory whenever this test is billed. The patient only sees the service price.
              </p>
              {formConsumables.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg">No consumables linked. Click "Add Consumable" to link inventory items.</p>
              ) : (
                <div className="space-y-2">
                  {formConsumables.map((c, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30">
                      <select
                        value={c.consumable_id}
                        onChange={e => updateConsumableRow(idx, "consumable_id", e.target.value)}
                        className="flex-1 text-sm border rounded-md px-2 py-1.5 bg-background"
                      >
                        <option value="">-- Select consumable --</option>
                        {consumables.map(con => (
                          <option key={con.id} value={con.id}>{con.name} ({con.stock} {con.unit})</option>
                        ))}
                      </select>
                      <Input
                        type="number"
                        min={1}
                        value={c.quantity_required}
                        onChange={e => updateConsumableRow(idx, "quantity_required", parseInt(e.target.value) || 1)}
                        className="w-20 text-center"
                        placeholder="Qty"
                      />
                      <Button size="sm" variant="ghost" onClick={() => removeConsumable(idx)} className="h-8 w-8 p-0 text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editBundle ? "Update Bundle" : "Create Bundle"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
