import { useState } from "react";
import { Banknote, CreditCard, Smartphone, Wallet, Gift, UserCircle, AlertTriangle, CheckCircle2, FileText, UserPlus, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { MpesaPaymentModal } from "@/components/payments/MpesaPaymentModal";
import { useNavigate } from "react-router-dom";

interface PatientBillingSummary {
  patientId: string;
  patientName: string;
  cumulativeTotal: number;
  pendingBills: number;
  isRegistered: boolean;
}

interface Props {
  total: number;
  itemCount: number;
  totalQtySold: number;
  subtotal: number;
  tax: number;
  totalDiscount: number;
  cartLength: number;
  currentCustomer: string;
  onSetCustomer: (name: string) => void;
  onCompleteSale: (method: string, amount: number) => void;
  onHoldSale: (note?: string) => void;
  onClearCart: () => void;
  onSaveAndPrint?: (method: string, amount: number) => void;
  linkedPatient?: PatientBillingSummary | null;
  onWalkinBillRequest?: () => void;
}

const paymentButtons = [
  { id: "cash", label: "Cash", icon: Banknote },
  { id: "credit", label: "Credit", icon: CreditCard },
  { id: "mpesa", label: "M-Pesa", icon: Smartphone },
  { id: "card", label: "Card", icon: Wallet },
  { id: "gift", label: "Gift", icon: Gift },
  { id: "account", label: "Account", icon: UserCircle },
];

type ConfirmAction = "save" | "save_print" | "save_email";

export function POSPaymentBar({
  total,
  itemCount,
  totalQtySold,
  subtotal,
  tax,
  totalDiscount,
  cartLength,
  currentCustomer,
  onSetCustomer,
  onCompleteSale,
  onHoldSale,
  onClearCart,
  onSaveAndPrint,
  linkedPatient,
  onWalkinBillRequest,
}: Props) {
  const [includePendingBills, setIncludePendingBills] = useState(false);
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [amountPaid, setAmountPaid] = useState("");
  const [showCashModal, setShowCashModal] = useState(false);
  const [showMpesaChoice, setShowMpesaChoice] = useState(false);
  const [showMpesaSTK, setShowMpesaSTK] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingAction, setPendingAction] = useState<ConfirmAction>("save");
  const [showBillPopup, setShowBillPopup] = useState(false);

  const effectiveTotal = total + (includePendingBills && linkedPatient ? linkedPatient.cumulativeTotal : 0);

  const handlePayment = (method: string) => {
    setSelectedMethod(method);
    if (cartLength === 0) return;

    if (method === "mpesa") {
      setShowMpesaChoice(true);
    } else if (method === "cash") {
      setShowCashModal(true);
    } else {
      // For card, credit, gift, account — show confirmation
      setPendingAction("save");
      setShowConfirmation(true);
    }
  };

  const handleMpesaAlreadyPaid = () => {
    setShowMpesaChoice(false);
    setPendingAction("save");
    setShowConfirmation(true);
  };

  const handleMpesaSendSTK = () => {
    setShowMpesaChoice(false);
    setShowMpesaSTK(true);
  };

  const handleMpesaSuccess = (receipt: string) => {
    setShowMpesaSTK(false);
    onCompleteSale("mpesa", effectiveTotal);
    if (includePendingBills && linkedPatient) settlePendingBills();
    toast({ title: "M-Pesa Payment Confirmed", description: `Receipt: ${receipt}` });
    setSelectedMethod(null);
    setIncludePendingBills(false);
  };

  const handleCashComplete = () => {
    const paid = parseFloat(amountPaid) || effectiveTotal;
    if (paid < effectiveTotal) {
      toast({ title: "Insufficient Payment", description: `Amount received (KES ${paid.toLocaleString()}) is less than total (KES ${effectiveTotal.toLocaleString()}).`, variant: "destructive" });
      return;
    }
    setShowCashModal(false);
    setAmountPaid("");
    setPendingAction("save");
    setShowConfirmation(true);
  };

  const confirmPayment = () => {
    const method = selectedMethod || "cash";
    const paid = parseFloat(amountPaid) || effectiveTotal;
    if (pendingAction === "save_print") {
      if (onSaveAndPrint) onSaveAndPrint(method, paid);
      else onCompleteSale(method, paid);
    } else if (pendingAction === "save_email") {
      onCompleteSale(method, paid);
      toast({ title: "Receipt Emailed", description: `Receipt sent to ${currentCustomer}.` });
    } else {
      onCompleteSale(method, paid);
    }
    // Settle pending bills if included
    if (includePendingBills && linkedPatient) {
      settlePendingBills();
    }
    setShowConfirmation(false);
    setSelectedMethod(null);
    setAmountPaid("");
    setIncludePendingBills(false);
  };

  const handleSaveOnly = () => {
    if (cartLength === 0) return;
    setSelectedMethod((prev) => prev || "cash");
    setPendingAction("save");
    setShowConfirmation(true);
  };

  const handleSaveAndPrint = () => {
    if (cartLength === 0) return;
    setSelectedMethod((prev) => prev || "cash");
    setPendingAction("save_print");
    setShowConfirmation(true);
  };

  const handleSaveAndEmail = () => {
    if (cartLength === 0) return;
    if (!currentCustomer) {
      toast({
        title: "Customer Required",
        description: "Enter a customer name to email the receipt.",
        variant: "destructive",
      });
      return;
    }
    setSelectedMethod((prev) => prev || "cash");
    setPendingAction("save_email");
    setShowConfirmation(true);
  };

  const handleHold = () => {
    const note = prompt("Add a note for this held sale (optional):");
    onHoldSale(note || undefined);
    toast({ title: "Sale on Hold", description: "Sale has been put on hold. Press F3 to retrieve." });
  };

  const handleCancel = () => {
    if (cartLength === 0) return;
    const confirmed = window.confirm("Are you sure you want to cancel this sale? All items will be removed.");
    if (confirmed) {
      onClearCart();
      toast({ title: "Sale Cancelled", description: "All items removed from cart." });
    }
  };

  const settlePendingBills = async () => {
    if (!linkedPatient) return;
    try {
      // Mark all pending bills as paid
      await supabase
        .from("bills")
        .update({
          status: "paid",
          amount_paid: linkedPatient.cumulativeTotal,
          paid_at: new Date().toISOString(),
        } as any)
        .eq("patient_id", linkedPatient.patientId)
        .eq("status", "pending");

      toast({
        title: "✅ Pending Bills Settled",
        description: `${linkedPatient.pendingBills} pending bill(s) for KES ${linkedPatient.cumulativeTotal.toLocaleString()} marked as paid.`,
      });
    } catch (e: any) {
      toast({ title: "Bill Settlement Error", description: e.message, variant: "destructive" });
    }
  };

  const changeDue = amountPaid ? Math.max(0, parseFloat(amountPaid) - effectiveTotal) : 0;

  return (
    <>
      <div className="shrink-0 border-t bg-card">
        {/* Totals summary */}
        <div className="flex items-end justify-end gap-8 px-6 py-2 text-sm">
          <div className="text-right space-y-0.5">
            <div className="text-muted-foreground">No. of Items Sold</div>
            <div className="text-muted-foreground">Total Qty Sold</div>
            <div className="text-muted-foreground">SubTotal</div>
            {totalDiscount > 0 && <div className="text-destructive">Discount</div>}
            <div className="text-muted-foreground">Tax</div>
          </div>
          <div className="text-right space-y-0.5 font-semibold min-w-[100px]">
            <div>{cartLength}</div>
            <div>{totalQtySold}</div>
            <div>{subtotal.toLocaleString()}</div>
            {totalDiscount > 0 && <div className="text-destructive">-{totalDiscount.toLocaleString()}</div>}
            <div>{tax.toLocaleString()}</div>
          </div>
        </div>

        {/* Total line */}
        <div className="flex items-center justify-end gap-4 px-6 py-1 border-t">
          {linkedPatient && linkedPatient.pendingBills > 0 && includePendingBills && (
            <div className="flex items-center gap-2 mr-4">
              <span className="text-xs text-muted-foreground">+ Pending Bills</span>
              <span className="text-sm font-bold text-destructive">KES {linkedPatient.cumulativeTotal.toLocaleString()}</span>
            </div>
          )}
          <span className="text-xl font-bold">Total</span>
          <span className="text-2xl font-black font-mono tracking-tight min-w-[140px] text-right">
            {(total + (includePendingBills && linkedPatient ? linkedPatient.cumulativeTotal : 0)).toLocaleString()}.00
          </span>
        </div>

        {/* Payment buttons */}
        <div className="flex gap-2 px-6 py-3 border-t">
          {paymentButtons.map((pm) => (
            <button
              key={pm.id}
              onClick={() => handlePayment(pm.id)}
              disabled={cartLength === 0}
              className={`payment-btn flex items-center justify-center gap-2 ${selectedMethod === pm.id ? "active" : ""}`}
            >
              <pm.icon className="h-4 w-4" />
              {pm.label}
            </button>
          ))}
          {/* Bill button - for registered patients or walk-ins */}
          <button
            onClick={() => {
              if (cartLength === 0) return;
              if (linkedPatient?.isRegistered) {
                setShowBillPopup(true);
              } else {
                // No linked patient — trigger walk-in capture
                if (onWalkinBillRequest) onWalkinBillRequest();
              }
            }}
            disabled={cartLength === 0}
            className={`payment-btn flex items-center justify-center gap-2 border-2 border-primary/50 bg-primary/10 text-primary font-bold ${selectedMethod === "bill" ? "active" : ""}`}
          >
            {linkedPatient?.isRegistered ? <FileText className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            Bill
          </button>

          {/* Include Pending Bills toggle */}
          {linkedPatient && linkedPatient.pendingBills > 0 && (
            <button
              onClick={() => setIncludePendingBills(p => !p)}
              className={`payment-btn flex items-center justify-center gap-2 border-2 ${includePendingBills ? "border-success bg-success/10 text-success" : "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-600 dark:bg-amber-900/20 dark:text-amber-400"} font-bold`}
              title="Include pending bills in this payment"
            >
              <Receipt className="h-4 w-4" />
              {includePendingBills ? "✓ Bills" : "+ Bills"}
              <span className="text-[10px] opacity-70">({linkedPatient.pendingBills})</span>
            </button>
          )}

          <div className="ml-auto flex items-center gap-3">
            <span className="text-lg font-bold text-destructive">Amount Due</span>
            <span className="text-2xl font-black font-mono text-destructive min-w-[120px] text-right">
              {cartLength > 0 ? `${(total + (includePendingBills && linkedPatient ? linkedPatient.cumulativeTotal : 0)).toLocaleString()}.00` : "0.00"}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 px-6 py-2.5 border-t bg-muted/30">
          <div className="flex items-center gap-2 border rounded-lg bg-card px-3 py-1.5 mr-auto w-64">
            <UserCircle className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              value={currentCustomer}
              onChange={(e) => onSetCustomer(e.target.value)}
              placeholder="Enter customer name or phone"
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            />
          </div>

          <button
            onClick={handleHold}
            disabled={cartLength === 0}
            className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:brightness-110 disabled:opacity-40 transition-all"
          >
            Put on Hold
          </button>
          <button
            onClick={handleCancel}
            disabled={cartLength === 0}
            className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-destructive text-destructive-foreground hover:brightness-110 disabled:opacity-40 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAndEmail}
            disabled={cartLength === 0}
            className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-success text-success-foreground hover:brightness-110 disabled:opacity-40 transition-all"
          >
            Save & Email
          </button>
          <button
            onClick={handleSaveOnly}
            disabled={cartLength === 0}
            className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-muted text-foreground border hover:bg-muted/80 disabled:opacity-40 transition-all"
          >
            Save Only
          </button>
          <button
            onClick={handleSaveAndPrint}
            disabled={cartLength === 0}
            className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-muted text-foreground border hover:bg-muted/80 disabled:opacity-40 transition-all"
          >
            Save & Print
          </button>
        </div>
      </div>

      {/* Cash payment modal */}
      {showCashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-bold mb-4">Cash Payment</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Amount Due</label>
                <div className="text-3xl font-black font-mono text-primary">KES {effectiveTotal.toLocaleString()}</div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Amount Received</label>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder={effectiveTotal.toString()}
                  className="w-full text-2xl font-bold font-mono border-2 border-border rounded-lg p-3 outline-none focus:border-primary bg-background text-foreground"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleCashComplete()}
                />
              </div>
              {changeDue > 0 && (
                <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                  <span className="text-sm text-muted-foreground">Change Due: </span>
                  <span className="text-xl font-bold text-success">KES {changeDue.toLocaleString()}</span>
                </div>
              )}
              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 200, 500, 1000, 2000, 5000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmountPaid(String(amt))}
                    className="py-2 text-sm font-semibold rounded-lg border hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {amt.toLocaleString()}
                  </button>
                ))}
                <button
                  onClick={() => setAmountPaid(String(effectiveTotal))}
                  className="py-2 text-sm font-semibold rounded-lg border bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  Exact
                </button>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowCashModal(false);
                    setAmountPaid("");
                  }}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-lg border hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCashComplete}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:brightness-110 transition-all"
                >
                  Proceed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* M-Pesa Choice Modal: Already Paid or Send STK */}
      {showMpesaChoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-success" /> M-Pesa Payment
            </h3>
            <p className="text-sm text-muted-foreground mb-4">How would you like to process this M-Pesa payment?</p>
            <div className="text-2xl font-black text-center text-primary mb-6">KES {effectiveTotal.toLocaleString()}</div>
            <div className="space-y-3">
              <button
                onClick={handleMpesaAlreadyPaid}
                className="w-full py-4 rounded-lg border-2 border-success bg-success/5 hover:bg-success/10 text-left px-4 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                  <div>
                    <p className="font-bold text-sm">Already Paid</p>
                    <p className="text-xs text-muted-foreground">Customer has already sent M-Pesa payment</p>
                  </div>
                </div>
              </button>
              <button
                onClick={handleMpesaSendSTK}
                className="w-full py-4 rounded-lg border-2 border-primary bg-primary/5 hover:bg-primary/10 text-left px-4 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Smartphone className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-bold text-sm">Send STK Push</p>
                    <p className="text-xs text-muted-foreground">Send payment prompt to customer's phone</p>
                  </div>
                </div>
              </button>
            </div>
            <button
              onClick={() => setShowMpesaChoice(false)}
              className="w-full mt-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* M-Pesa STK Push Modal with polling */}
      <MpesaPaymentModal
        open={showMpesaSTK}
        onClose={() => setShowMpesaSTK(false)}
        amount={effectiveTotal}
        onSuccess={handleMpesaSuccess}
        onFail={(err) => toast({ title: "M-Pesa Failed", description: err, variant: "destructive" })}
      />

      {/* Payment Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-8 w-8 text-warning" />
              <h3 className="text-lg font-bold">Confirm Payment</h3>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Method</span>
                <span className="font-semibold capitalize">{selectedMethod || "cash"}</span>
              </div>                <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-lg">KES {effectiveTotal.toLocaleString()}</span>
              </div>
              {currentCustomer && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-semibold">{currentCustomer}</span>
                </div>
              )}
              {includePendingBills && linkedPatient && linkedPatient.pendingBills > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pending Bills ({linkedPatient.pendingBills})</span>
                  <span className="font-semibold text-destructive">+ KES {linkedPatient.cumulativeTotal.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items</span>
                <span className="font-semibold">
                  {cartLength} items ({totalQtySold} qty)
                </span>
              </div>
            </div>
            <p className="text-sm text-center text-muted-foreground mb-4">
              Are you sure the customer has paid <strong>KES {effectiveTotal.toLocaleString()}</strong> via{" "}
              <strong className="capitalize">{selectedMethod || "cash"}</strong>?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowConfirmation(false);
                }}
                className="flex-1 py-2.5 text-sm font-semibold rounded-lg border hover:bg-muted transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={confirmPayment}
                className="flex-1 py-2.5 text-sm font-semibold rounded-lg bg-success text-success-foreground hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" /> Confirm Paid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill to Patient Popup */}
      {showBillPopup && linkedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-8 w-8 text-primary" />
              <h3 className="text-lg font-bold">Add to Patient Bill</h3>
            </div>
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Patient</span>
                <span className="font-bold">{linkedPatient.patientName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Cumulative Bill</span>
                <span className="font-bold text-destructive">KES {linkedPatient.cumulativeTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">This Dispensation</span>
                <span className="font-bold text-primary">KES {total.toLocaleString()}</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-sm">
                <span className="font-bold">New Cumulative Total</span>
                <span className="font-black text-lg text-destructive">KES {(linkedPatient.cumulativeTotal + total).toLocaleString()}</span>
              </div>
            </div>
            <p className="text-sm text-center text-muted-foreground mb-4">
              This will add <strong>KES {total.toLocaleString()}</strong> to <strong>{linkedPatient.patientName}</strong>'s cumulative bill. The patient can settle at discharge or billing.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowBillPopup(false)}
                className="flex-1 py-2.5 text-sm font-semibold rounded-lg border hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowBillPopup(false);
                  onCompleteSale("bill", total);
                  toast({ title: "✅ Added to Patient Bill", description: `KES ${total.toLocaleString()} added to ${linkedPatient.patientName}'s cumulative bill.` });
                }}
                className="flex-1 py-2.5 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                <FileText className="h-4 w-4" /> Confirm Bill
              </button>
              <button
                onClick={() => {
                  setShowBillPopup(false);
                  navigate(`/process-payment?patient=${linkedPatient.patientId}`);
                }}
                className="flex-1 py-2.5 text-sm font-semibold rounded-lg bg-success text-success-foreground hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                Process Payment →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
