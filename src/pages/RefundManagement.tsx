import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useState, useEffect } from "react";
import { RotateCcw, ArrowRightLeft, Banknote, CreditCard, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHospital } from "@/contexts/HospitalContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "mpesa", label: "M-Pesa", icon: Smartphone },
  { value: "card", label: "Card", icon: CreditCard },
  { value: "credit", label: "Credit" },
  { value: "insurance", label: "Insurance" },
];

export default function RefundManagement() {
  const { hospitalId } = useHospital();
  const [paidBills, setPaidBills] = useState<any[]>([]);
  const [paidSales, setPaidSales] = useState<any[]>([]);
  const [transferTarget, setTransferTarget] = useState<{ id: string; type: "bill" | "sale"; currentMethod: string; amount: number; label: string } | null>(null);
  const [newMethod, setNewMethod] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const { toast } = useToast();

  const fetchData = async () => {
    if (!hospitalId) return;
    const [billsRes, salesRes] = await Promise.all([
      supabase.from("bills").select("*, patients(first_name,last_name)").eq("hospital_id", hospitalId).eq("status", "paid").order("paid_at", { ascending: false }).limit(50),
      supabase.from("pharmacy_sales").select("*").eq("hospital_id", hospitalId).eq("status", "completed").order("created_at", { ascending: false }).limit(50),
    ]);
    setPaidBills(billsRes.data || []);
    setPaidSales(salesRes.data || []);
  };

  useEffect(() => { fetchData(); }, [hospitalId]);

  const processRefund = async (id: string, type: "bill" | "sale") => {
    if (type === "bill") {
      await supabase.from("bills").update({ status: "refunded" } as any).eq("id", id);
      setPaidBills(prev => prev.filter(b => b.id !== id));
    } else {
      await supabase.from("pharmacy_sales").update({ status: "refunded" } as any).eq("id", id);
      setPaidSales(prev => prev.filter(s => s.id !== id));
    }
    toast({ title: "Refund processed" });
  };

  const openTransfer = (id: string, type: "bill" | "sale", currentMethod: string, amount: number, label: string) => {
    setTransferTarget({ id, type, currentMethod, amount, label });
    setNewMethod("");
    setTransferReason("");
  };

  const confirmTransfer = async () => {
    if (!transferTarget || !newMethod) return;
    if (newMethod === transferTarget.currentMethod) {
      toast({ title: "Same method selected", description: "Choose a different payment method.", variant: "destructive" });
      return;
    }

    const table = transferTarget.type === "bill" ? "bills" : "pharmacy_sales";
    const { error } = await supabase.from(table).update({ payment_method: newMethod } as any).eq("id", transferTarget.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // Log the transfer in activity_log
    await supabase.from("activity_log").insert({
      action: "payment_method_transfer",
      module: transferTarget.type === "bill" ? "billing" : "pharmacy",
      details: `Changed payment method from "${transferTarget.currentMethod}" to "${newMethod}" for ${transferTarget.label}. Reason: ${transferReason || "Not specified"}`,
      hospital_id: hospitalId,
    } as any);

    toast({ title: "Payment method updated", description: `Changed from ${transferTarget.currentMethod} → ${newMethod}` });
    setTransferTarget(null);
    fetchData();
  };

  return (
    <AppLayout title="Refund & Payment Transfer">
      <div className="space-y-6">
        <Tabs defaultValue="bills">
          <TabsList>
            <TabsTrigger value="bills">Hospital Bills</TabsTrigger>
            <TabsTrigger value="sales">Pharmacy Sales</TabsTrigger>
          </TabsList>

          <TabsContent value="bills">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><RotateCcw className="h-5 w-5" />Paid Bills — Refund or Transfer</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill#</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Paid Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paidBills.map(b => (
                      <TableRow key={b.id}>
                        <TableCell className="font-mono text-xs">{b.bill_no}</TableCell>
                        <TableCell>{b.patients?.first_name} {b.patients?.last_name}</TableCell>
                        <TableCell className="font-bold">KES {(b.amount_paid || 0).toLocaleString()}</TableCell>
                        <TableCell><Badge variant="secondary">{b.payment_method || "cash"}</Badge></TableCell>
                        <TableCell className="text-xs">{b.paid_at ? new Date(b.paid_at).toLocaleDateString() : "—"}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button size="sm" variant="outline" onClick={() => openTransfer(b.id, "bill", b.payment_method || "cash", b.amount_paid || 0, b.bill_no)} className="gap-1">
                            <ArrowRightLeft className="h-3 w-3" /> Transfer
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => processRefund(b.id, "bill")}>Refund</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {paidBills.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No paid bills found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><RotateCcw className="h-5 w-5" />Pharmacy Sales — Refund or Transfer</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt#</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paidSales.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">{s.receipt_no}</TableCell>
                        <TableCell>{s.customer_name || "Walk-in"}</TableCell>
                        <TableCell className="font-bold">KES {(s.total || 0).toLocaleString()}</TableCell>
                        <TableCell><Badge variant="secondary">{s.payment_method || "cash"}</Badge></TableCell>
                        <TableCell className="text-xs">{new Date(s.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button size="sm" variant="outline" onClick={() => openTransfer(s.id, "sale", s.payment_method || "cash", s.total || 0, s.receipt_no)} className="gap-1">
                            <ArrowRightLeft className="h-3 w-3" /> Transfer
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => processRefund(s.id, "sale")}>Refund</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {paidSales.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No completed sales found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Transfer Payment Method Modal */}
      <Dialog open={!!transferTarget} onOpenChange={() => setTransferTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ArrowRightLeft className="h-5 w-5" /> Change Payment Destination</DialogTitle>
          </DialogHeader>
          {transferTarget && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 border text-sm space-y-1">
                <p><span className="text-muted-foreground">Reference:</span> <span className="font-mono font-semibold">{transferTarget.label}</span></p>
                <p><span className="text-muted-foreground">Amount:</span> <span className="font-bold">KES {transferTarget.amount.toLocaleString()}</span></p>
                <p><span className="text-muted-foreground">Current Method:</span> <Badge variant="outline">{transferTarget.currentMethod}</Badge></p>
              </div>

              <div>
                <Label>New Payment Method *</Label>
                <Select value={newMethod} onValueChange={setNewMethod}>
                  <SelectTrigger><SelectValue placeholder="Select new method" /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.filter(m => m.value !== transferTarget.currentMethod).map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Reason for Transfer</Label>
                <Textarea value={transferReason} onChange={e => setTransferReason(e.target.value)} placeholder="e.g. Wrongly recorded as cash, was actually M-Pesa" rows={2} />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setTransferTarget(null)}>Cancel</Button>
                <Button onClick={confirmTransfer} disabled={!newMethod}>Confirm Transfer</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
