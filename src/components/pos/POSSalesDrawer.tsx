import { useState, useEffect } from "react";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Receipt, TrendingUp, DollarSign, ShoppingCart, Clock } from "lucide-react";

interface SaleRow {
  id: string;
  receipt_no: string;
  total: number;
  payment_method: string;
  customer_name: string | null;
  created_at: string;
  status: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function POSSalesDrawer({ open, onClose }: Props) {
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ count: 0, total: 0, cash: 0, mpesa: 0 });

  useEffect(() => {
    if (!open) return;
    loadTodaySales();
  }, [open]);

  const loadTodaySales = async () => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase.from("pharmacy_sales").select("*")
      .gte("created_at", `${today}T00:00:00`)
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) {
      setSales(data as SaleRow[]);
      const completed = data.filter((s: any) => s.status === "completed");
      setStats({
        count: completed.length,
        total: completed.reduce((s: number, r: any) => s + (r.total || 0), 0),
        cash: completed.filter((s: any) => s.payment_method === "cash").reduce((s: number, r: any) => s + (r.total || 0), 0),
        mpesa: completed.filter((s: any) => s.payment_method === "mpesa").reduce((s: number, r: any) => s + (r.total || 0), 0),
      });
    }
    setLoading(false);
  };

  const filtered = search
    ? sales.filter(s =>
        s.receipt_no.toLowerCase().includes(search.toLowerCase()) ||
        (s.customer_name || "").toLowerCase().includes(search.toLowerCase())
      )
    : sales;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" /> Today's Sales History
          </DialogTitle>
        </DialogHeader>

        {/* Stats cards */}
        <div className="grid grid-cols-4 gap-3 px-6 py-4 bg-muted/30">
          <div className="bg-card rounded-lg p-3 border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <ShoppingCart className="h-3.5 w-3.5" />
              <span className="text-[10px] font-semibold uppercase">Sales</span>
            </div>
            <p className="text-lg font-black">{stats.count}</p>
          </div>
          <div className="bg-card rounded-lg p-3 border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="text-[10px] font-semibold uppercase">Revenue</span>
            </div>
            <p className="text-lg font-black font-mono">KES {stats.total.toLocaleString()}</p>
          </div>
          <div className="bg-card rounded-lg p-3 border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-3.5 w-3.5" />
              <span className="text-[10px] font-semibold uppercase">Cash</span>
            </div>
            <p className="text-lg font-black font-mono text-success">KES {stats.cash.toLocaleString()}</p>
          </div>
          <div className="bg-card rounded-lg p-3 border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-3.5 w-3.5" />
              <span className="text-[10px] font-semibold uppercase">M-Pesa</span>
            </div>
            <p className="text-lg font-black font-mono text-info">KES {stats.mpesa.toLocaleString()}</p>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by receipt # or customer..."
              className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-background outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>

        {/* Sales list */}
        <div className="flex-1 overflow-auto px-6 pb-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">{search ? "No matching sales" : "No sales today"}</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filtered.map(sale => (
                <div key={sale.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                  <div className={`h-2 w-2 rounded-full shrink-0 ${
                    sale.status === "completed" ? "bg-success" : sale.status === "refunded" ? "bg-destructive" : "bg-warning"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">{sale.receipt_no}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize">{sale.payment_method || "cash"}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{sale.customer_name || "Walk-in"}</span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(sale.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                  <span className={`text-sm font-bold font-mono ${
                    sale.status === "refunded" ? "text-destructive line-through" : ""
                  }`}>
                    KES {(sale.total || 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
