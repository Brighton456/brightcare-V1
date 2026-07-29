import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Banknote, CreditCard, Smartphone, Trash2, UserCircle, CalendarDays } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  total: number;
  onComplete: (method: string, amount: number) => void;
  hospitalId?: string | null;
}

interface PaymentSplit {
  method: string;
  amount: number;
}

const methods = [
  { id: "cash", label: "Cash", icon: Banknote },
  { id: "mpesa", label: "M-Pesa", icon: Smartphone },
  { id: "card", label: "Card", icon: CreditCard },
  { id: "credit", label: "Credit", icon: UserCircle },
];

export function SplitPaymentModal({ open, onClose, total, onComplete, hospitalId }: Props) {
  const [splits, setSplits] = useState<PaymentSplit[]>([
    { method: "cash", amount: 0 },
    { method: "mpesa", amount: 0 },
  ]);
  // Credit buyer info
  const [showCreditInfo, setShowCreditInfo] = useState(false);
  const [creditBuyerName, setCreditBuyerName] = useState("");
  const [creditBuyerPhone, setCreditBuyerPhone] = useState("");
  const [creditDueDate, setCreditDueDate] = useState("");

  const allocated = splits.reduce((s, p) => s + p.amount, 0);
  const remaining = total - allocated;
  const hasCreditSplit = splits.some(s => s.method === "credit" && s.amount > 0);

  const updateSplit = (idx: number, updates: Partial<PaymentSplit>) => {
    setSplits(prev => prev.map((s, i) => i === idx ? { ...s, ...updates } : s));
  };

  const removeSplit = (idx: number) => {
    if (splits.length <= 2) return;
    setSplits(prev => prev.filter((_, i) => i !== idx));
  };

  const addSplit = () => {
    const usedMethods = splits.map(s => s.method);
    const available = methods.find(m => !usedMethods.includes(m.id));
    if (available) {
      setSplits(prev => [...prev, { method: available.id, amount: 0 }]);
    }
  };

  const autoFillRemaining = (idx: number) => {
    const otherTotal = splits.reduce((s, p, i) => i !== idx ? s + p.amount : s, 0);
    updateSplit(idx, { amount: Math.max(0, total - otherTotal) });
  };

  const handleComplete = () => {
    if (remaining > 0) {
      toast({ title: "Insufficient Payment", description: `KES ${remaining.toLocaleString()} remaining.`, variant: "destructive" });
      return;
    }
    // If credit is part of split, require buyer info
    if (hasCreditSplit && !creditBuyerName) {
      setShowCreditInfo(true);
      return;
    }
    const splitDesc = splits.filter(s => s.amount > 0).map(s => `${s.method}(${s.amount})`).join("+");
    const creditInfo = hasCreditSplit ? `|credit_buyer:${creditBuyerName}|${creditBuyerPhone}|${creditDueDate}` : "";
    onComplete(`split:${splitDesc}${creditInfo}`, total);
    onClose();
    // Reset
    setSplits([{ method: "cash", amount: 0 }, { method: "mpesa", amount: 0 }]);
    setCreditBuyerName(""); setCreditBuyerPhone(""); setCreditDueDate("");
    setShowCreditInfo(false);
  };

  const handleCreditInfoSubmit = () => {
    if (!creditBuyerName.trim()) {
      toast({ title: "Buyer name is required for credit", variant: "destructive" });
      return;
    }
    setShowCreditInfo(false);
    handleComplete();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Split Payment</DialogTitle>
        </DialogHeader>

        {showCreditInfo ? (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
              <p className="text-sm font-semibold text-warning">Credit Buyer Information</p>
              <p className="text-xs text-muted-foreground">Credit amount: KES {splits.find(s => s.method === "credit")?.amount.toLocaleString()}</p>
            </div>
            <div><Label>Buyer Name(s) *</Label><Input value={creditBuyerName} onChange={e => setCreditBuyerName(e.target.value)} placeholder="Full name" autoFocus /></div>
            <div><Label>Phone Number</Label><Input value={creditBuyerPhone} onChange={e => setCreditBuyerPhone(e.target.value)} placeholder="07XXXXXXXX" /></div>
            <div><Label>Expected Payment Date (optional)</Label><Input type="date" value={creditDueDate} onChange={e => setCreditDueDate(e.target.value)} /></div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreditInfo(false)}>Back</Button>
              <Button onClick={handleCreditInfoSubmit}>Confirm & Complete</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-primary/5 flex justify-between items-center">
              <span className="text-sm font-medium">Total Due</span>
              <span className="text-xl font-black font-mono text-primary">KES {total.toLocaleString()}</span>
            </div>

            {splits.map((split, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 rounded-lg border">
                <select value={split.method} onChange={e => updateSplit(idx, { method: e.target.value })}
                  className="h-9 rounded-md border bg-background px-2 text-sm w-28">
                  {methods.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
                <Input type="number" value={split.amount || ""} placeholder="0"
                  onChange={e => updateSplit(idx, { amount: parseFloat(e.target.value) || 0 })}
                  className="flex-1 text-right font-mono" />
                <Button size="sm" variant="ghost" onClick={() => autoFillRemaining(idx)} className="text-xs shrink-0">
                  Fill
                </Button>
                {splits.length > 2 && (
                  <button onClick={() => removeSplit(idx)} className="p-1 hover:bg-destructive/10 rounded">
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                )}
              </div>
            ))}

            {splits.length < 4 && (
              <Button size="sm" variant="outline" onClick={addSplit} className="w-full text-xs">
                + Add Payment Method
              </Button>
            )}

            <div className={`p-3 rounded-lg flex justify-between items-center ${
              remaining <= 0 ? "bg-success/10 border border-success/30" : "bg-warning/10 border border-warning/30"
            }`}>
              <span className="text-sm font-medium">{remaining <= 0 ? "Fully Covered" : "Remaining"}</span>
              <span className={`text-lg font-bold font-mono ${remaining <= 0 ? "text-success" : "text-warning"}`}>
                KES {Math.abs(remaining).toLocaleString()}
                {remaining < 0 && <span className="text-xs ml-1">(overpaid)</span>}
              </span>
            </div>

            <div className="flex gap-2 pt-2 justify-end">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleComplete} disabled={remaining > 0}>Complete Split Payment</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
