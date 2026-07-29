import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { WorkflowSuggestions } from "@/components/WorkflowSuggestions";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useState, useEffect } from "react";
import { CreditCard, Banknote, Smartphone, CheckCircle2, AlertTriangle, CalendarClock, Receipt, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MpesaPaymentModal } from "@/components/payments/MpesaPaymentModal";
import { useHospital } from "@/contexts/HospitalContext";

interface InstallmentSettings {
  installment_enabled: boolean;
  installment_max: number;
  installment_min_amount: string;
  installment_downpayment_pct: string;
  installment_billing: boolean;
}

export default function ProcessPayment() {
  const { hospitalId } = useHospital();
  const [bills, setBills] = useState<any[]>([]);
  const [mpesaBill, setMpesaBill] = useState<any>(null);
  const [confirmPay, setConfirmPay] = useState<{ bill: any; method: string } | null>(null);
  const [installmentBill, setInstallmentBill] = useState<any>(null);
  const [installmentAmount, setInstallmentAmount] = useState("");
  const [installmentMethod, setInstallmentMethod] = useState("cash");
  const [showInstallmentMpesa, setShowInstallmentMpesa] = useState(false);
  const [installSettings, setInstallSettings] = useState<InstallmentSettings>({
    installment_enabled: false, installment_max: 3, installment_min_amount: "1000", installment_downpayment_pct: "30", installment_billing: true,
  });
  const { toast } = useToast();

  const fetchBills = async () => {
    const { data } = await supabase.from("bills")
      .select("*, patients(first_name,last_name,patient_no)")
      .eq("hospital_id", hospitalId)
      .in("status", ["pending", "partial"])
      .order("created_at", { ascending: false });
    setBills(data || []);
  };

  useEffect(() => {
    if (!hospitalId) return;
    fetchBills();
    // Load installment settings
    supabase.from("hospitals").select("settings").eq("id", hospitalId).single().then(({ data }) => {
      const s = (data as any)?.settings || {};
      setInstallSettings({
        installment_enabled: !!s.installment_enabled,
        installment_max: s.installment_max || 3,
        installment_min_amount: s.installment_min_amount || "1000",
        installment_downpayment_pct: s.installment_downpayment_pct || "30",
        installment_billing: s.installment_billing !== false,
      });
    });
  }, [hospitalId]);

  const pay = async (id: string, method: string, amount: number, receiptId?: string) => {
    await supabase.from("bills").update({
      status: "paid", payment_method: method, amount_paid: amount,
      paid_at: new Date().toISOString(), mpesa_transaction_id: receiptId || null,
    } as any).eq("id", id);
    toast({ title: "Payment processed" });
    fetchBills();
  };

  const doInstallmentPayment = async (method: string, receiptId?: string) => {
    if (!installmentBill) return;
    const payAmount = parseFloat(installmentAmount);
    const bill = installmentBill;
    const totalBill = bill.total || 0;
    const alreadyPaid = bill.amount_paid || 0;
    const balance = totalBill - alreadyPaid;
    const minDown = totalBill * (parseFloat(installSettings.installment_downpayment_pct) / 100);

    if (!payAmount || payAmount <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" }); return;
    }
    if (alreadyPaid === 0 && payAmount < minDown) {
      toast({ title: `Minimum first payment is KES ${Math.ceil(minDown).toLocaleString()} (${installSettings.installment_downpayment_pct}%)`, variant: "destructive" }); return;
    }
    if (payAmount > balance) {
      toast({ title: `Amount exceeds balance of KES ${balance.toLocaleString()}`, variant: "destructive" }); return;
    }

    const newPaid = alreadyPaid + payAmount;
    const isFullyPaid = newPaid >= totalBill;

    await supabase.from("bills").update({
      amount_paid: newPaid,
      status: isFullyPaid ? "paid" : "partial",
      payment_method: method,
      paid_at: isFullyPaid ? new Date().toISOString() : null,
      mpesa_transaction_id: receiptId || null,
      notes: `${bill.notes || ""}${bill.notes ? " | " : ""}Installment KES ${payAmount.toLocaleString()} via ${method} on ${new Date().toLocaleDateString()}`,
    } as any).eq("id", bill.id);

    toast({
      title: isFullyPaid ? "✅ Bill Fully Paid" : `💰 Installment of KES ${payAmount.toLocaleString()} recorded`,
      description: isFullyPaid ? undefined : `Balance: KES ${(balance - payAmount).toLocaleString()}`,
    });
    setInstallmentBill(null);
    setInstallmentAmount("");
    setShowInstallmentMpesa(false);
    fetchBills();
  };

  const payInstallment = async () => {
    if (!installmentBill) return;
    const payAmount = parseFloat(installmentAmount);
    if (!payAmount || payAmount <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" }); return;
    }
    // If M-Pesa STK push selected, open modal
    if (installmentMethod === "mpesa") {
      setShowInstallmentMpesa(true);
      return;
    }
    // If M-Pesa "Already Paid" selected, record directly
    if (installmentMethod === "mpesa_already_paid") {
      await doInstallmentPayment("mpesa");
      return;
    }
    await doInstallmentPayment(installmentMethod);
  };

  const handlePayClick = (bill: any, method: string) => {
    if (method === "mpesa") {
      setMpesaBill(bill);
    } else if (method === "mpesa_already_paid") {
      // Mark as paid via M-Pesa without STK
      setConfirmPay({ bill, method: "mpesa" });
    } else if (method === "installment") {
      setInstallmentBill(bill);
      const alreadyPaid = bill.amount_paid || 0;
      const balance = (bill.total || 0) - alreadyPaid;
      const maxInstallments = installSettings.installment_max;
      const suggestedAmount = Math.ceil(balance / maxInstallments);
      setInstallmentAmount(String(suggestedAmount));
    } else {
      setConfirmPay({ bill, method });
    }
  };

  const getBillBalance = (b: any) => (b.total || 0) - (b.amount_paid || 0);
  const pendingBills = bills.filter(b => b.status === "pending");
  const partialBills = bills.filter(b => b.status === "partial");

  return (
    <AppLayout title="Process Payment">
      <div className="space-y-6">
        <WorkflowSuggestions context="payment-completed" title="After Payment" />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-4 flex items-center gap-3"><CreditCard className="h-8 w-8 text-primary" /><div><p className="text-2xl font-black">{pendingBills.length}</p><p className="text-xs text-muted-foreground">Pending Bills</p></div></CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3"><Banknote className="h-8 w-8 text-success" /><div><p className="text-2xl font-black">KES {bills.reduce((s, b) => s + getBillBalance(b), 0).toLocaleString()}</p><p className="text-xs text-muted-foreground">Total Outstanding</p></div></CardContent></Card>
          {installSettings.installment_enabled && (
            <>
              <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20"><CardContent className="pt-4 flex items-center gap-3"><CalendarClock className="h-8 w-8 text-amber-600" /><div><p className="text-2xl font-black text-amber-700">{partialBills.length}</p><p className="text-xs text-muted-foreground">On Installment</p></div></CardContent></Card>
              <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20"><CardContent className="pt-4 flex items-center gap-3"><Wallet className="h-8 w-8 text-amber-600" /><div><p className="text-2xl font-black text-amber-700">KES {partialBills.reduce((s, b) => s + getBillBalance(b), 0).toLocaleString()}</p><p className="text-xs text-muted-foreground">Installment Balance</p></div></CardContent></Card>
            </>
          )}
        </div>

        {/* Partial/Installment Bills */}
        {installSettings.installment_enabled && partialBills.length > 0 && (
          <Card className="border-amber-300 shadow-amber-100 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-amber-600" />
                <span className="text-amber-700 dark:text-amber-400">Active Installment Plans</span>
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 text-[10px]">{partialBills.length} active</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-amber-50/50 dark:bg-amber-950/20">
                    <TableHead>Bill#</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partialBills.map(b => {
                    const balance = getBillBalance(b);
                    const paidPct = ((b.amount_paid || 0) / (b.total || 1)) * 100;
                    return (
                      <TableRow key={b.id} className="hover:bg-amber-50/30">
                        <TableCell className="font-mono text-xs">{b.bill_no}</TableCell>
                        <TableCell className="font-medium">{b.patients?.first_name} {b.patients?.last_name}</TableCell>
                        <TableCell className="text-xs">KES {(b.total || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-success font-semibold">KES {(b.amount_paid || 0).toLocaleString()}</TableCell>
                        <TableCell className="font-bold text-amber-700">KES {balance.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-[120px]">
                            <Progress value={paidPct} className="h-2 flex-1" />
                            <span className="text-[10px] font-bold text-muted-foreground">{Math.round(paidPct)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1" onClick={() => handlePayClick(b, "installment")}>
                              <Wallet className="h-3 w-3" />Pay Next
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handlePayClick(b, "mpesa")}>
                              <Smartphone className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Pending Bills */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" />Pending Bills</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill#</TableHead><TableHead>Patient</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead><TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingBills.map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-xs">{b.bill_no}</TableCell>
                    <TableCell>{b.patients?.first_name} {b.patients?.last_name}</TableCell>
                    <TableCell className="font-bold">KES {(b.total || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-xs">{new Date(b.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        <Button size="sm" onClick={() => handlePayClick(b, "cash")}><Banknote className="h-3 w-3 mr-1" />Cash</Button>
                        <Button size="sm" variant="outline" onClick={() => handlePayClick(b, "card")}><CreditCard className="h-3 w-3 mr-1" />Card</Button>
                        <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground" onClick={() => handlePayClick(b, "mpesa")}><Smartphone className="h-3 w-3 mr-1" />STK Push</Button>
                        <Button size="sm" variant="outline" className="text-success border-success/50" onClick={() => handlePayClick(b, "mpesa_already_paid")}><CheckCircle2 className="h-3 w-3 mr-1" />M-Pesa Paid</Button>
                        {installSettings.installment_enabled && installSettings.installment_billing && (b.total || 0) >= parseFloat(installSettings.installment_min_amount) && (
                          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1 border-2 border-amber-400 shadow-lg shadow-amber-200/50" onClick={() => handlePayClick(b, "installment")}>
                            <CalendarClock className="h-3 w-3" />Installment
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {pendingBills.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No pending bills</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Payment Confirmation Dialog */}
      <AlertDialog open={!!confirmPay} onOpenChange={() => setConfirmPay(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" /> Confirm Payment</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>Are you sure you want to mark this bill as paid?</p>
                {confirmPay && (
                  <div className="p-3 rounded-lg bg-muted/50 border mt-2 text-foreground">
                    <p className="text-sm"><strong>Bill:</strong> {confirmPay.bill.bill_no}</p>
                    <p className="text-sm"><strong>Patient:</strong> {confirmPay.bill.patients?.first_name} {confirmPay.bill.patients?.last_name}</p>
                    <p className="text-sm"><strong>Amount:</strong> KES {(getBillBalance(confirmPay.bill)).toLocaleString()}</p>
                    <p className="text-sm"><strong>Method:</strong> {confirmPay.method.toUpperCase()}</p>
                  </div>
                )}
                <p className="text-xs text-destructive font-medium">Please verify the payment has been received before confirming.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (confirmPay) { pay(confirmPay.bill.id, confirmPay.method, confirmPay.bill.total); setConfirmPay(null); } }}>
              Yes, Confirm Payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Installment Payment Dialog */}
      <Dialog open={!!installmentBill} onOpenChange={() => setInstallmentBill(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-amber-600" />
              Installment Payment
            </DialogTitle>
            <DialogDescription>Pay a portion of this bill. The remaining balance can be paid later.</DialogDescription>
          </DialogHeader>
          {installmentBill && (() => {
            const total = installmentBill.total || 0;
            const alreadyPaid = installmentBill.amount_paid || 0;
            const balance = total - alreadyPaid;
            const minDown = alreadyPaid === 0 ? Math.ceil(total * parseFloat(installSettings.installment_downpayment_pct) / 100) : 1;
            const payAmt = parseFloat(installmentAmount) || 0;
            const afterPay = balance - payAmt;
            const paidPct = ((alreadyPaid + payAmt) / total) * 100;
            return (
              <div className="space-y-4">
                {/* Bill summary */}
                <div className="rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 p-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Patient</span><span className="font-bold">{installmentBill.patients?.first_name} {installmentBill.patients?.last_name}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Bill</span><span className="font-mono">{installmentBill.bill_no}</span></div>
                  <div className="border-t border-amber-200 my-1" />
                  <div className="flex justify-between"><span className="text-muted-foreground">Total Bill</span><span className="font-bold">KES {total.toLocaleString()}</span></div>
                  <div className="flex justify-between text-success"><span>Already Paid</span><span className="font-bold">KES {alreadyPaid.toLocaleString()}</span></div>
                  <div className="flex justify-between text-lg font-black text-amber-700"><span>Outstanding</span><span>KES {balance.toLocaleString()}</span></div>
                  <Progress value={(alreadyPaid / total) * 100} className="h-3 mt-1" />
                  <p className="text-[10px] text-center text-muted-foreground">{Math.round((alreadyPaid / total) * 100)}% paid so far</p>
                </div>

                {/* Payment amount */}
                <div>
                  <Label className="text-sm font-semibold">Payment Amount (KES)</Label>
                  <Input
                    type="number"
                    value={installmentAmount}
                    onChange={e => setInstallmentAmount(e.target.value)}
                    className="text-2xl font-black text-center h-14 mt-1"
                    placeholder="0"
                    min={1}
                    max={balance}
                  />
                  <div className="flex justify-between mt-1 text-[11px] text-muted-foreground">
                    <span>Min: KES {minDown.toLocaleString()}{alreadyPaid === 0 ? ` (${installSettings.installment_downpayment_pct}% down)` : ""}</span>
                    <span>Max: KES {balance.toLocaleString()}</span>
                  </div>
                  {/* Quick amount buttons */}
                  <div className="flex gap-2 mt-2">
                    {[Math.ceil(balance / 3), Math.ceil(balance / 2), balance].map((amt, i) => (
                      <Button key={i} size="sm" variant={installmentAmount === String(amt) ? "default" : "outline"} className="flex-1 text-xs"
                        onClick={() => setInstallmentAmount(String(amt))}>
                        KES {amt.toLocaleString()}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Payment method */}
                <div>
                  <Label className="text-sm font-semibold">Payment Method</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {[
                      { value: "cash", label: "Cash", icon: Banknote },
                      { value: "card", label: "Card", icon: CreditCard },
                      { value: "mpesa", label: "M-Pesa (STK Push)", icon: Smartphone },
                      { value: "mpesa_already_paid", label: "M-Pesa (Already Paid)", icon: CheckCircle2 },
                    ].map(m => (
                      <button key={m.value} onClick={() => setInstallmentMethod(m.value)}
                        className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                          installmentMethod === m.value
                            ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30 shadow-md"
                            : "border-border hover:border-amber-300"
                        }`}>
                        <m.icon className={`h-5 w-5 ${installmentMethod === m.value ? "text-amber-600" : "text-muted-foreground"}`} />
                        <span className="text-xs font-medium">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* After payment preview */}
                {payAmt > 0 && payAmt <= balance && (
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-1 text-sm">
                    <p className="font-semibold text-xs text-muted-foreground uppercase">After this payment:</p>
                    <div className="flex justify-between"><span>Total Paid</span><span className="font-bold text-success">KES {(alreadyPaid + payAmt).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Remaining</span><span className={`font-bold ${afterPay <= 0 ? "text-success" : "text-amber-600"}`}>KES {Math.max(0, afterPay).toLocaleString()}</span></div>
                    <Progress value={Math.min(paidPct, 100)} className="h-2 mt-1" />
                    {afterPay <= 0 && <p className="text-success font-bold text-center text-xs mt-1">✅ This will clear the bill completely!</p>}
                  </div>
                )}

                <Button onClick={payInstallment} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-6 text-base gap-2 shadow-lg">
                  <Wallet className="h-5 w-5" />
                  Record Payment — KES {(payAmt || 0).toLocaleString()}
                </Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {mpesaBill && <MpesaPaymentModal open={!!mpesaBill} onClose={() => setMpesaBill(null)} amount={getBillBalance(mpesaBill)} reference={mpesaBill.bill_no} onSuccess={(receipt) => { pay(mpesaBill.id, "mpesa", mpesaBill.total, receipt); setMpesaBill(null); }} />}

      {/* M-Pesa STK for installment payments */}
      {showInstallmentMpesa && installmentBill && (
        <MpesaPaymentModal
          open={showInstallmentMpesa}
          onClose={() => setShowInstallmentMpesa(false)}
          amount={parseFloat(installmentAmount) || 0}
          reference={`${installmentBill.bill_no}-INST`}
          onSuccess={(receipt) => {
            doInstallmentPayment("mpesa", receipt);
          }}
        />
      )}
    </AppLayout>
  );
}
