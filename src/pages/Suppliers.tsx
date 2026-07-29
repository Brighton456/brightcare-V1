import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePharmacy } from "@/contexts/PharmacyStore";
import { AddEditSupplierModal } from "@/components/suppliers/AddEditSupplierModal";
import { type Supplier } from "@/contexts/PharmacyStore";
import { exportToCSV } from "@/utils/exportUtils";
import { toast } from "@/hooks/use-toast";
import {
  Search, Plus, Download, Truck, Star, Edit2, Trash2, Phone, Mail,
} from "lucide-react";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { useAuth } from "@/contexts/AuthContext";

export default function Suppliers() {
  const { suppliers, deleteSupplier } = usePharmacy();
  const { staff } = useAuth();
  const isAdmin = ["hospital_admin", "super_admin", "platform_admin"].includes(staff?.role || "");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);

  const filtered = suppliers.filter(s => {
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.contact.toLowerCase().includes(q);
  });

  const handleExport = () => {
    exportToCSV(suppliers.map(s => ({
      Name: s.name, Contact: s.contact, Email: s.email || "", Phone: s.phone || "",
      Address: s.address || "", "Lead Time": s.leadTimeDays, Rating: s.rating, Status: s.status,
    })), "brightech-suppliers");
    toast({ title: "Exported" });
  };

  return (
    <AppLayout title="Supplier Management">
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Card><CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Truck className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold">{suppliers.length}</p><p className="text-xs text-muted-foreground">Total Suppliers</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center"><Truck className="h-5 w-5 text-success" /></div>
            <div><p className="text-2xl font-bold">{suppliers.filter(s => s.status === "active").length}</p><p className="text-xs text-muted-foreground">Active</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center"><Star className="h-5 w-5 text-warning" /></div>
            <div><p className="text-2xl font-bold">{(suppliers.reduce((s, su) => s + su.rating, 0) / suppliers.length).toFixed(1)}</p><p className="text-xs text-muted-foreground">Avg Rating</p></div>
          </CardContent></Card>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search suppliers..." className="pl-9" />
          </div>
          <Button size="sm" variant="outline" onClick={handleExport}><Download className="h-4 w-4 mr-1" />Export</Button>
          <Button size="sm" onClick={() => { setEditSupplier(null); setShowModal(true); }}><Plus className="h-4 w-4 mr-1" />Add Supplier</Button>
        </div>

        <Card>
          <CardContent className="p-0 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Supplier</th>
                  <th className="text-left p-3 font-medium">Contact</th>
                  <th className="text-left p-3 font-medium">Phone</th>
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-center p-3 font-medium">Lead Time</th>
                  <th className="text-center p-3 font-medium">Rating</th>
                  <th className="text-center p-3 font-medium">Status</th>
                  <th className="text-center p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">{s.name}</td>
                    <td className="p-3 text-xs text-muted-foreground">{s.contact}</td>
                    <td className="p-3 text-xs text-muted-foreground">{s.phone || "—"}</td>
                    <td className="p-3 text-xs text-muted-foreground">{s.email || "—"}</td>
                    <td className="p-3 text-center text-xs">{s.leadTimeDays} days</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < s.rating ? "text-warning fill-warning" : "text-muted"}`} />
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant={s.status === "active" ? "default" : "secondary"} className="text-[10px]">{s.status}</Badge>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => { setEditSupplier(s); setShowModal(true); }} className="p-1.5 rounded hover:bg-muted"><Edit2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
                        {isAdmin && <button onClick={() => setDeleteTarget(s)} className="p-1.5 rounded hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <AddEditSupplierModal open={showModal} onClose={() => { setShowModal(false); setEditSupplier(null); }} supplier={editSupplier} />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteSupplier(deleteTarget.id);
            toast({ title: "Supplier Deleted", description: `"${deleteTarget.name}" has been removed.` });
            setDeleteTarget(null);
          }
        }}
        itemName={deleteTarget?.name}
      />
    </AppLayout>
  );
}
