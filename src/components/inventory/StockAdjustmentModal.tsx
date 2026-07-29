import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type Medicine } from "@/data/medicines";
import { usePharmacy } from "@/contexts/PharmacyStore";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  medicine: Medicine | null;
}

const adjustTypes = [
  { value: "adjusted", label: "Stock Count Adjustment" },
  { value: "damaged", label: "Damaged / Broken" },
  { value: "expired", label: "Expired / Disposed" },
  { value: "returned", label: "Returned to Supplier" },
] as const;

export function StockAdjustmentModal({ open, onClose, medicine }: Props) {
  const { adjustStock } = usePharmacy();
  const [type, setType] = useState<string>("adjusted");
  const [quantity, setQuantity] = useState("");
  const [direction, setDirection] = useState<"add" | "subtract">("subtract");
  const [reason, setReason] = useState("");

  if (!medicine) return null;

  const handleSubmit = () => {
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) {
      toast({ title: "Invalid Quantity", description: "Enter a positive number.", variant: "destructive" });
      return;
    }
    if (!reason.trim()) {
      toast({ title: "Reason Required", description: "Please provide a reason for this adjustment.", variant: "destructive" });
      return;
    }
    const change = direction === "add" ? qty : -qty;
    if (medicine.stock + change < 0) {
      toast({ title: "Insufficient Stock", description: `Cannot reduce below 0. Current stock: ${medicine.stock}`, variant: "destructive" });
      return;
    }
    adjustStock(medicine.id, change, type as any, reason);
    toast({ title: "Stock Adjusted", description: `${medicine.name}: ${direction === "add" ? "+" : "-"}${qty} units. New stock: ${medicine.stock + change}` });
    setQuantity(""); setReason(""); setType("adjusted"); setDirection("subtract");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Stock — {medicine.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-muted/50 flex justify-between text-sm">
            <span className="text-muted-foreground">Current Stock</span>
            <span className="font-bold">{medicine.stock} {medicine.unit}s</span>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Adjustment Type</label>
            <select value={type} onChange={e => setType(e.target.value)}
              className="w-full h-10 rounded-md border bg-background px-3 text-sm">
              {adjustTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Direction</label>
              <div className="flex gap-1">
                <Button size="sm" variant={direction === "add" ? "default" : "outline"} onClick={() => setDirection("add")} className="flex-1">+ Add</Button>
                <Button size="sm" variant={direction === "subtract" ? "destructive" : "outline"} onClick={() => setDirection("subtract")} className="flex-1">− Remove</Button>
              </div>
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Quantity</label>
              <Input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} min="1" placeholder="0" />
            </div>
          </div>
          {quantity && (
            <div className="p-2 rounded bg-primary/5 text-sm text-center">
              New Stock: <strong>{Math.max(0, medicine.stock + (direction === "add" ? parseInt(quantity) || 0 : -(parseInt(quantity) || 0)))}</strong> {medicine.unit}s
            </div>
          )}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Reason *</label>
            <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Physical count mismatch" />
          </div>
          <div className="flex gap-2 pt-2 justify-end">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit}>Apply Adjustment</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
