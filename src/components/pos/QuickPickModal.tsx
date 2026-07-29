import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type Medicine } from "@/data/medicines";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { Search, Plus, AlertTriangle, Package } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (medicine: Medicine) => void;
  hospitalId?: string | null;
}

export function QuickPickModal({ open, onClose, onAdd, hospitalId }: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    loadMedicines();
  }, [open]);

  const loadMedicines = async () => {
    setLoading(true);
    let qb = supabase.from("medicines").select("*").eq("is_active", true);
    if (hospitalId) qb = qb.eq("hospital_id", hospitalId);
    const { data } = await qb.order("name").limit(200);
    if (data) {
      const meds: Medicine[] = data.map((m: any) => ({
        id: m.id, name: m.name, genericName: m.generic_name || "", brand: m.brand || "",
        category: m.category || "General", price: m.price, costPrice: m.cost_price || 0,
        stock: m.stock || 0, batchNo: m.batch_no || "", expiryDate: m.expiry_date || "",
        requiresPrescription: m.requires_prescription || false, unit: m.unit || "tablet",
        reorderLevel: m.reorder_level || 10, supplier: m.supplier || "",
        barcode: m.barcode || "", shelfLocation: m.shelf_location || "",
      }));
      setMedicines(meds);
      const cats = ["All", ...Array.from(new Set(meds.map(m => m.category).filter(Boolean)))];
      setCategories(cats);
    }
    setLoading(false);
  };

  const filtered = medicines.filter(m => {
    const matchCat = category === "All" || m.category === category;
    const q = search.toLowerCase();
    const matchSearch = !q || m.name.toLowerCase().includes(q) || m.genericName.toLowerCase().includes(q) || (m.barcode || "").includes(q);
    return matchCat && matchSearch;
  });

  const handleAdd = (med: Medicine) => {
    if (med.stock > 0) onAdd(med);
  };

  const isExpiringSoon = (date: string) => {
    if (!date) return false;
    const d = new Date(date);
    const now = new Date();
    const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff < 90 && diff > 0;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" /> Quick Pick — Pharmacy Inventory
            <span className="ml-2 text-xs text-muted-foreground font-normal">
              {medicines.length} medicines loaded from database
            </span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Search medicines from the pharmacy inventory and add them to the current sale.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-3 space-y-3">
          <div className="flex items-center gap-2 border-2 rounded-lg px-3 focus-within:border-primary transition-colors">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, generic name, or barcode..."
              className="flex-1 bg-transparent text-sm outline-none py-2.5 placeholder:text-muted-foreground" autoFocus />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 shrink-0">
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  category === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto px-6 pb-6">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Loading inventory...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">{search ? "No matches found" : "No medicines in this category"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {filtered.map(med => (
                <button key={med.id} onClick={() => handleAdd(med)}
                  disabled={med.stock === 0}
                  className={`group relative flex flex-col items-start rounded-lg border p-3 text-left transition-all ${
                    med.stock === 0 ? "opacity-40 cursor-not-allowed bg-muted"
                      : "bg-card hover:border-primary/40 hover:shadow-md active:scale-[0.97]"
                  }`}>
                  <div className="flex items-center gap-1 w-full">
                    {med.requiresPrescription && (
                      <span className="text-[9px] bg-info/10 text-info px-1 rounded font-bold">Rx</span>
                    )}
                    {isExpiringSoon(med.expiryDate) && (
                      <AlertTriangle className="h-3 w-3 text-warning ml-auto" />
                    )}
                    {med.stock <= med.reorderLevel && med.stock > 0 && (
                      <span className="text-[9px] bg-warning/10 text-warning px-1 rounded font-bold ml-auto">LOW</span>
                    )}
                  </div>
                  <p className="text-xs font-semibold leading-tight mt-1 line-clamp-2">{med.name}</p>
                  <p className="text-[10px] text-muted-foreground">{med.genericName}</p>
                  {med.shelfLocation && (
                    <p className="text-[9px] text-muted-foreground mt-0.5">📍 {med.shelfLocation}</p>
                  )}
                  <div className="flex items-center justify-between w-full mt-2">
                    <span className="text-sm font-bold text-primary">KES {med.price.toLocaleString()}</span>
                    <span className={`text-[10px] font-semibold ${
                      med.stock <= med.reorderLevel ? "text-destructive" : "text-muted-foreground"
                    }`}>
                      {med.stock} {med.unit}
                    </span>
                  </div>
                  {med.batchNo && (
                    <p className="text-[9px] text-muted-foreground mt-1 font-mono">Batch: {med.batchNo}</p>
                  )}
                  {med.stock > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="h-6 w-6 text-primary" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
