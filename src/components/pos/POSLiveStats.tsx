import { useState, useEffect } from "react";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { TrendingUp, ShoppingCart, DollarSign, Clock, AlertTriangle } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export function POSLiveStats({ hospitalId }: { hospitalId?: string | null }) {
  const [stats, setStats] = useState({ salesCount: 0, revenue: 0, itemsSold: 0, avgSale: 0 });
  const [lowStock, setLowStock] = useState(0);
  const isAdmin = useIsAdmin();

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    const today = new Date().toISOString().split("T")[0];
    let salesQb = supabase.from("pharmacy_sales").select("total")
      .gte("created_at", `${today}T00:00:00`).eq("status", "completed");
    if (hospitalId) salesQb = salesQb.eq("hospital_id", hospitalId);
    const { data: sales } = await salesQb;
    
    let stockQb = supabase.from("medicines").select("id", { count: "exact", head: true })
      .lt("stock", 10).eq("is_active", true);
    if (hospitalId) stockQb = stockQb.eq("hospital_id", hospitalId);
    const { count } = await stockQb;

    if (sales) {
      const revenue = sales.reduce((s, r) => s + (r.total || 0), 0);
      setStats({
        salesCount: sales.length,
        revenue,
        itemsSold: sales.length, // simplified
        avgSale: sales.length > 0 ? Math.round(revenue / sales.length) : 0,
      });
    }
    setLowStock(count || 0);
  };

  return (
    <div className="flex items-center gap-4 text-[10px]">
      <div className="flex items-center gap-1 text-success">
        <ShoppingCart className="h-3 w-3" />
        <span className="font-bold">{stats.salesCount}</span>
        <span className="text-muted-foreground">sales</span>
      </div>
      {isAdmin && (
        <div className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3 text-primary" />
          <span className="font-bold font-mono">KES {stats.revenue.toLocaleString()}</span>
        </div>
      )}
      {isAdmin && (
        <div className="flex items-center gap-1">
          <DollarSign className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Avg: </span>
          <span className="font-bold font-mono">{stats.avgSale.toLocaleString()}</span>
        </div>
      )}
      {lowStock > 0 && (
        <div className="flex items-center gap-1 text-warning">
          <AlertTriangle className="h-3 w-3" />
          <span className="font-bold">{lowStock}</span>
          <span>low stock</span>
        </div>
      )}
    </div>
  );
}
