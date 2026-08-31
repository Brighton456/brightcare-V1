import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useHospital } from "@/contexts/HospitalContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { exportToCSV } from "@/utils/exportUtils";
import { CSVImportModal } from "@/components/inventory/CSVImportModal";
import {
  Search, Plus, AlertTriangle, Package, FileText, Edit2, Trash2, Download, Upload,
} from "lucide-react";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/AuthContext";

interface MedicineRow {
  id: string; name: string; generic_name: string | null; brand: string | null;
  category: string | null; price: number; cost_price: number | null;
  stock: number | null; batch_no: string | null; expiry_date: string | null;
  requires_prescription: boolean | null; unit: string | null;
  reorder_level: number | null; supplier: string | null; barcode: string | null;
  shelf_location: string | null; is_active: boolean | null; created_at: string | null;
}

const emptyForm = {
  name: "", generic_name: "", brand: "", category: "Pain Relief",
  price: "", cost_price: "", stock: "", batch_no: "", expiry_date: "",
  requires_prescription: false, unit: "tablet", reorder_level: "10",
  supplier: "", barcode: "", shelf_location: "",
};

const categories = ["Pain Relief", "Antibiotics", "Diabetes", "GI Tract", "Allergy", "Antimalarials", "Respiratory", "Cardiovascular", "Anti-inflammatory", "Supplements", "Antifungals", "Other"];

export default function Medicines() {
  const [medicines, setMedicines] = useState<MedicineRow[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "expiring" | "prescription">("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showImport, setShowImport] = useState(false);
  const [loading, setLoading] = useState(true);

  const { hospitalId } = useHospital();

  const fetchMedicines = async () => {
    if (!hospitalId) return;
    const { data } = await supabase.from("medicines").select("*").eq("hospital_id", hospitalId).eq("is_active", true).order("name");
    if (data) setMedicines(data as unknown as MedicineRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchMedicines(); }, [hospitalId]);

  const isExpiringSoon = (date: string | null) => {
    if (!date) return false;
    const exp = new Date(date);
    const months3 = new Date(); months3.setMonth(months3.getMonth() + 3);
    return exp <= months3;
  };

  const filtered = medicines.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = m.name.toLowerCase().includes(q) || (m.generic_name || "").toLowerCase().includes(q);
    if (!matchSearch) return false;
    if (filter === "low") return (m.stock || 0) <= (m.reorder_level || 10);
    if (filter === "expiring") return isExpiringSoon(m.expiry_date);
    if (filter === "prescription") return m.requires_prescription;
    return true;
  });

  const handleSave = async () => {
    if (!form.name) { toast({ title: "Error", description: "Medicine name is required", variant: "destructive" }); return; }
    const payload = {
      name: form.name, generic_name: form.generic_name || null, brand: form.brand || null,
      category: form.category || null, price: parseFloat(form.price) || 0,
      cost_price: parseFloat(form.cost_price) || 0, stock: parseInt(form.stock) || 0,
      batch_no: form.batch_no || null, expiry_date: form.expiry_date || null,
      requires_prescription: form.requires_prescription, unit: form.unit || "tablet",
      reorder_level: parseInt(form.reorder_level) || 10, supplier: form.supplier || null,
      barcode: form.barcode || null, shelf_location: form.shelf_location || null,
    };
    if (editingId) {
      const { error } = await supabase.from("medicines").update(payload as any).eq("id", editingId);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Medicine Updated" });
    } else {
      const { error } = await supabase.from("medicines").insert({ ...payload, hospital_id: hospitalId } as any);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Medicine Added" });
    }
    setShowForm(false); setEditingId(null); setForm(emptyForm); fetchMedicines();
  };

  const { staff } = useAuth();
  const { can } = usePermissions();
  const isAdmin = ["hospital_admin", "super_admin", "platform_admin"].includes(staff?.role || "");
  const canEditMedicine = isAdmin || !can("admin_only_medicine_edit");
  const canEditQuantity = isAdmin || !can("admin_only_medicine_quantity");
  const canEditPrice = isAdmin || !can("admin_only_price_edit");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from("medicines").update({ is_active: false } as any).eq("id", deleteTarget.id);
    toast({ title: "Medicine Removed", description: `"${deleteTarget.name}" has been deactivated.` });
    setDeleteTarget(null);
    fetchMedicines();
  };

  const openEdit = (m: MedicineRow) => {
    setEditingId(m.id);
    setForm({
      name: m.name, generic_name: m.generic_name || "", brand: m.brand || "",
      category: m.category || "Other", price: String(m.price), cost_price: String(m.cost_price || 0),
      stock: String(m.stock || 0), batch_no: m.batch_no || "", expiry_date: m.expiry_date || "",
      requires_prescription: m.requires_prescription || false, unit: m.unit || "tablet",
      reorder_level: String(m.reorder_level || 10), supplier: m.supplier || "",
      barcode: m.barcode || "", shelf_location: m.shelf_location || "",
    });
    setShowForm(true);
  };

  const handleExport = () => {
    exportToCSV(filtered.map(m => ({
      Name: m.name, Generic: m.generic_name, Brand: m.brand, Category: m.category,
      Price: m.price, Cost: m.cost_price, Stock: m.stock, Batch: m.batch_no,
      Expiry: m.expiry_date, Rx: m.requires_prescription ? "Yes" : "No",
    })), "brightech-medicines");
    toast({ title: "Exported" });
  };

  const lowStock = medicines.filter(m => (m.stock || 0) <= (m.reorder_level || 10)).length;
  const expiring = medicines.filter(m => isExpiringSoon(m.expiry_date)).length;

  return (
    <AppLayout title="Medicine Catalog">
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="cursor-pointer" onClick={() => setFilter("all")}><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Package className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{medicines.length}</p><p className="text-xs text-muted-foreground">Total</p></div></CardContent></Card>
          <Card className="cursor-pointer" onClick={() => setFilter("low")}><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-destructive" /></div><div><p className="text-2xl font-bold">{lowStock}</p><p className="text-xs text-muted-foreground">Low Stock</p></div></CardContent></Card>
          <Card className="cursor-pointer" onClick={() => setFilter("expiring")}><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-warning" /></div><div><p className="text-2xl font-bold">{expiring}</p><p className="text-xs text-muted-foreground">Expiring</p></div></CardContent></Card>
          <Card className="cursor-pointer" onClick={() => setFilter("prescription")}><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center"><FileText className="h-5 w-5 text-info" /></div><div><p className="text-2xl font-bold">{medicines.filter(m => m.requires_prescription).length}</p><p className="text-xs text-muted-foreground">Rx Only</p></div></CardContent></Card>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search medicines..." className="pl-9" />
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowImport(true)}><Upload className="h-4 w-4 mr-1" />Import</Button>
          <Button size="sm" variant="outline" onClick={handleExport}><Download className="h-4 w-4 mr-1" />Export</Button>
          <Button size="sm" onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}><Plus className="h-4 w-4 mr-1" />Add Medicine</Button>
        </div>

        {filter !== "all" && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">Filtered: {filter}</Badge>
            <Button size="sm" variant="ghost" onClick={() => setFilter("all")} className="text-xs h-6">Clear</Button>
          </div>
        )}

        <Card>
          <CardContent className="p-0 overflow-auto">
            {loading ? <div className="p-8 text-center text-muted-foreground text-sm">Loading medicines...</div> : (
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Medicine</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">Category</th>
                <th className="text-right p-3 font-medium">Price</th>
                <th className="text-right p-3 font-medium">Stock</th>
                <th className="text-left p-3 font-medium hidden lg:table-cell">Batch</th>
                <th className="text-left p-3 font-medium hidden lg:table-cell">Expiry</th>
                <th className="text-center p-3 font-medium">Rx</th>
                <th className="text-center p-3 font-medium">Actions</th>
              </tr></thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3"><p className="font-medium">{m.name}</p><p className="text-xs text-muted-foreground">{m.generic_name} · {m.brand}</p></td>
                    <td className="p-3 hidden md:table-cell"><Badge variant="secondary" className="text-xs">{m.category}</Badge></td>
                    <td className="p-3 text-right font-medium">KES {m.price.toLocaleString()}</td>
                    <td className={`p-3 text-right font-medium ${(m.stock || 0) <= (m.reorder_level || 10) ? "text-destructive" : ""}`}>{m.stock || 0}</td>
                    <td className="p-3 font-mono text-xs hidden lg:table-cell">{m.batch_no || "—"}</td>
                    <td className={`p-3 text-xs hidden lg:table-cell ${isExpiringSoon(m.expiry_date) ? "text-warning font-medium" : "text-muted-foreground"}`}>{m.expiry_date || "—"}</td>
                    <td className="p-3 text-center">{m.requires_prescription && <FileText className="h-4 w-4 text-info mx-auto" />}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {canEditMedicine && <button onClick={() => openEdit(m)} className="p-1.5 rounded hover:bg-muted"><Edit2 className="h-3.5 w-3.5 text-muted-foreground" /></button>}
                        {isAdmin && <button onClick={() => setDeleteTarget({ id: m.id, name: m.name })} className="p-1.5 rounded hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Medicine Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Medicine" : "Add New Medicine"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Medicine Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Generic Name</Label><Input value={form.generic_name} onChange={e => setForm(f => ({ ...f, generic_name: e.target.value }))} /></div>
            <div><Label>Brand</Label><Input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} /></div>
            <div><Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Price (KES)</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} disabled={!canEditPrice} /></div>
            <div><Label>Cost Price (KES)</Label><Input type="number" value={form.cost_price} onChange={e => setForm(f => ({ ...f, cost_price: e.target.value }))} disabled={!canEditPrice} /></div>
            <div><Label>Stock</Label><Input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} disabled={!canEditQuantity} /></div>
            <div><Label>Reorder Level</Label><Input type="number" value={form.reorder_level} onChange={e => setForm(f => ({ ...f, reorder_level: e.target.value }))} /></div>
            <div><Label>Batch No.</Label><Input value={form.batch_no} onChange={e => setForm(f => ({ ...f, batch_no: e.target.value }))} /></div>
            <div><Label>Expiry Date</Label><Input type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} /></div>
            <div><Label>Unit</Label>
              <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["tablet","capsule","bottle","tube","inhaler","pack","vial","sachet","box"].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Barcode</Label><Input value={form.barcode} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))} /></div>
            <div><Label>Supplier</Label><Input value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} /></div>
            <div><Label>Shelf Location</Label><Input value={form.shelf_location} onChange={e => setForm(f => ({ ...f, shelf_location: e.target.value }))} /></div>
            <div className="flex items-center gap-2 md:col-span-2">
              <Switch checked={form.requires_prescription} onCheckedChange={v => setForm(f => ({ ...f, requires_prescription: v }))} />
              <Label>Requires Prescription (Rx)</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingId ? "Update" : "Add Medicine"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <CSVImportModal open={showImport} onClose={() => { setShowImport(false); fetchMedicines(); }} />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        itemName={deleteTarget?.name}
        description={`Are you sure you want to remove "${deleteTarget?.name || ""}" from the active inventory? This will deactivate the medicine.`}
      />
    </AppLayout>
  );
}
