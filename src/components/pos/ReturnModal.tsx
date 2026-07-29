import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Sale } from "@/data/medicines";
import { usePharmacy } from "@/contexts/PharmacyStore";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { toast } from "@/hooks/use-toast";
import { Search, RotateCcw, AlertTriangle, ArrowRightLeft } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ReturnModal({ open, onClose }: Props) {
  const { salesHistory, refundSale } = usePharmacy();
  const [search, setSearch] = useState("");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [confirmRefund, setConfirmRefund] = useState(false);
  const [mode, setMode] = useState<"refund" | "transfer">("refund");
  const [newMethod, setNewMethod] = useState("mpesa");

  const completedSales = salesHistory.filter(s => s.status === "completed");
  const searchResults = search.length > 2
    ? completedSales.filter(s =>
        s.receiptNo.toLowerCase().includes(search.toLowerCase()) ||
        (s.customer || "").toLowerCase().includes(search.toLowerCase())
      ).slice(0, 8)
    : completedSales.slice(0, 5);

  const handleRefund = () => {
    if (!selectedSale) return;
    refundSale(selectedSale.id);
    toast({
      title: "Refund Processed",
      description: `Receipt ${selectedSale.receiptNo} refunded. KES ${selectedSale.total.toLocaleString()} returned. Stock restored.`,
    });
    resetAndClose();
  };

  const handleTransferMethod = async () => {
    if (!selectedSale) return;
    // Update the payment method in pharmacy_sales (find by receipt_no)
    await supabase.from("pharmacy_sales")
      .update({ payment_method: newMethod } as any)
      .eq("receipt_no", selectedSale.receiptNo);
    toast({
      title: "Payment Method Updated",
      description: `Receipt ${selectedSale.receiptNo} changed from ${selectedSale.paymentMethod} → ${newMethod.toUpperCase()}.`,
    });
    resetAndClose();
  };

  const resetAndClose = () => {
    setSelectedSale(null);
    setConfirmRefund(false);
    setSearch("");
    setMode("refund");
    setNewMethod("mpesa");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" /> Returns, Refunds & Transfers
          </DialogTitle>
        </DialogHeader>

        {!selectedSale ? (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by receipt # or customer name..."
                className="pl-9" autoFocus />
            </div>
            <div className="flex-1 overflow-auto space-y-1.5">
              {searchResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {search.length > 2 ? "No matching receipts found" : "Enter at least 3 characters to search"}
                </div>
              ) : (
                searchResults.map(sale => (
                  <button key={sale.id} onClick={() => setSelectedSale(sale)}
                    className="w-full text-left p-3 rounded-lg border hover:border-primary/40 hover:bg-primary/5 transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-xs font-semibold text-primary">{sale.receiptNo}</span>
                        <span className="text-xs text-muted-foreground ml-2">{sale.customer || "Walk-in"}</span>
                      </div>
                      <span className="text-sm font-bold font-mono">KES {sale.total.toLocaleString()}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {sale.items.length} items · {sale.paymentMethod} · {sale.timestamp.toLocaleString()}
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="p-3 rounded-lg border bg-muted/30">
              <div className="flex justify-between mb-2">
                <span className="font-mono text-sm font-bold text-primary">{selectedSale.receiptNo}</span>
                <Badge variant="secondary">{selectedSale.paymentMethod}</Badge>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">Item</th>
                    <th className="text-right py-1">Qty</th>
                    <th className="text-right py-1">Price</th>
                    <th className="text-right py-1">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSale.items.map(item => (
                    <tr key={item.id} className="border-b">
                      <td className="py-1">{item.name}</td>
                      <td className="text-right py-1">{item.qty}</td>
                      <td className="text-right py-1">{item.price.toLocaleString()}</td>
                      <td className="text-right py-1 font-semibold">{(item.price * item.qty).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-between mt-2 pt-2 border-t font-semibold text-sm">
                <span>Total</span>
                <span className="font-mono">KES {selectedSale.total.toLocaleString()}</span>
              </div>
            </div>

            {/* Action selection */}
            <div className="flex gap-2">
              <Button
                variant={mode === "refund" ? "default" : "outline"}
                size="sm" className="flex-1 gap-1"
                onClick={() => setMode("refund")}
              >
                <RotateCcw className="h-3.5 w-3.5" /> Refund
              </Button>
              <Button
                variant={mode === "transfer" ? "default" : "outline"}
                size="sm" className="flex-1 gap-1"
                onClick={() => setMode("transfer")}
              >
                <ArrowRightLeft className="h-3.5 w-3.5" /> Change Payment Method
              </Button>
            </div>

            {mode === "transfer" ? (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-info/10 border border-info/30">
                  <p className="text-sm font-semibold">Transfer Payment Method</p>
                  <p className="text-xs text-muted-foreground">Change from <strong>{selectedSale.paymentMethod}</strong> to a different method</p>
                </div>
                <div>
                  <Label>New Payment Method</Label>
                  <Select value={newMethod} onValueChange={setNewMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="mpesa">M-Pesa</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelectedSale(null)} className="flex-1">Back</Button>
                  <Button onClick={handleTransferMethod} className="flex-1" disabled={newMethod === selectedSale.paymentMethod}>
                    <ArrowRightLeft className="h-4 w-4 mr-1" /> Confirm Transfer
                  </Button>
                </div>
              </div>
            ) : !confirmRefund ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSelectedSale(null)} className="flex-1">Back</Button>
                <Button variant="destructive" onClick={() => setConfirmRefund(true)} className="flex-1">
                  <RotateCcw className="h-4 w-4 mr-1" /> Process Refund
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-destructive">Confirm Full Refund</p>
                    <p className="text-xs text-muted-foreground">This will refund KES {selectedSale.total.toLocaleString()} and restore stock for all items.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setConfirmRefund(false)} className="flex-1">Cancel</Button>
                  <Button variant="destructive" onClick={handleRefund} className="flex-1">Confirm Refund</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
