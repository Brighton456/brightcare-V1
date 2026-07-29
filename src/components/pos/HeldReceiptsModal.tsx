import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type HeldSale } from "@/data/medicines";
import { Clock, ShoppingCart, User, FileText } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  heldSales: HeldSale[];
  onResume: (id: string) => void;
}

export function HeldReceiptsModal({ open, onClose, heldSales, onResume }: Props) {
  const handleResume = (id: string) => {
    onResume(id);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Held Receipts ({heldSales.length})
          </DialogTitle>
        </DialogHeader>

        {heldSales.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No held receipts</p>
            <p className="text-xs mt-1">Put a sale on hold to see it here</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-auto">
            {heldSales.map(held => (
              <button
                key={held.id}
                onClick={() => handleResume(held.id)}
                className="w-full text-left p-4 rounded-lg border hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <ShoppingCart className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm">{held.items.length} items</span>
                      {held.customer && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" /> {held.customer}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5 ml-6">
                      {held.items.slice(0, 3).map(item => (
                        <div key={item.id}>{item.name} × {item.qty}</div>
                      ))}
                      {held.items.length > 3 && (
                        <div className="text-primary">+{held.items.length - 3} more items</div>
                      )}
                    </div>
                    {held.note && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2 ml-6">
                        <FileText className="h-3 w-3" /> {held.note}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-primary">
                      KES {held.items.reduce((s, i) => s + i.lineTotal, 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {held.heldAt.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
