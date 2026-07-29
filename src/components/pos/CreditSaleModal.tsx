import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePharmacy } from "@/contexts/PharmacyStore";
import { toast } from "@/hooks/use-toast";
import { Search, UserCircle } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  total: number;
  onComplete: (method: string, amount: number, customerId?: string) => void;
}

export function CreditSaleModal({ open, onClose, total, onComplete }: Props) {
  const { customers } = usePharmacy();
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [partialPayment, setPartialPayment] = useState("");

  const results = search.length > 1
    ? customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search)
      ).slice(0, 5)
    : [];

  const customer = customers.find(c => c.id === selectedCustomer);
  const partial = parseFloat(partialPayment) || 0;
  const creditAmount = total - partial;

  const handleComplete = () => {
    if (!selectedCustomer) {
      toast({ title: "Select Customer", description: "A customer must be selected for credit sales.", variant: "destructive" });
      return;
    }
    if (partial > total) {
      toast({ title: "Payment exceeds total", variant: "destructive" });
      return;
    }
    onComplete("credit", partial, selectedCustomer);
    toast({
      title: "Credit Sale Recorded",
      description: `KES ${creditAmount.toLocaleString()} added to ${customer?.name}'s balance.`,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Credit Sale</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-primary/5 flex justify-between">
            <span className="text-sm">Sale Total</span>
            <span className="text-lg font-bold font-mono">KES {total.toLocaleString()}</span>
          </div>

          <div className="relative">
            <label className="text-xs text-muted-foreground mb-1 block">Customer *</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => { setSearch(e.target.value); setSelectedCustomer(""); }}
                placeholder="Search customer by name or phone..." className="pl-9" />
            </div>
            {results.length > 0 && !selectedCustomer && (
              <div className="absolute z-10 top-full left-0 right-0 bg-card border rounded-b-lg shadow-xl mt-0.5">
                {results.map(c => (
                  <button key={c.id} onClick={() => { setSelectedCustomer(c.id); setSearch(c.name); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex justify-between">
                    <div>
                      <span className="font-medium">{c.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{c.phone}</span>
                    </div>
                    {c.balance > 0 && (
                      <span className="text-xs text-destructive font-semibold">Owes: KES {c.balance.toLocaleString()}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {customer && (
            <div className="p-2 rounded-lg bg-muted/50 flex items-center gap-2">
              <UserCircle className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">{customer.name}</p>
                <p className="text-[10px] text-muted-foreground">{customer.phone}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Current Balance</p>
                <p className={`text-sm font-bold ${customer.balance > 0 ? "text-destructive" : "text-success"}`}>
                  KES {customer.balance.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Partial Payment (optional)</label>
            <Input type="number" value={partialPayment} onChange={e => setPartialPayment(e.target.value)}
              placeholder="0" className="font-mono" />
          </div>

          <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
            <div className="flex justify-between text-sm">
              <span>Amount on Credit</span>
              <span className="font-bold font-mono text-warning">KES {creditAmount.toLocaleString()}</span>
            </div>
            {customer && (
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>New Total Balance</span>
                <span className="font-semibold">KES {(customer.balance + creditAmount).toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2 justify-end">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleComplete} disabled={!selectedCustomer}>Record Credit Sale</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
