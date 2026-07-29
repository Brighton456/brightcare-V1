import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type CartItem } from "@/data/medicines";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  onApplyLineDiscount: (id: string, discount: number) => void;
  subtotal: number;
}

export function DiscountModal({ open, onClose, cart, onApplyLineDiscount, subtotal }: Props) {
  const [mode, setMode] = useState<"line" | "overall">("line");
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [discountType, setDiscountType] = useState<"amount" | "percent">("amount");
  const [discountValue, setDiscountValue] = useState("");

  const handleApply = () => {
    const val = parseFloat(discountValue) || 0;
    if (val <= 0) {
      toast({ title: "Invalid Discount", variant: "destructive" });
      return;
    }

    if (mode === "line") {
      if (!selectedItem) {
        toast({ title: "Select an Item", description: "Choose an item to apply the discount to.", variant: "destructive" });
        return;
      }
      const item = cart.find(c => c.id === selectedItem);
      if (!item) return;
      const discount = discountType === "percent" ? Math.round(item.price * val / 100) : val;
      if (discount >= item.price) {
        toast({ title: "Discount Too High", description: "Discount cannot exceed the item price.", variant: "destructive" });
        return;
      }
      onApplyLineDiscount(selectedItem, discount);
      toast({ title: "Discount Applied", description: `KES ${discount} discount on ${item.name}` });
    } else {
      // Overall discount: spread proportionally
      const totalDiscount = discountType === "percent" ? Math.round(subtotal * val / 100) : val;
      if (totalDiscount >= subtotal) {
        toast({ title: "Discount Too High", variant: "destructive" });
        return;
      }
      cart.forEach(item => {
        const proportion = (item.price * item.qty) / subtotal;
        const itemDiscount = Math.round((totalDiscount * proportion) / item.qty);
        onApplyLineDiscount(item.id, itemDiscount);
      });
      toast({ title: "Overall Discount Applied", description: `KES ${totalDiscount} distributed across all items` });
    }
    setDiscountValue("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Apply Discount</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-1">
            <Button size="sm" variant={mode === "line" ? "default" : "outline"} onClick={() => setMode("line")} className="flex-1">Line Item</Button>
            <Button size="sm" variant={mode === "overall" ? "default" : "outline"} onClick={() => setMode("overall")} className="flex-1">Overall Sale</Button>
          </div>

          {mode === "line" && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Select Item</label>
              <select value={selectedItem} onChange={e => setSelectedItem(e.target.value)}
                className="w-full h-10 rounded-md border bg-background px-3 text-sm">
                <option value="">Choose item...</option>
                {cart.map(c => (
                  <option key={c.id} value={c.id}>{c.name} (KES {c.price} × {c.qty})</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Discount Type</label>
              <div className="flex gap-1">
                <Button size="sm" variant={discountType === "amount" ? "default" : "outline"}
                  onClick={() => setDiscountType("amount")} className="flex-1">KES Amount</Button>
                <Button size="sm" variant={discountType === "percent" ? "default" : "outline"}
                  onClick={() => setDiscountType("percent")} className="flex-1">% Percent</Button>
              </div>
            </div>
            <div className="w-28">
              <label className="text-xs text-muted-foreground mb-1 block">Value</label>
              <Input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)}
                placeholder={discountType === "percent" ? "%" : "KES"} />
            </div>
          </div>

          {discountValue && (
            <div className="p-2 rounded bg-success/10 text-sm text-center">
              Discount: <strong>KES {discountType === "percent"
                ? Math.round((mode === "line" && selectedItem
                  ? (cart.find(c => c.id === selectedItem)?.price || 0)
                  : subtotal) * (parseFloat(discountValue) || 0) / 100).toLocaleString()
                : (parseFloat(discountValue) || 0).toLocaleString()
              }</strong>
            </div>
          )}

          <div className="flex gap-2 pt-2 justify-end">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleApply}>Apply Discount</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
