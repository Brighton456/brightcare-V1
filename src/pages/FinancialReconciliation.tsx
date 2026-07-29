import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { toast } from "@/hooks/use-toast";
import { useHospital } from "@/contexts/HospitalContext";
import {
  DollarSign, Users, Banknote, CreditCard, Smartphone, TrendingUp,
  Calendar, CheckCircle, Clock, AlertTriangle, ArrowRight, Download,
} from "lucide-react";

interface StaffCollection {
  staff_id: string;
  staff_name: string;
  role: string;
  cash: number;
  mpesa: number;
  card: number;
  credit: number;
  gift: number;
  account: number;
  total: number;
  transactions: number;
}

export default function FinancialReconciliation() {
  const { hospitalId, loading: hospitalLoading } = useHospital();
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split("T")[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [collections, setCollections] = useState<StaffCollection[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [showSubmit, setShowSubmit] = useState<StaffCollection | null>(null);
  const [showVerify, setShowVerify] = useState<any>(null);
  const [submitNotes, setSubmitNotes] = useState("");

  const fetchReconciliation = useCallback(async () => {
    if (hospitalLoading) return;

    if (!hospitalId) {
      setStaff([]);
      setCollections([]);
      setSettlements([]);
      return;
    }

    const [sRes, settRes, psRes, bRes] = await Promise.all([
      supabase.from("staff").select("id,first_name,last_name,role").eq("hospital_id", hospitalId).eq("is_active", true),
      supabase.from("financial_settlements").select("*").eq("hospital_id", hospitalId).order("created_at", { ascending: false }).limit(50),
      supabase.from("pharmacy_sales").select("cashier_id,payment_method,total,created_at").eq("hospital_id", hospitalId).gte("created_at", dateFrom).lte("created_at", dateTo + "T23:59:59"),
      supabase.from("bills").select("cashier_id,payment_method,total,paid_at,status").eq("hospital_id", hospitalId).eq("status", "paid").gte("paid_at", dateFrom).lte("paid_at", dateTo + "T23:59:59"),
    ]);

    const firstError = sRes.error || settRes.error || psRes.error || bRes.error;
    if (firstError) {
      toast({ title: "Failed to load reconciliation", description: firstError.message, variant: "destructive" });
    }

    const allStaff = (sRes.data || []) as any[];
    setStaff(allStaff);

    const staffNameMap = new Map(allStaff.map((member: any) => [member.id, member]));
    setSettlements(((settRes.data || []) as any[]).map((row: any) => {
      const member = staffNameMap.get(row.staff_id);
      return {
        ...row,
        staff: member ? { first_name: member.first_name, last_name: member.last_name } : null,
      };
    }));

    const staffMap = new Map<string, StaffCollection>();
    allStaff.forEach((s: any) => {
      staffMap.set(s.id, {
        staff_id: s.id, staff_name: `${s.first_name} ${s.last_name}`, role: s.role,
        cash: 0, mpesa: 0, card: 0, credit: 0, gift: 0, account: 0, total: 0, transactions: 0,
      });
    });

    const addToStaff = (staffId: string | null, method: string | null, amount: number) => {
      if (!staffId) return;
      const entry = staffMap.get(staffId);
      if (!entry) return;
      const m = (method || "cash").toLowerCase();
      if (m === "cash") entry.cash += amount;
      else if (m === "mpesa" || m === "m-pesa") entry.mpesa += amount;
      else if (m === "card") entry.card += amount;
      else if (m === "credit") entry.credit += amount;
      else if (m === "gift") entry.gift += amount;
      else if (m === "account") entry.account += amount;
      entry.total += amount;
      entry.transactions++;
    };

    (psRes.data || []).forEach((s: any) => addToStaff(s.cashier_id, s.payment_method, s.total || 0));
    (bRes.data || []).forEach((b: any) => addToStaff(b.cashier_id, b.payment_method, b.total || 0));

    setCollections(Array.from(staffMap.values()).filter(c => c.transactions > 0).sort((a, b) => b.total - a.total));
  }, [dateFrom, dateTo, hospitalId, hospitalLoading, toast]);

  useEffect(() => {
    fetchReconciliation();
  }, [fetchReconciliation]);

  const grandTotals = collections.reduce((acc, c) => ({
    cash: acc.cash + c.cash, mpesa: acc.mpesa + c.mpesa, card: acc.card + c.card,
    credit: acc.credit + c.credit, gift: acc.gift + c.gift, account: acc.account + c.account,
    total: acc.total + c.total, transactions: acc.transactions + c.transactions,
  }), { cash: 0, mpesa: 0, card: 0, credit: 0, gift: 0, account: 0, total: 0, transactions: 0 });

  const submitSettlement = async () => {
    if (!showSubmit) return;
    await supabase.from("financial_settlements").insert({
      staff_id: showSubmit.staff_id,
      period_type: period,
      period_start: dateFrom,
      period_end: dateTo + "T23:59:59",
      cash_total: showSubmit.cash,
      mpesa_total: showSubmit.mpesa,
      card_total: showSubmit.card,
      credit_total: showSubmit.credit,
      gift_total: showSubmit.gift,
      account_total: showSubmit.account,
      grand_total: showSubmit.total,
      status: "submitted",
      submitted_at: new Date().toISOString(),
      notes: submitNotes || null,
          hospital_id: hospitalId,
    } as any);
    toast({ title: "Settlement Submitted", description: `${showSubmit.staff_name}'s collection submitted for verification.` });
    setShowSubmit(null);
    setSubmitNotes("");
    await fetchReconciliation();
  };

  const verifySettlement = async (id: string, accept: boolean) => {
    await supabase.from("financial_settlements").update({
      status: accept ? "verified" : "rejected",
      verified_at: new Date().toISOString(),
    } as any).eq("id", id);
    toast({ title: accept ? "Settlement Verified" : "Settlement Rejected" });
    setShowVerify(null);
    await fetchReconciliation();
  };

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    submitted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    verified: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <AppLayout title="Financial Reconciliation">
      <div className="space-y-4 max-w-6xl">
        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label className="text-xs">Period</Label>
            <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
              <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">From</Label><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 w-40" /></div>
          <div><Label className="text-xs">To</Label><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 w-40" /></div>
        </div>

        {/* Grand totals */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: "Cash", value: grandTotals.cash, icon: Banknote, color: "text-emerald-600" },
            { label: "M-Pesa", value: grandTotals.mpesa, icon: Smartphone, color: "text-green-600" },
            { label: "Card", value: grandTotals.card, icon: CreditCard, color: "text-blue-600" },
            { label: "Credit", value: grandTotals.credit, icon: Clock, color: "text-amber-600" },
            { label: "Gift", value: grandTotals.gift, icon: DollarSign, color: "text-purple-600" },
            { label: "Account", value: grandTotals.account, icon: Users, color: "text-cyan-600" },
            { label: "GRAND TOTAL", value: grandTotals.total, icon: TrendingUp, color: "text-primary" },
          ].map(t => (
            <Card key={t.label}>
              <CardContent className="p-3 text-center">
                <t.icon className={`h-4 w-4 mx-auto ${t.color} mb-1`} />
                <p className="text-sm font-bold">KES {t.value.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">{t.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Per-staff breakdown */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" />Collections by Staff</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-semibold">Staff</th>
                <th className="text-left p-3 font-semibold">Role</th>
                <th className="text-right p-3 font-semibold">Cash</th>
                <th className="text-right p-3 font-semibold">M-Pesa</th>
                <th className="text-right p-3 font-semibold">Card</th>
                <th className="text-right p-3 font-semibold">Credit</th>
                <th className="text-right p-3 font-semibold">Txns</th>
                <th className="text-right p-3 font-semibold">Total</th>
                <th className="text-right p-3 font-semibold">Action</th>
              </tr></thead>
              <tbody>
                {collections.length === 0 ? (
                  <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">No collections for this period</td></tr>
                ) : collections.map(c => (
                  <tr key={c.staff_id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-semibold">{c.staff_name}</td>
                    <td className="p-3 capitalize">{c.role?.replace("_", " ")}</td>
                    <td className="p-3 text-right font-mono">{c.cash.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono">{c.mpesa.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono">{c.card.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono">{c.credit.toLocaleString()}</td>
                    <td className="p-3 text-right">{c.transactions}</td>
                    <td className="p-3 text-right font-bold font-mono">{c.total.toLocaleString()}</td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setShowSubmit(c)}>
                        <ArrowRight className="h-3 w-3 mr-1" /> Submit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {collections.length > 0 && (
                <tfoot><tr className="bg-muted/30 font-bold">
                  <td className="p-3" colSpan={2}>Totals</td>
                  <td className="p-3 text-right font-mono">{grandTotals.cash.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono">{grandTotals.mpesa.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono">{grandTotals.card.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono">{grandTotals.credit.toLocaleString()}</td>
                  <td className="p-3 text-right">{grandTotals.transactions}</td>
                  <td className="p-3 text-right font-mono">{grandTotals.total.toLocaleString()}</td>
                  <td></td>
                </tr></tfoot>
              )}
            </table>
          </CardContent>
        </Card>

        {/* Settlement History */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CheckCircle className="h-4 w-4" />Settlement History</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-semibold">Staff</th>
                <th className="text-left p-3 font-semibold">Period</th>
                <th className="text-right p-3 font-semibold">Amount</th>
                <th className="text-left p-3 font-semibold">Status</th>
                <th className="text-left p-3 font-semibold">Submitted</th>
                <th className="text-right p-3 font-semibold">Action</th>
              </tr></thead>
              <tbody>
                {settlements.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No settlements yet</td></tr>
                ) : settlements.map((s: any) => (
                  <tr key={s.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-semibold">{s.staff?.first_name} {s.staff?.last_name}</td>
                    <td className="p-3">{s.period_type} | {new Date(s.period_start).toLocaleDateString()}</td>
                    <td className="p-3 text-right font-bold font-mono">KES {(s.grand_total || 0).toLocaleString()}</td>
                    <td className="p-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[s.status] || ""}`}>{s.status}</span></td>
                    <td className="p-3">{s.submitted_at ? new Date(s.submitted_at).toLocaleString() : "—"}</td>
                    <td className="p-3 text-right">
                      {s.status === "submitted" && (
                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setShowVerify(s)}>
                          Verify
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Submit Settlement Dialog */}
      <Dialog open={!!showSubmit} onOpenChange={() => setShowSubmit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Submit Settlement</DialogTitle></DialogHeader>
          {showSubmit && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 border space-y-1">
                <p className="text-sm font-semibold">{showSubmit.staff_name}</p>
                <p className="text-xs text-muted-foreground capitalize">{showSubmit.role?.replace("_", " ")}</p>
                <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                  <div>Cash: <strong>KES {showSubmit.cash.toLocaleString()}</strong></div>
                  <div>M-Pesa: <strong>KES {showSubmit.mpesa.toLocaleString()}</strong></div>
                  <div>Card: <strong>KES {showSubmit.card.toLocaleString()}</strong></div>
                </div>
                <p className="text-lg font-black mt-2">Total: KES {showSubmit.total.toLocaleString()}</p>
              </div>
              <div><Label>Notes</Label><Textarea value={submitNotes} onChange={e => setSubmitNotes(e.target.value)} placeholder="Any notes about this submission..." /></div>
              <p className="text-xs text-muted-foreground">This will transfer the collected amount from this staff's allocation to the company. An admin must verify to clear the staff's liability.</p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowSubmit(null)}>Cancel</Button>
                <Button className="flex-1" onClick={submitSettlement}>Submit for Verification</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Verify Settlement Dialog */}
      <Dialog open={!!showVerify} onOpenChange={() => setShowVerify(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Verify Settlement</DialogTitle></DialogHeader>
          {showVerify && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 border space-y-1">
                <p className="text-sm font-semibold">{showVerify.staff?.first_name} {showVerify.staff?.last_name}</p>
                <p className="text-lg font-black">KES {(showVerify.grand_total || 0).toLocaleString()}</p>
                <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                  <div>Cash: {(showVerify.cash_total || 0).toLocaleString()}</div>
                  <div>M-Pesa: {(showVerify.mpesa_total || 0).toLocaleString()}</div>
                  <div>Card: {(showVerify.card_total || 0).toLocaleString()}</div>
                </div>
                {showVerify.notes && <p className="text-xs mt-2">Notes: {showVerify.notes}</p>}
              </div>
              <p className="text-xs text-muted-foreground">By verifying, you confirm this staff has transferred the stated amount to the company and is cleared of liability.</p>
              <div className="flex gap-2">
                <Button variant="destructive" className="flex-1" onClick={() => verifySettlement(showVerify.id, false)}>Reject</Button>
                <Button className="flex-1 bg-success hover:bg-success/90" onClick={() => verifySettlement(showVerify.id, true)}>
                  <CheckCircle className="h-4 w-4 mr-1" /> Verify & Accept
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
