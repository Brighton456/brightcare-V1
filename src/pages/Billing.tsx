import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useHospital } from "@/contexts/HospitalContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import {
  DollarSign, Receipt, CreditCard, Search, Plus, Trash2,
  Smartphone, CheckCircle, Clock, FileText, Printer, AlertTriangle,
} from "lucide-react";
import { MpesaPaymentModal } from "@/components/payments/MpesaPaymentModal";

interface Bill {
  id: string;
  bill_no: string;
  patient_id: string;
  status: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amount_paid: number;
  payment_method: string | null;
  mpesa_transaction_id: string | null;
  created_at: string;
  paid_at: string | null;
  patients?: { first_name: string; last_name: string; patient_no: string };
}

interface BillItem {
  item_type: string;
  description: string;
  quantity: number;
  unit_price: string;
  total: string;
}

export default function Billing() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showNew, setShowNew] = useState(false);
  const [showPay, setShowPay] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [mpesaLoading, setMpesaLoading] = useState(false);

  // New bill form
  const [billForm, setBillForm] = useState({ patient_id: "", discount: "0" });
  const [billItems, setBillItems] = useState<BillItem[]>([{ item_type: "consultation", description: "Consultation Fee", quantity: 1, unit_price: "500", total: "500" }]);

  // Payment form
  const [payForm, setPayForm] = useState({ method: "cash", amount: "", phone: "" });
  const [showMpesaModal, setShowMpesaModal] = useState(false);
  const { hospitalId, hospital } = useHospital();

  const fetchBills = async () => {
    if (!hospitalId) return;
    const { data } = await supabase.from("bills").select("*, patients(first_name,last_name,patient_no)").eq("hospital_id", hospitalId).order("created_at", { ascending: false }).limit(100);
    if (data) setBills(data as unknown as Bill[]);
    setLoading(false);
  };

  const fetchPatients = async () => {
    if (!hospitalId) return;
    const { data } = await supabase.from("patients").select("id,first_name,last_name,patient_no").eq("hospital_id", hospitalId).order("first_name");
    if (data) setPatients(data as any[]);
  };

  useEffect(() => { fetchBills(); fetchPatients(); }, [hospitalId]);

  const updateBillItemTotal = (items: BillItem[]) => {
    return items.map(i => ({ ...i, total: String(i.quantity * parseFloat(i.unit_price || "0")) }));
  };

  const createBill = async () => {
    if (!billForm.patient_id) { toast({ title: "Error", description: "Select a patient", variant: "destructive" }); return; }
    const items = updateBillItemTotal(billItems);
    const subtotal = items.reduce((s, i) => s + parseFloat(i.total), 0);
    const discount = parseFloat(billForm.discount) || 0;
    const taxable = subtotal - discount;
    const taxRate = (hospital?.tax_rate ?? 16) / 100;
    const tax = Math.round(taxable * taxRate * 100) / 100;
    const total = taxable + tax;

    const { data: bill, error } = await supabase.from("bills").insert({
      patient_id: billForm.patient_id,
      bill_no: `BILL-${Date.now().toString().slice(-6)}`,
      subtotal, tax, discount, total,
          hospital_id: hospitalId,
    } as any).select().single();
    if (error || !bill) { toast({ title: "Error", description: error?.message || "Failed", variant: "destructive" }); return; }

    const dbItems = items.filter(i => i.description).map(i => ({
      bill_id: (bill as any).id,
      item_type: i.item_type,
      description: i.description,
      quantity: i.quantity,
      unit_price: parseFloat(i.unit_price),
      total: parseFloat(i.total),
    }));
    await supabase.from("bill_items").insert(dbItems.map((i: any) => ({ ...i, hospital_id: hospitalId })) as any);
    toast({ title: "Bill Created" });
    setShowNew(false);
    setBillItems([{ item_type: "consultation", description: "Consultation Fee", quantity: 1, unit_price: "500", total: "500" }]);
    setBillForm({ patient_id: "", discount: "0" });
    fetchBills();
  };

  const [showConfirm, setShowConfirm] = useState(false);

  const confirmAndPay = () => {
    if (payForm.method === "mpesa") {
      setShowMpesaModal(true);
      return;
    }
    setShowConfirm(true);
  };

  const processPayment = async () => {
    setShowConfirm(false);
    if (!showPay) return;

    if (payForm.method === "mpesa") {
      // Use the M-Pesa modal with STK push + polling
      setShowMpesaModal(true);
      return;
    } else {
      const amount = parseFloat(payForm.amount) || showPay.total;
      await supabase.from("bills").update({
        status: amount >= showPay.total ? "paid" : "partial",
        payment_method: payForm.method, amount_paid: amount,
        paid_at: new Date().toISOString(),
      } as any).eq("id", showPay.id);
      toast({ title: "Payment Recorded" });
    }
    setShowPay(null);
    fetchBills();
  };

  const isAdmin = useIsAdmin();
  const totalRevenue = bills.filter(b => b.status === "paid").reduce((s, b) => s + b.total, 0);
  const pendingAmount = bills.filter(b => b.status === "pending").reduce((s, b) => s + b.total, 0);

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    partial: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  const statusFiltered = statusFilter === "all" ? bills : bills.filter(b => (b.status || "pending") === statusFilter);
  const filtered = search ? statusFiltered.filter(b => {
    const q = search.toLowerCase();
    return b.bill_no.toLowerCase().includes(q) || (b.patients?.first_name || "").toLowerCase().includes(q) || (b.patients?.last_name || "").toLowerCase().includes(q);
  }) : statusFiltered;

  const statusCounts = {
    all: bills.length,
    pending: bills.filter(b => b.status === "pending").length,
    partial: bills.filter(b => b.status === "partial").length,
    paid: bills.filter(b => b.status === "paid").length,
    cancelled: bills.filter(b => b.status === "cancelled").length,
  };

  return (
    <AppLayout title="Billing & Payments">
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ...(isAdmin ? [{ label: "Total Revenue", value: `KES ${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-emerald-600" }] : []),
            ...(isAdmin ? [{ label: "Pending", value: `KES ${pendingAmount.toLocaleString()}`, icon: Clock, color: "text-amber-600" }] : []),
            { label: "Bills Today", value: bills.filter(b => new Date(b.created_at).toDateString() === new Date().toDateString()).length, icon: Receipt, color: "text-primary" },
            { label: "Paid Today", value: bills.filter(b => b.status === "paid" && b.paid_at && new Date(b.paid_at).toDateString() === new Date().toDateString()).length, icon: CheckCircle, color: "text-emerald-600" },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-3 p-3 rounded-xl border bg-card">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div><p className="text-lg font-bold">{s.value}</p><p className="text-[11px] text-muted-foreground">{s.label}</p></div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search bills..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Button onClick={() => setShowNew(true)} className="gap-2"><Plus className="h-4 w-4" /> Create Bill</Button>
        </div>

        {/* Status filter chips */}
        <div className="flex flex-wrap gap-2">
          {([
            { key: "all", label: "All" },
            { key: "pending", label: "Pending" },
            { key: "partial", label: "Partial" },
            { key: "paid", label: "Paid" },
            { key: "cancelled", label: "Cancelled" },
          ] as const).map(s => (
            <Button
              key={s.key}
              size="sm"
              variant={statusFilter === s.key ? "default" : "outline"}
              onClick={() => setStatusFilter(s.key)}
              className="h-8 text-xs gap-1.5"
            >
              {s.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${statusFilter === s.key ? "bg-primary-foreground/20" : "bg-muted"}`}>
                {statusCounts[s.key]}
              </span>
            </Button>
          ))}
        </div>

        {/* Bills List */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold">Bill #</th>
                  <th className="text-left p-3 font-semibold">Patient</th>
                  <th className="text-left p-3 font-semibold hidden md:table-cell">Total</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold hidden lg:table-cell">Payment</th>
                  <th className="text-left p-3 font-semibold hidden lg:table-cell">Date</th>
                  <th className="text-right p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No bills found</td></tr>
                ) : filtered.map(b => (
                  <tr key={b.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-semibold text-xs">{b.bill_no}</td>
                    <td className="p-3 text-xs">{b.patients?.first_name} {b.patients?.last_name}</td>
                    <td className="p-3 text-xs font-semibold hidden md:table-cell">KES {b.total.toLocaleString()}</td>
                    <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[b.status] || ""}`}>{b.status}</span></td>
                    <td className="p-3 text-xs hidden lg:table-cell">{b.payment_method || "—"}</td>
                    <td className="p-3 text-xs hidden lg:table-cell">{new Date(b.created_at).toLocaleDateString()}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {b.status === "pending" && (
                          <Button size="sm" className="text-xs h-7 gap-1" onClick={() => { setShowPay(b); setPayForm({ method: "cash", amount: String(b.total), phone: "" }); }}>
                            <CreditCard className="h-3 w-3" /> Pay
                          </Button>
                        )}
                        {isAdmin && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={async () => {
                            if (!confirm(`Delete bill ${b.bill_no}?`)) return;
                            await supabase.from("bill_items").delete().eq("bill_id", b.id);
                            await supabase.from("bills").delete().eq("id", b.id);
                            toast({ title: "Bill deleted" });
                            fetchBills();
                          }}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Bill */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Bill</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Patient *</Label>
              <Select value={billForm.patient_id} onValueChange={v => setBillForm(f => ({ ...f, patient_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.patient_no})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {/* Bill items */}
            <div className="space-y-2">
              <Label>Items</Label>
              {billItems.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-3">
                    <Select value={item.item_type} onValueChange={v => { const n = [...billItems]; n[i].item_type = v; setBillItems(n); }}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consultation">Consultation</SelectItem>
                        <SelectItem value="lab_test">Lab Test</SelectItem>
                        <SelectItem value="medicine">Medicine</SelectItem>
                        <SelectItem value="procedure">Procedure</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-4"><Input className="h-8 text-xs" value={item.description} onChange={e => { const n = [...billItems]; n[i].description = e.target.value; setBillItems(n); }} placeholder="Description" /></div>
                  <div className="col-span-1"><Input className="h-8 text-xs" type="number" value={item.quantity} onChange={e => { const n = [...billItems]; n[i].quantity = parseInt(e.target.value) || 1; setBillItems(updateBillItemTotal(n)); }} /></div>
                  <div className="col-span-2"><Input className="h-8 text-xs" value={item.unit_price} onChange={e => { const n = [...billItems]; n[i].unit_price = e.target.value; setBillItems(updateBillItemTotal(n)); }} /></div>
                  <div className="col-span-1 text-xs font-semibold text-right pt-2">KES {parseFloat(item.total).toLocaleString()}</div>
                  <div className="col-span-1">
                    {billItems.length > 1 && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setBillItems(billItems.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3" /></Button>}
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setBillItems(i => [...i, { item_type: "other", description: "", quantity: 1, unit_price: "0", total: "0" }])}>
                <Plus className="h-3 w-3 mr-1" /> Add Item
              </Button>
            </div>
            <div><Label>Discount (KES)</Label><Input value={billForm.discount} onChange={e => setBillForm(f => ({ ...f, discount: e.target.value }))} /></div>
            <div className="text-right font-bold">
              Total: KES {(billItems.reduce((s, i) => s + parseFloat(i.total || "0"), 0) - (parseFloat(billForm.discount) || 0)).toLocaleString()}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={createBill}>Create Bill</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={!!showPay} onOpenChange={() => setShowPay(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Process Payment — {showPay?.bill_no}</DialogTitle></DialogHeader>
          {showPay && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-sm">Patient: <strong>{showPay.patients?.first_name} {showPay.patients?.last_name}</strong></p>
                <p className="text-lg font-bold mt-1">Total: KES {showPay.total.toLocaleString()}</p>
              </div>
              <div>
                <Label>Payment Method</Label>
                <Select value={payForm.method} onValueChange={v => setPayForm(f => ({ ...f, method: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {payForm.method === "mpesa" ? (
                <div>
                  <Label>M-Pesa Phone Number</Label>
                  <Input value={payForm.phone} onChange={e => setPayForm(f => ({ ...f, phone: e.target.value }))} placeholder="07XXXXXXXX or 254..." />
                  <p className="text-xs text-muted-foreground mt-1">STK push will be sent to this number</p>
                </div>
              ) : (
                <div><Label>Amount (KES)</Label><Input value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} /></div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowPay(null)}>Cancel</Button>
                <Button onClick={confirmAndPay} disabled={mpesaLoading} className="gap-1">
                  {payForm.method === "mpesa" && <Smartphone className="h-4 w-4" />}
                  {mpesaLoading ? "Sending..." : payForm.method === "mpesa" ? "Send STK Push" : "Record Payment"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" /> Confirm Payment</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to record this payment?</p>
              {showPay && (
                <div className="p-3 rounded-lg bg-muted/50 border mt-2 text-foreground">
                  <p className="text-sm"><strong>Bill:</strong> {showPay.bill_no}</p>
                  <p className="text-sm"><strong>Patient:</strong> {showPay.patients?.first_name} {showPay.patients?.last_name}</p>
                  <p className="text-sm"><strong>Amount:</strong> KES {showPay.total.toLocaleString()}</p>
                  <p className="text-sm"><strong>Method:</strong> {payForm.method.toUpperCase()}</p>
                </div>
              )}
              <p className="text-xs text-destructive font-medium">This action cannot be undone. Please verify the payment has been received.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={processPayment}>Yes, Confirm Payment</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* M-Pesa Payment Modal with STK Push + Polling */}
      {showPay && (
        <MpesaPaymentModal
          open={showMpesaModal}
          onClose={() => setShowMpesaModal(false)}
          amount={Math.round(showPay.total)}
          reference={showPay.bill_no}
          onSuccess={async (receipt) => {
            await supabase.from("bills").update({
              status: "paid", payment_method: "mpesa", amount_paid: showPay.total,
              mpesa_transaction_id: receipt, paid_at: new Date().toISOString(),
            } as any).eq("id", showPay.id);
            toast({ title: "M-Pesa Payment Confirmed", description: `Receipt: ${receipt}` });
            setShowMpesaModal(false);
            setShowPay(null);
            fetchBills();
          }}
          onFail={(err) => {
            toast({ title: "M-Pesa Failed", description: err, variant: "destructive" });
          }}
        />
      )}
    </AppLayout>
  );
}
