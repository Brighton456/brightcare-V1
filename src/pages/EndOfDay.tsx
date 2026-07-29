import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { usePharmacy } from "@/contexts/PharmacyStore";
import { exportToPrintableHTML } from "@/utils/exportUtils";
import { toast } from "@/hooks/use-toast";
import { useHospital } from "@/contexts/HospitalContext";
import {
  Calendar, Clock, DollarSign, ShoppingCart, CreditCard, TrendingUp,
  Printer, Download, CheckCircle,
} from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";

interface PaymentBreakdown { method: string; count: number; amount: number; }

export default function EndOfDay() {
  const { hospitalId } = useHospital();
  const [isClosed, setIsClosed] = useState(false);
  const isAdmin = useIsAdmin();
  const { salesHistory } = usePharmacy();
  const [billStats, setBillStats] = useState({ totalRevenue: 0, billCount: 0, payments: [] as PaymentBreakdown[] });
  const [pharmacySales, setPharmacySales] = useState<any[]>([]);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const fetchToday = async () => {
      const [bRes, psRes] = await Promise.all([
        supabase.from("bills").select("total, status, payment_method").eq("hospital_id", hospitalId).gte("created_at", today),
        supabase.from("pharmacy_sales").select("total, payment_method, status, receipt_no").eq("hospital_id", hospitalId).gte("created_at", today),
      ]);
      if (bRes.data) {
        const paid = bRes.data.filter((b: any) => b.status === "paid");
        const payMap = new Map<string, PaymentBreakdown>();
        paid.forEach((b: any) => {
          const m = b.payment_method || "cash";
          const e = payMap.get(m) || { method: m, count: 0, amount: 0 };
          payMap.set(m, { method: m, count: e.count + 1, amount: e.amount + (b.total || 0) });
        });
        setBillStats({
          totalRevenue: paid.reduce((s: number, b: any) => s + (b.total || 0), 0),
          billCount: paid.length,
          payments: Array.from(payMap.values()),
        });
      }
      if (psRes.data) setPharmacySales(psRes.data);
    };
    fetchToday();
  }, [hospitalId]);

  // Combine pharmacy POS local sales with DB sales
  const todayLocalSales = salesHistory.filter(s => s.timestamp.toISOString().split("T")[0] === today && s.status === "completed");
  const pharmacyRevenue = pharmacySales.filter((s: any) => s.status === "completed").reduce((sum: number, s: any) => sum + (s.total || 0), 0);
  const localRevenue = todayLocalSales.reduce((s, sale) => s + sale.total, 0);
  const totalPharmacyRevenue = Math.max(pharmacyRevenue, localRevenue);

  const totalRevenue = billStats.totalRevenue + totalPharmacyRevenue;
  const totalSales = billStats.billCount + Math.max(pharmacySales.length, todayLocalSales.length);

  // Combine payment methods
  const allPayments = new Map<string, PaymentBreakdown>();
  billStats.payments.forEach(p => allPayments.set(p.method, { ...p }));
  const pharmPaySource = pharmacySales.length > 0 ? pharmacySales : todayLocalSales.map(s => ({ payment_method: s.paymentMethod, total: s.total }));
  pharmPaySource.forEach((s: any) => {
    const m = s.payment_method || s.paymentMethod || "cash";
    const e = allPayments.get(m) || { method: m, count: 0, amount: 0 };
    allPayments.set(m, { method: m, count: e.count + 1, amount: e.amount + (s.total || 0) });
  });
  const payments = Array.from(allPayments.values());

  const handlePrint = () => {
    const rows = payments.map(p => `<tr><td>${p.method}</td><td>${p.count}</td><td>KES ${p.amount.toLocaleString()}</td><td>${totalRevenue > 0 ? Math.round((p.amount / totalRevenue) * 100) : 0}%</td></tr>`).join("");
    exportToPrintableHTML("End of Day Report", `
      <h1>End of Day Report</h1>
      <div class="summary"><p><strong>Date:</strong> ${today}</p><p><strong>Total Sales:</strong> ${totalSales}</p><p><strong>Total Revenue:</strong> KES ${totalRevenue.toLocaleString()}</p></div>
      <table><thead><tr><th>Method</th><th>Count</th><th>Amount</th><th>%</th></tr></thead><tbody>${rows}</tbody></table>
    `);
  };

  const handleCloseDay = () => {
    setIsClosed(true);
    toast({ title: "Day Closed", description: `Revenue: KES ${totalRevenue.toLocaleString()}` });
  };

  return (
    <AppLayout title="End of Day">
      <div className="space-y-4 max-w-5xl">
        <Card className={isClosed ? "border-success/50 bg-success/5" : "border-warning/50 bg-warning/5"}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isClosed ? <CheckCircle className="h-6 w-6 text-success" /> : <Clock className="h-6 w-6 text-warning" />}
              <div>
                <h3 className="font-bold">{isClosed ? "Day Closed" : "Day In Progress"}</h3>
                <p className="text-sm text-muted-foreground">{today}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-1" />Print Report</Button>
              {!isClosed && <Button size="sm" variant="destructive" onClick={handleCloseDay}>Close Day</Button>}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-4 text-center"><ShoppingCart className="h-5 w-5 mx-auto text-primary mb-1" /><p className="text-2xl font-bold">{totalSales}</p><p className="text-xs text-muted-foreground">Total Sales</p></CardContent></Card>
          {isAdmin && <Card><CardContent className="p-4 text-center"><DollarSign className="h-5 w-5 mx-auto text-success mb-1" /><p className="text-2xl font-bold">KES {totalRevenue.toLocaleString()}</p><p className="text-xs text-muted-foreground">Total Revenue</p></CardContent></Card>}
          {isAdmin && <Card><CardContent className="p-4 text-center"><TrendingUp className="h-5 w-5 mx-auto text-primary mb-1" /><p className="text-2xl font-bold">KES {totalSales > 0 ? Math.round(totalRevenue / totalSales).toLocaleString() : "0"}</p><p className="text-xs text-muted-foreground">Avg per Sale</p></CardContent></Card>}
          <Card><CardContent className="p-4 text-center"><CreditCard className="h-5 w-5 mx-auto text-warning mb-1" /><p className="text-2xl font-bold">{payments.length}</p><p className="text-xs text-muted-foreground">Payment Methods</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Payment Summary</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-semibold text-xs">Method</th>
                <th className="text-right p-3 font-semibold text-xs">Count</th>
                <th className="text-right p-3 font-semibold text-xs">Amount (KES)</th>
                <th className="text-right p-3 font-semibold text-xs">%</th>
              </tr></thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-muted-foreground text-sm">No sales today</td></tr>
                ) : payments.map(p => (
                  <tr key={p.method} className="border-b">
                    <td className="p-3 font-medium text-xs capitalize">{p.method}</td>
                    <td className="p-3 text-right text-xs">{p.count}</td>
                    <td className="p-3 text-right font-mono text-xs font-semibold">{p.amount.toLocaleString()}</td>
                    <td className="p-3 text-right text-xs text-muted-foreground">{totalRevenue > 0 ? Math.round((p.amount / totalRevenue) * 100) : 0}%</td>
                  </tr>
                ))}
              </tbody>
              {payments.length > 0 && (
                <tfoot><tr className="bg-muted/30 font-semibold">
                  <td className="p-3 text-xs">Total</td>
                  <td className="p-3 text-right text-xs">{payments.reduce((s, p) => s + p.count, 0)}</td>
                  <td className="p-3 text-right font-mono text-xs">{totalRevenue.toLocaleString()}</td>
                  <td className="p-3 text-right text-xs">100%</td>
                </tr></tfoot>
              )}
            </table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
