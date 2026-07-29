import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useHospital } from "@/contexts/HospitalContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { exportToCSV } from "@/utils/exportUtils";
import { PrintButton } from "@/components/PrintButton";
import {
  Search, Download, ShoppingCart, CreditCard, Clock, RotateCcw, Eye,
} from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";

interface SaleRow {
  id: string;
  receipt_no: string;
  customer_name: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: string | null;
  amount_paid: number;
  change_amount: number;
  status: string;
  created_at: string;
  cashier_id: string | null;
  cashier?: { first_name: string; last_name: string; role: string } | null;
}

export default function SalesHistory() {
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [search, setSearch] = useState("");
  const [filterMethod, setFilterMethod] = useState("all");
  const [loading, setLoading] = useState(true);
  const isAdmin = useIsAdmin();

  const { hospitalId } = useHospital();

  const fetchSales = async () => {
    if (!hospitalId) return;
    const { data } = await supabase
      .from("pharmacy_sales")
      .select("*, cashier:staff!pharmacy_sales_cashier_id_fkey(first_name,last_name,role)")
      .eq("hospital_id", hospitalId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (data) setSales(data as unknown as SaleRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchSales(); }, [hospitalId]);

  const filtered = sales.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.receipt_no.toLowerCase().includes(q) || (s.customer_name || "").toLowerCase().includes(q);
    const matchMethod = filterMethod === "all" || (s.payment_method || "").toLowerCase().includes(filterMethod);
    return matchSearch && matchMethod;
  });

  const completed = filtered.filter(s => s.status === "completed");
  const totalRevenue = completed.reduce((sum, s) => sum + (s.total || 0), 0);
  const avgSale = completed.length > 0 ? Math.round(totalRevenue / completed.length) : 0;

  const handleRefund = async (id: string) => {
    if (!confirm("Process refund for this sale?")) return;
    await supabase.from("pharmacy_sales").update({ status: "refunded" } as any).eq("id", id);
    toast({ title: "Refund Processed" });
    fetchSales();
  };

  const handleExport = () => {
    exportToCSV(filtered.map(s => ({
      Receipt: s.receipt_no, Date: new Date(s.created_at).toLocaleDateString(),
      Customer: s.customer_name || "Walk-in", Total: s.total,
      Payment: s.payment_method || "", Status: s.status,
    })), "brightech-sales-history");
    toast({ title: "Exported" });
  };

  const statusColors: Record<string, string> = {
    completed: "bg-success/10 text-success border-success/30",
    refunded: "bg-destructive/10 text-destructive border-destructive/30",
  };

  return (
    <AppLayout title="Sales History">
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><ShoppingCart className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{filtered.length}</p><p className="text-xs text-muted-foreground">Transactions</p></div></CardContent></Card>
          {isAdmin && <Card><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center"><CreditCard className="h-5 w-5 text-success" /></div><div><p className="text-2xl font-bold">KES {totalRevenue.toLocaleString()}</p><p className="text-xs text-muted-foreground">Revenue</p></div></CardContent></Card>}
          {isAdmin && <Card><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center"><Clock className="h-5 w-5 text-warning" /></div><div><p className="text-2xl font-bold">KES {avgSale.toLocaleString()}</p><p className="text-xs text-muted-foreground">Avg Sale</p></div></CardContent></Card>}
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center"><RotateCcw className="h-5 w-5 text-destructive" /></div><div><p className="text-2xl font-bold">{filtered.filter(s => s.status === "refunded").length}</p><p className="text-xs text-muted-foreground">Refunds</p></div></CardContent></Card>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by receipt # or customer..." className="pl-9" />
          </div>
          <div className="flex gap-1.5">
            {["all", "cash", "mpesa", "card", "credit"].map(m => (
              <Button key={m} size="sm" variant={filterMethod === m ? "default" : "outline"} onClick={() => setFilterMethod(m)} className="text-xs capitalize">{m === "all" ? "All" : m}</Button>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={handleExport}><Download className="h-4 w-4 mr-1" />Export</Button>
          <PrintButton title="Sales History" contentId="sales-table" />
        </div>

        <Card id="sales-table">
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground text-sm">Loading sales...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No sales found</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold text-xs">Receipt #</th>
                  <th className="text-left p-3 font-semibold text-xs">Date & Time</th>
                  <th className="text-left p-3 font-semibold text-xs">Customer</th>
                  <th className="text-left p-3 font-semibold text-xs">Sold By</th>
                  <th className="text-right p-3 font-semibold text-xs">Total (KES)</th>
                  <th className="text-left p-3 font-semibold text-xs">Payment</th>
                  <th className="text-center p-3 font-semibold text-xs">Status</th>
                  <th className="text-center p-3 font-semibold text-xs">Actions</th>
                </tr></thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-mono text-xs font-semibold text-primary">{s.receipt_no}</td>
                      <td className="p-3 text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()}</td>
                      <td className="p-3 text-xs font-medium">{s.customer_name || "Walk-in"}</td>
                      <td className="p-3 text-xs">
                        {s.cashier ? (
                          <div>
                            <p className="font-medium">{s.cashier.first_name} {s.cashier.last_name}</p>
                            <p className="text-[10px] text-muted-foreground capitalize">{s.cashier.role?.replace(/_/g, ' ')}</p>
                          </div>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="p-3 text-right font-mono text-xs font-semibold">{(s.total || 0).toLocaleString()}</td>
                      <td className="p-3"><Badge variant="secondary" className="text-[10px]">{s.payment_method || "—"}</Badge></td>
                      <td className="p-3 text-center"><Badge className={`text-[10px] border ${statusColors[s.status] || ""}`}>{s.status}</Badge></td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {s.status === "completed" && (
                            <button onClick={() => handleRefund(s.id)} className="p-1.5 rounded hover:bg-destructive/10" title="Refund"><RotateCcw className="h-3.5 w-3.5 text-destructive" /></button>
                          )}
                          {isAdmin && (
                            <button onClick={async () => {
                              if (!confirm(`Delete sale ${s.receipt_no}?`)) return;
                              await supabase.from("pharmacy_sale_items").delete().eq("sale_id", s.id);
                              await supabase.from("pharmacy_sales").delete().eq("id", s.id);
                              toast({ title: "Sale deleted" });
                              fetchSales();
                            }} className="p-1.5 rounded hover:bg-destructive/10" title="Delete">
                              <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
