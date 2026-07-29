import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePharmacy } from "@/contexts/PharmacyStore";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Search } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface ReceiveItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  batchNo: string;
  expiryDate: string;
  costPrice: number;
}

export function ReceiveStockModal({ open, onClose }: Props) {
  const { medicines, receiveStock, suppliers } = usePharmacy();
  const [items, setItems] = useState<ReceiveItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");

  const searchResults = search.length > 1
    ? medicines.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.genericName.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 5)
    : [];

  const addItem = (med: typeof medicines[0]) => {
    if (items.find(i => i.medicineId === med.id)) return;
    setItems(prev => [...prev, {
      medicineId: med.id, medicineName: med.name,
      quantity: 1, batchNo: "", expiryDate: "", costPrice: med.costPrice,
    }]);
    setSearch("");
  };

  const updateItem = (idx: number, updates: Partial<ReceiveItem>) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, ...updates } : item));
  };

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (items.length === 0) {
      toast({ title: "No Items", description: "Add at least one item to receive.", variant: "destructive" });
      return;
    }
    const invalid = items.find(i => !i.quantity || i.quantity <= 0);
    if (invalid) {
      toast({ title: "Invalid Quantity", description: `Check quantity for ${invalid.medicineName}`, variant: "destructive" });
      return;
    }
    receiveStock(items);
    const totalQty = items.reduce((s, i) => s + i.quantity, 0);
    toast({ title: "Stock Received", description: `${items.length} items received (${totalQty} total units)` });
    setItems([]);
    setSelectedSupplier("");
    onClose();
  };

  const totalCost = items.reduce((s, i) => s + i.quantity * i.costPrice, 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Receive Stock</DialogTitle>
        </DialogHeader>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">Supplier</label>
            <select value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)}
              className="w-full h-10 rounded-md border bg-background px-3 text-sm">
              <option value="">Select supplier...</option>
              {suppliers.filter(s => s.status === "active").map(s =>
                <option key={s.id} value={s.id}>{s.name}</option>
              )}
            </select>
          </div>
          <div className="flex-1 relative">
            <label className="text-xs text-muted-foreground mb-1 block">Add Medicine</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search medicine..." className="pl-8" />
            </div>
            {searchResults.length > 0 && (
              <div className="absolute z-10 top-full left-0 right-0 bg-card border rounded-b-lg shadow-xl max-h-40 overflow-auto mt-0.5">
                {searchResults.map(m => (
                  <button key={m.id} onClick={() => addItem(m)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex justify-between">
                    <span>{m.name}</span>
                    <span className="text-xs text-muted-foreground">Stock: {m.stock}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto border rounded-lg">
          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Search and add medicines to receive stock
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left p-2.5 font-medium">Medicine</th>
                  <th className="text-center p-2.5 font-medium w-20">Qty</th>
                  <th className="text-center p-2.5 font-medium w-32">Batch No</th>
                  <th className="text-center p-2.5 font-medium w-32">Expiry</th>
                  <th className="text-right p-2.5 font-medium w-24">Cost</th>
                  <th className="text-right p-2.5 font-medium w-24">Total</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.medicineId} className="border-b">
                    <td className="p-2 text-xs font-medium">{item.medicineName}</td>
                    <td className="p-1">
                      <Input type="number" value={item.quantity} min="1"
                        onChange={e => updateItem(idx, { quantity: parseInt(e.target.value) || 0 })}
                        className="text-center h-8 text-xs" />
                    </td>
                    <td className="p-1">
                      <Input value={item.batchNo} onChange={e => updateItem(idx, { batchNo: e.target.value })}
                        placeholder="Batch #" className="h-8 text-xs" />
                    </td>
                    <td className="p-1">
                      <Input type="date" value={item.expiryDate}
                        onChange={e => updateItem(idx, { expiryDate: e.target.value })}
                        className="h-8 text-xs" />
                    </td>
                    <td className="p-1">
                      <Input type="number" value={item.costPrice}
                        onChange={e => updateItem(idx, { costPrice: parseFloat(e.target.value) || 0 })}
                        className="h-8 text-xs text-right" />
                    </td>
                    <td className="p-2 text-right text-xs font-semibold font-mono">
                      {(item.quantity * item.costPrice).toLocaleString()}
                    </td>
                    <td className="p-1">
                      <button onClick={() => removeItem(idx)} className="p-1 hover:bg-destructive/10 rounded">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {items.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-sm">
              <span className="text-muted-foreground">{items.length} items</span>
              <span className="mx-2">·</span>
              <span className="text-muted-foreground">{items.reduce((s, i) => s + i.quantity, 0)} units</span>
            </div>
            <div className="text-right">
              <span className="text-sm text-muted-foreground mr-2">Total Cost:</span>
              <span className="text-lg font-bold font-mono">KES {totalCost.toLocaleString()}</span>
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={items.length === 0}>Receive Stock</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
