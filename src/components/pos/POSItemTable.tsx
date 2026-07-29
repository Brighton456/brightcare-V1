import { useState } from "react";
import { type CartItem } from "@/data/medicines";
import { Minus, Plus, Trash2, Edit3, RotateCcw, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props {
  cart: CartItem[];
  selectedItemId: string | null;
  onSelectItem: (id: string | null) => void;
  onUpdateQty: (id: string, qty: number) => void;
  onUpdateDiscount: (id: string, discount: number) => void;
  onUpdatePrice: (id: string, price: number) => void;
  onUpdateNote: (id: string, note: string) => void;
  onRemoveItem: (id: string) => void;
  isAdmin: boolean;
}

export function POSItemTable({ cart, selectedItemId, onSelectItem, onUpdateQty, onUpdateDiscount, onUpdatePrice, onUpdateNote, onRemoveItem, isAdmin }: Props) {
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDiscount, setEditDiscount] = useState("");

  const startEditing = (item: CartItem) => {
    setEditingItem(item.id);
    setEditQty(String(item.qty));
    setEditDiscount(String(item.discount));
    setEditPrice(String(item.price));
  };

  const applyEdit = (item: CartItem) => {
    const qty = parseInt(editQty) || item.qty;
    const discount = parseFloat(editDiscount) || 0;
    const newPrice = parseFloat(editPrice);
    if (qty > 0) onUpdateQty(item.id, qty);
    onUpdateDiscount(item.id, discount);
    if (isAdmin && !isNaN(newPrice) && newPrice >= item.costPrice) {
      onUpdatePrice(item.id, newPrice);
    } else if (isAdmin && !isNaN(newPrice) && newPrice < item.costPrice) {
      toast({ title: "Price Too Low", description: `Price cannot be below cost (KES ${item.costPrice})`, variant: "destructive" });
    }
    setEditingItem(null);
    toast({ title: "Item Updated", description: `${item.name}: Qty=${qty}, Discount=KES ${discount}` });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 border rounded-lg bg-card overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[50px_1fr_120px_100px_80px_100px_120px] bg-muted/60 border-b text-xs font-semibold text-muted-foreground">
        <div className="p-2.5 text-center">Item #</div>
        <div className="p-2.5">Item Name</div>
        <div className="p-2.5 text-center">Attribute</div>
        <div className="p-2.5 text-center">Size</div>
        <div className="p-2.5 text-right">Qty</div>
        <div className="p-2.5 text-right">Price</div>
        <div className="p-2.5 text-right">Ext Price</div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-20">
            <div className="text-4xl mb-3 opacity-20">💊</div>
            <p className="text-sm font-medium">Ready for sale</p>
            <p className="text-xs mt-1">Scan or search for items to begin</p>
          </div>
        ) : (
          cart.map((item, idx) => (
            <div key={item.id}>
              <div
                onClick={() => onSelectItem(selectedItemId === item.id ? null : item.id)}
                className={`grid grid-cols-[50px_1fr_120px_100px_80px_100px_120px] text-sm cursor-pointer transition-colors pos-table-row ${
                  selectedItemId === item.id ? "selected" : ""
                }`}
              >
                <div className="p-2.5 text-center font-mono text-xs text-muted-foreground">{idx + 1}</div>
                <div className="p-2.5">
                  <div className="font-medium flex items-center gap-1.5">
                    {item.name}
                    {item.requiresPrescription && (
                      <span className="text-[10px] bg-info/10 text-info px-1 rounded font-semibold">Rx</span>
                    )}
                    {item.discount > 0 && (
                      <span className="text-[10px] bg-success/10 text-success px-1 rounded font-semibold">-{item.discount}</span>
                    )}
                  </div>
                </div>
                <div className="p-2.5 text-center text-xs text-muted-foreground">{item.category}</div>
                <div className="p-2.5 text-center text-xs text-muted-foreground">{item.unit}</div>
                <div className="p-2.5 text-right font-semibold">{item.qty}</div>
                <div className="p-2.5 text-right font-mono">{item.price.toLocaleString()}</div>
                <div className="p-2.5 text-right font-semibold font-mono">{item.lineTotal.toLocaleString()}</div>
              </div>

              {/* Expanded row with actions */}
              {selectedItemId === item.id && (
                <div className="bg-primary/5 border-t border-b px-4 py-2">
                  {editingItem === item.id ? (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <label className="text-xs text-muted-foreground">Qty:</label>
                        <input type="number" value={editQty} onChange={e => setEditQty(e.target.value)}
                          className="w-16 h-7 rounded border bg-background px-2 text-xs font-mono text-center"
                          onKeyDown={e => e.key === "Enter" && applyEdit(item)} />
                      </div>
                      <div className="flex items-center gap-1">
                        <label className="text-xs text-muted-foreground">Discount (KES):</label>
                        <input type="number" value={editDiscount} onChange={e => setEditDiscount(e.target.value)}
                          className="w-20 h-7 rounded border bg-background px-2 text-xs font-mono text-center"
                          onKeyDown={e => e.key === "Enter" && applyEdit(item)} />
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <label className="text-xs text-muted-foreground">Price:</label>
                          <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)}
                            className="w-20 h-7 rounded border bg-background px-2 text-xs font-mono text-center"
                            onKeyDown={e => e.key === "Enter" && applyEdit(item)}
                            min={item.costPrice} />
                          <span className="text-[10px] text-muted-foreground">≥{item.costPrice}</span>
                        </div>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); applyEdit(item); }}
                        className="action-btn-sidebar !w-auto !py-1.5 !px-3 !text-xs !bg-success">
                        Apply
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setEditingItem(null); }}
                        className="action-btn-sidebar !w-auto !py-1.5 !px-3 !text-xs !bg-muted !text-foreground">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-muted-foreground mr-2">
                        Unit: {item.unit}
                        {item.batchNo && <span className="ml-3">Batch: {item.batchNo}</span>}
                        {item.discount > 0 && <span className="ml-3 text-success">Discount: KES {item.discount}/unit</span>}
                      </div>
                      <div className="ml-auto flex items-center gap-1.5">
                        <button onClick={(e) => { e.stopPropagation(); startEditing(item); }}
                          className="action-btn-sidebar !w-auto !py-1.5 !px-3 !text-xs flex items-center gap-1">
                          <Edit3 className="h-3 w-3" /> Edit
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onRemoveItem(item.id); toast({ title: "Item Returned", description: `${item.name} removed from cart.` }); }}
                          className="action-btn-sidebar !w-auto !py-1.5 !px-3 !text-xs flex items-center gap-1 !bg-warning !text-warning-foreground">
                          <RotateCcw className="h-3 w-3" /> Return Item
                        </button>
                        <span className="w-px h-6 bg-border mx-1" />
                        <button onClick={(e) => { e.stopPropagation(); startEditing(item); }}
                          className="action-btn-sidebar !w-auto !py-1.5 !px-3 !text-xs flex items-center gap-1 !bg-secondary !text-secondary-foreground">
                          Qty/Price/Discount
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onUpdateQty(item.id, item.qty + 1); }}
                          className="action-btn-sidebar !w-auto !py-1.5 !px-3 !text-xs !bg-success"
                        >
                          Qty+
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); if (item.qty > 1) onUpdateQty(item.id, item.qty - 1); }}
                          disabled={item.qty <= 1}
                          className="action-btn-sidebar !w-auto !py-1.5 !px-3 !text-xs !bg-warning !text-warning-foreground disabled:opacity-40"
                        >
                          Qty-
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onRemoveItem(item.id); }}
                          className="action-btn-sidebar !w-auto !py-1.5 !px-3 !text-xs !bg-destructive"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}

        {/* Empty rows for visual effect */}
        {cart.length > 0 && cart.length < 8 && (
          Array.from({ length: 8 - cart.length }).map((_, i) => (
            <div key={`empty-${i}`} className="grid grid-cols-[50px_1fr_120px_100px_80px_100px_120px] text-sm pos-table-row h-10 border-b border-transparent" />
          ))
        )}
      </div>
    </div>
  );
}
