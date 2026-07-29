import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePharmacy, type Supplier } from "@/contexts/PharmacyStore";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  supplier?: Supplier | null;
}

export function AddEditSupplierModal({ open, onClose, supplier }: Props) {
  const { addSupplier, updateSupplier } = usePharmacy();
  const [form, setForm] = useState<{
    name: string; contact: string; email: string; phone: string; address: string;
    leadTimeDays: number; rating: number; status: "active" | "inactive";
  }>({
    name: "", contact: "", email: "", phone: "", address: "",
    leadTimeDays: 3, rating: 4, status: "active" as const,
  });

  useEffect(() => {
    if (supplier) {
      setForm({
        name: supplier.name, contact: supplier.contact, email: supplier.email || "",
        phone: supplier.phone || "", address: supplier.address || "",
        leadTimeDays: supplier.leadTimeDays, rating: supplier.rating, status: supplier.status,
      });
    } else {
      setForm({ name: "", contact: "", email: "", phone: "", address: "", leadTimeDays: 3, rating: 4, status: "active" });
    }
  }, [supplier, open]);

  const handleSave = () => {
    if (!form.name || !form.contact) {
      toast({ title: "Validation Error", description: "Name and contact person are required.", variant: "destructive" });
      return;
    }
    if (supplier) {
      updateSupplier(supplier.id, form);
      toast({ title: "Supplier Updated" });
    } else {
      addSupplier(form);
      toast({ title: "Supplier Added", description: `${form.name} added to supplier list.` });
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{supplier ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Company Name *</label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Contact Person *</label>
            <Input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Phone</label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Email</label>
              <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Address</label>
            <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Lead Time (days)</label>
              <Input type="number" value={form.leadTimeDays} onChange={e => setForm(f => ({ ...f, leadTimeDays: parseInt(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Rating (1-5)</label>
              <Input type="number" min="1" max="5" value={form.rating} onChange={e => setForm(f => ({ ...f, rating: parseInt(e.target.value) || 1 }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
                className="w-full h-10 rounded-md border bg-background px-3 text-sm">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-2 justify-end">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>{supplier ? "Save Changes" : "Add Supplier"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
