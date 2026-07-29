import {
  Zap, Plus, Percent, RotateCcw, UserCircle, Package, MessageSquare, CreditCard, Split,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props {
  cartLength: number;
  onQuickPick: () => void;
  onGiveDiscount: () => void;
  onAcceptReturn: () => void;
  onAddNewItem: () => void;
  onSplitPayment: () => void;
  onCreditSale: () => void;
}

export function POSSideActions({
  cartLength, onQuickPick, onGiveDiscount, onAcceptReturn,
  onAddNewItem, onSplitPayment, onCreditSale,
}: Props) {
  const btnClass = "action-btn-sidebar flex items-center gap-1.5 text-xs py-1.5 px-2";
  return (
    <div className="w-[130px] flex flex-col gap-1 shrink-0">
      <button onClick={onQuickPick} className={btnClass}>
        <Zap className="h-3.5 w-3.5" /> Quick Pick
      </button>
      <button onClick={onAddNewItem} className={btnClass}>
        <Plus className="h-3.5 w-3.5" /> Add Item
      </button>
      <button onClick={onGiveDiscount} disabled={cartLength === 0} className={btnClass}>
        <Percent className="h-3.5 w-3.5" /> Discount
      </button>
      <button onClick={onAcceptReturn} className={btnClass}>
        <RotateCcw className="h-3.5 w-3.5" /> Return
      </button>
      <button onClick={onSplitPayment} disabled={cartLength === 0} className={btnClass}>
        <Split className="h-3.5 w-3.5" /> Split Pay
      </button>
      <button onClick={onCreditSale} disabled={cartLength === 0} className={btnClass}>
        <CreditCard className="h-3.5 w-3.5" /> Credit Sale
      </button>
      <button
        onClick={() => toast({ title: "Cashier", description: "Current cashier: Admin. Multi-cashier support coming soon." })}
        className={btnClass}
      >
        <UserCircle className="h-3.5 w-3.5" /> Cashier
      </button>
      <button
        onClick={() => toast({ title: "Ship Items", description: "Shipping functionality coming soon." })}
        disabled={cartLength === 0}
        className={btnClass}
      >
        <Package className="h-3.5 w-3.5" /> Ship
      </button>
      <button
        onClick={() => toast({ title: "Messages", description: "No new messages." })}
        className={btnClass}
      >
        <MessageSquare className="h-3.5 w-3.5" /> Messages
      </button>
    </div>
  );
}
