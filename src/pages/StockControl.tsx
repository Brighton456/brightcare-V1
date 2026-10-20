import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useHospital } from "@/contexts/HospitalContext";
import { useFacility } from "@/hooks/useFacility";
import { Package, ArrowRightLeft, History, AlertTriangle, Search, Plus, RefreshCw, FileSpreadsheet } from "lucide-react";
import { exportToCSV } from "@/utils/exportUtils";
import StockTransfers from "@/pages/StockTransfers";

interface StockMovement {
  id: string;
  movement_type: string;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reason: string;
  created_at: string;
  medicine_id: string;
  medicines?: { name: string; unit: string } | null;
}

interface StockBatch {
  id: string;
  batch_no: string;
  qty_remaining: number;
  expiry_date: string | null;
  cost_price: number;
  supplier_name: string | null;
  medicines?: { name: string; unit: string } | null;
}

export default function StockControl() {
  const { hospitalId } = useHospital();
  const { facilityType } = useFacility();
  const isHerbal = facilityType === "herbal";
  const [activeTab, setActiveTab] = useState("overview");
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [batches, setBatches] = useState<StockBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!hospitalId) return;
    fetchStockData();
  }, [hospitalId]);

  const fetchStockData = async () => {
    setLoading(true);
    try {
      const [movementsRes, batchesRes] = await Promise.all([
        supabase
          .from("stock_movements")
          .select("id, movement_type, quantity, previous_quantity, new_quantity, reason, created_at, medicine_id, medicines(name, unit)")
          .eq("hospital_id", hospitalId)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("stock_batches")
          .select("id, batch_no, qty_remaining, expiry_date, cost_price, supplier_name, medicines(name, unit)")
          .eq("hospital_id", hospitalId)
          .order("expiry_date", { ascending: true })
          .limit(100),
      ]);

      setMovements((movementsRes.data || []) as any);
      setBatches((batchesRes.data || []) as any);
    } catch (err) {
      console.error("Error fetching stock ledger:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMovements = movements.filter((m) =>
    m.medicines?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.movement_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValuation = batches.reduce((sum, b) => sum + (b.qty_remaining * b.cost_price), 0);
  const lowStockBatches = batches.filter((b) => b.qty_remaining <= 10);
  const expiringBatches = batches.filter((b) => {
    if (!b.expiry_date) return false;
    const exp = new Date(b.expiry_date);
    const now = new Date();
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
    return diffDays <= 60 && diffDays > 0;
  });

  return (
    <AppLayout title={isHerbal ? "Herbal Stock Control Centre" : "Stock Control Centre"}>
      <div className="space-y-4 p-1">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isHerbal ? "🌿 Herbal Stock Control Centre" : "📦 Stock Control Centre"}
            </h1>
            <p className="text-xs text-muted-foreground">
              Immutable stock movement ledger, batch tracking, and inter-branch transfers
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchStockData} disabled={loading}>
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportToCSV(
                  movements.map((m) => ({
                    Date: new Date(m.created_at).toLocaleString(),
                    Product: m.medicines?.name || "Unknown",
                    Type: m.movement_type,
                    Qty: m.quantity,
                    PrevQty: m.previous_quantity,
                    NewQty: m.new_quantity,
                    Reason: m.reason,
                  })),
                  "stock-movements-ledger"
                )
              }
            >
              <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" /> Export Ledger
            </Button>
          </div>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="rounded-lg border shadow-none">
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className="p-2.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Stock Valuation</p>
                <p className="text-lg font-bold">KES {totalValuation.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-lg border shadow-none">
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className="p-2.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400">
                <History className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Active Batches</p>
                <p className="text-lg font-bold">{batches.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-lg border shadow-none">
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className="p-2.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Low Stock Alerts</p>
                <p className="text-lg font-bold text-amber-600">{lowStockBatches.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-lg border shadow-none">
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className="p-2.5 rounded-md bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Expiring Batches (60d)</p>
                <p className="text-lg font-bold text-red-600">{expiringBatches.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-3">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="overview" className="gap-1.5 text-xs font-semibold">
              <History className="h-3.5 w-3.5" /> Ledger & Movements
            </TabsTrigger>
            <TabsTrigger value="batches" className="gap-1.5 text-xs font-semibold">
              <Package className="h-3.5 w-3.5" /> Batches & Stock
            </TabsTrigger>
            <TabsTrigger value="transfers" className="gap-1.5 text-xs font-semibold">
              <ArrowRightLeft className="h-3.5 w-3.5" /> Branch Transfers
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Ledger & Movements */}
          <TabsContent value="overview" className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by product, movement type, or reason..."
                  className="pl-8 h-9 text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <Card className="rounded-lg border shadow-none">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 text-xs">
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Product / Herb</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Qty Changed</TableHead>
                      <TableHead className="text-right">Prev Balance</TableHead>
                      <TableHead className="text-right">New Balance</TableHead>
                      <TableHead>Reason / Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                          Loading stock ledger movements...
                        </TableCell>
                      </TableRow>
                    ) : filteredMovements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                          No stock movements recorded yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMovements.map((m) => (
                        <TableRow key={m.id} className="text-xs hover:bg-muted/20">
                          <TableCell className="font-medium whitespace-nowrap text-muted-foreground">
                            {new Date(m.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-semibold">{m.medicines?.name || "Unknown Product"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] uppercase font-mono">
                              {m.movement_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                            +{m.quantity} {m.medicines?.unit || ""}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">{m.previous_quantity}</TableCell>
                          <TableCell className="text-right font-bold">{m.new_quantity}</TableCell>
                          <TableCell className="text-muted-foreground max-w-xs truncate">{m.reason}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Batches & Expiry */}
          <TabsContent value="batches" className="space-y-3">
            <Card className="rounded-lg border shadow-none">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 text-xs">
                      <TableHead>Batch No</TableHead>
                      <TableHead>Product / Herb</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead className="text-right">Qty Remaining</TableHead>
                      <TableHead className="text-right">Unit Cost (KES)</TableHead>
                      <TableHead>Supplier</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                          No batch stock records found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      batches.map((b) => (
                        <TableRow key={b.id} className="text-xs hover:bg-muted/20">
                          <TableCell className="font-mono font-bold">{b.batch_no}</TableCell>
                          <TableCell className="font-semibold">{b.medicines?.name || "Unknown"}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {b.expiry_date ? (
                              <Badge variant="outline" className="text-[10px]">
                                {new Date(b.expiry_date).toLocaleDateString()}
                              </Badge>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-right font-bold">{b.qty_remaining} {b.medicines?.unit || ""}</TableCell>
                          <TableCell className="text-right">{b.cost_price.toLocaleString()}</TableCell>
                          <TableCell className="text-muted-foreground">{b.supplier_name || "—"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Transfers */}
          <TabsContent value="transfers">
            <StockTransfers />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
