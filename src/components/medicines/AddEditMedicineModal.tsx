import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type Medicine } from "@/data/medicines";
import { usePharmacy } from "@/contexts/PharmacyStore";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  medicine?: Medicine | null;
}

const defaultMed = {
  name: "", genericName: "", brand: "", category: "Pain Relief",
  price: 0, costPrice: 0, stock: 0, batchNo: "", expiryDate: "",
  requiresPrescription: false, unit: "tablet", reorderLevel: 20,
  supplier: "", barcode: "", shelfLocation: "",
};

const categories = ["Pain Relief", "Antibiotics", "Allergy", "GI Tract", "Diabetes", "Cardiovascular",
  "Respiratory", "Antimalarials", "Anti-inflammatory", "Antifungals", "Supplements", "Other"];

export function AddEditMedicineModal({ open, onClose, medicine }: Props) {
  const { addMedicine, updateMedicine } = usePharmacy();
  const [form, setForm] = useState(defaultMed);

  useEffect(() => {
    if (medicine) {
      setForm({
        name: medicine.name, genericName: medicine.genericName, brand: medicine.brand,
        category: medicine.category, price: medicine.price, costPrice: medicine.costPrice,
        stock: medicine.stock, batchNo: medicine.batchNo, expiryDate: medicine.expiryDate,
        requiresPrescription: medicine.requiresPrescription, unit: medicine.unit,
        reorderLevel: medicine.reorderLevel, supplier: medicine.supplier || "",
        barcode: medicine.barcode || "", shelfLocation: medicine.shelfLocation || "",
      });
    } else {
      setForm(defaultMed);
    }
  }, [medicine, open]);

  const handleSave = () => {
    if (!form.name || !form.genericName || !form.price) {
      toast({ title: "Validation Error", description: "Name, Generic Name, and Price are required.", variant: "destructive" });
      return;
    }
    if (medicine) {
      updateMedicine(medicine.id, form);
      toast({ title: "Medicine Updated", description: `${form.name} has been updated.` });
    } else {
      addMedicine(form);
      toast({ title: "Medicine Added", description: `${form.name} has been added to the catalog.` });
    }
    onClose();
  };

  const set = (key: string, value: unknown) => setForm(f => ({ ...f, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{medicine ? "Edit Medicine" : "Add New Medicine"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">Medicine Name *</label>
            <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Paracetamol 500mg" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Generic Name *</label>
            <Input value={form.genericName} onChange={e => set("genericName", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Brand</label>
            <Input value={form.brand} onChange={e => set("brand", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Category</label>
            <select value={form.category} onChange={e => set("category", e.target.value)}
              className="w-full h-10 rounded-md border bg-background px-3 text-sm">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Unit</label>
            <select value={form.unit} onChange={e => set("unit", e.target.value)}
              className="w-full h-10 rounded-md border bg-background px-3 text-sm">
              {["tablet", "capsule", "bottle", "tube", "pack", "inhaler", "vial", "sachet", "box"].map(u =>
                <option key={u} value={u}>{u}</option>
              )}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Selling Price (KES) *</label>
            <Input type="number" value={form.price} onChange={e => set("price", Number(e.target.value))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Cost Price (KES)</label>
            <Input type="number" value={form.costPrice} onChange={e => set("costPrice", Number(e.target.value))} />
          </div>
          {!medicine && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Opening Stock</label>
              <Input type="number" value={form.stock} onChange={e => set("stock", Number(e.target.value))} />
            </div>
          )}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Reorder Level</label>
            <Input type="number" value={form.reorderLevel} onChange={e => set("reorderLevel", Number(e.target.value))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Batch Number</label>
            <Input value={form.batchNo} onChange={e => set("batchNo", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Expiry Date</label>
            <Input type="date" value={form.expiryDate} onChange={e => set("expiryDate", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Barcode</label>
            <Input value={form.barcode} onChange={e => set("barcode", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Shelf Location</label>
            <Input value={form.shelfLocation} onChange={e => set("shelfLocation", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Supplier</label>
            <Input value={form.supplier} onChange={e => set("supplier", e.target.value)} />
          </div>
          <div className="flex items-center gap-2 pt-5">
            <input type="checkbox" id="rx" checked={form.requiresPrescription}
              onChange={e => set("requiresPrescription", e.target.checked)}
              className="h-4 w-4 rounded border-border" />
            <label htmlFor="rx" className="text-sm">Requires Prescription (Rx)</label>
          </div>
        </div>
        <div className="flex gap-2 pt-3 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>{medicine ? "Save Changes" : "Add Medicine"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
