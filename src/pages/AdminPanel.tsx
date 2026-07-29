import { useState, useMemo, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { usePharmacy } from "@/contexts/PharmacyStore";
import { exportToCSV, exportToPrintableHTML } from "@/utils/exportUtils";
import { downloadHospitalBackup } from "@/utils/backupExport";
import { toast } from "@/hooks/use-toast";
import {
  Users, Shield, Activity, Eye, Plus, TrendingUp, DollarSign,
  BarChart3, Package, CreditCard, AlertTriangle, FileText, Printer,
  Download, Calendar, Pill, Receipt, ArrowUpRight, ArrowDownRight, Building,
  Database, Loader2,
} from "lucide-react";
import { useHospital } from "@/contexts/HospitalContext";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area,
} from "recharts";

const CHART_COLORS = ["hsl(217, 71%, 45%)", "hsl(142, 60%, 40%)", "hsl(38, 92%, 50%)", "hsl(0, 72%, 51%)", "hsl(262, 60%, 50%)"];

const reportTypes = [
  { id: "daily", title: "Daily Sales Report", desc: "Complete sales summary for today", icon: BarChart3, category: "Sales" },
  { id: "cashier", title: "Sales by Cashier", desc: "Individual cashier performance", icon: Users, category: "Sales" },
  { id: "medicine", title: "Sales by Medicine", desc: "Top-selling medicines breakdown", icon: Package, category: "Sales" },
  { id: "payment", title: "Payment Summary", desc: "Revenue by payment method", icon: CreditCard, category: "Payments" },
  { id: "inventory", title: "Inventory Movement", desc: "Stock in/out tracking", icon: Package, category: "Inventory" },
  { id: "expiry", title: "Expiry Report", desc: "Medicines approaching expiry", icon: AlertTriangle, category: "Inventory" },
  { id: "refund", title: "Refund History", desc: "All refunded transactions", icon: FileText, category: "Sales" },
  { id: "profit", title: "Profit Estimation", desc: "Revenue vs cost analysis", icon: TrendingUp, category: "Financial" },
];

const ROLES: Record<string, string> = {
  super_admin: "Super Admin", hospital_admin: "Hospital Admin", doctor: "Doctor",
  nurse: "Nurse", receptionist: "Receptionist", pharmacist: "Pharmacist",
  cashier: "Cashier", lab_technician: "Lab Technician", accountant: "Accountant",
  records_officer: "Records Officer",
};

const roleColors: Record<string, string> = {
  super_admin: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  hospital_admin: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  doctor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  nurse: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
  pharmacist: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  cashier: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  lab_technician: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
};

export default function AdminPanel() {
  const { hospitalId, hospital } = useHospital();
  const { staff: currentStaff } = useAuth();
  const { salesHistory, medicines, stockAdjustments, customers } = usePharmacy();
  const [activeTab, setActiveTab] = useState<"overview" | "staff" | "departments" | "reports" | "activity" | "security">("overview");
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [selectedReport, setSelectedReport] = useState("daily");
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split("T")[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [backupBusy, setBackupBusy] = useState(false);
  const [backupStatus, setBackupStatus] = useState("");

  const handleFullBackup = async () => {
    if (backupBusy) return;
    setBackupBusy(true);
    setBackupStatus("Starting…");
    try {
      const { tables, totalRows } = await downloadHospitalBackup(
        hospitalId || "",
        hospital?.name || "",
        (p) => setBackupStatus(`Exporting ${p.table} (${p.index}/${p.total})`)
      );
      toast({ title: "Backup ready", description: `${tables} tables, ${totalRows.toLocaleString()} rows downloaded as ZIP.` });
    } catch (e: any) {
      toast({ title: "Backup failed", description: e?.message || "Could not generate backup", variant: "destructive" });
    } finally {
      setBackupBusy(false);
      setBackupStatus("");
    }
  };

  // Real data from Supabase
  const [staffList, setStaffList] = useState<any[]>([]);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: "", description: "", head_name: "" });
  const [billStats, setBillStats] = useState({ totalRevenue: 0, paidBills: 0, pendingBills: 0 });
  const [dbSales, setDbSales] = useState<any[]>([]);

  useEffect(() => {
    const fetchAdminData = async () => {
      const [sRes, aRes, dRes, bRes] = await Promise.all([
        supabase.from("staff").select("*, departments(name)").eq("hospital_id", hospitalId).order("created_at", { ascending: false }),
        supabase.from("activity_log").select("*, staff(first_name,last_name)").eq("hospital_id", hospitalId).order("created_at", { ascending: false }).limit(50),
        supabase.from("departments").select("*").eq("hospital_id", hospitalId).order("name"),
        supabase.from("bills").select("total, status").eq("hospital_id", hospitalId),
      ]);
      if (sRes.data) setStaffList(sRes.data);
      if (aRes.data) setActivityLog(aRes.data);
      if (dRes.data) setDepartments(dRes.data);
      if (bRes.data) {
        const paid = bRes.data.filter((b: any) => b.status === "paid");
        const pending = bRes.data.filter((b: any) => b.status === "pending");
        setBillStats({
          totalRevenue: paid.reduce((s: number, b: any) => s + (b.total || 0), 0),
          paidBills: paid.length,
          pendingBills: pending.length,
        });
      }
    };
    fetchAdminData();
  }, [hospitalId]);

  const createDepartment = async () => {
    if (!deptForm.name) { toast({ title: "Error", description: "Department name required", variant: "destructive" }); return; }
    const { error } = await supabase.from("departments").insert({
      name: deptForm.name,
      description: deptForm.description || null,
      head_name: deptForm.head_name || null,
          hospital_id: hospitalId,
    } as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Department Created" });
    setShowDeptModal(false);
    setDeptForm({ name: "", description: "", head_name: "" });
    const { data } = await supabase.from("departments").select("*").eq("hospital_id", hospitalId).order("name");
    if (data) setDepartments(data);
  };

  // Analytics data
  const completedSales = salesHistory.filter(s => s.status === "completed");
  const totalRevenue = completedSales.reduce((s, sale) => s + sale.total, 0) + billStats.totalRevenue;
  const totalProfit = completedSales.reduce((s, sale) => {
    const cost = sale.items.reduce((c, item) => {
      const med = medicines.find(m => m.id === item.id);
      return c + (med ? med.costPrice * item.qty : 0);
    }, 0);
    return s + (sale.total - cost);
  }, 0);
  const lowStockCount = medicines.filter(m => m.stock <= m.reorderLevel).length;

  // Chart data
  const monthlySalesData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.map((m, i) => ({
      month: m,
      revenue: Math.round(15000 + Math.random() * 45000 + (i > 5 ? 10000 : 0)),
      profit: Math.round(5000 + Math.random() * 15000 + (i > 5 ? 4000 : 0)),
    }));
  }, [hospitalId]);

  const paymentMethodData = useMemo(() => {
    const methods: Record<string, number> = {};
    completedSales.forEach(s => { methods[s.paymentMethod] = (methods[s.paymentMethod] || 0) + s.total; });
    if (Object.keys(methods).length === 0) {
      return [{ name: "Cash", value: 45000 }, { name: "M-Pesa", value: 32000 }, { name: "Card", value: 12000 }, { name: "Credit", value: 8000 }];
    }
    return Object.entries(methods).map(([name, value]) => ({ name, value }));
  }, [completedSales]);

  const topMedicines = useMemo(() => {
    const medMap = new Map<string, { name: string; qty: number; revenue: number }>();
    completedSales.forEach(s => s.items.forEach(item => {
      const existing = medMap.get(item.id) || { name: item.name, qty: 0, revenue: 0 };
      medMap.set(item.id, { name: item.name, qty: existing.qty + item.qty, revenue: existing.revenue + item.lineTotal });
    }));
    const sorted = Array.from(medMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
    if (sorted.length === 0) {
      return medicines.slice(0, 8).map(m => ({ name: m.name.length > 18 ? m.name.slice(0, 18) + "…" : m.name, qty: Math.round(10 + Math.random() * 50), revenue: Math.round(m.price * (10 + Math.random() * 50)) }));
    }
    return sorted.map(s => ({ ...s, name: s.name.length > 18 ? s.name.slice(0, 18) + "…" : s.name }));
  }, [completedSales, medicines]);

  const weeklyTrend = useMemo(() => {
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => ({
      day, sales: Math.round(5000 + Math.random() * 20000), customers: Math.round(10 + Math.random() * 40),
    }));
  }, [hospitalId]);

  // Fetch sales from DB for reports
  useEffect(() => {
    if (activeTab !== "reports") return;
    const fetchSales = async () => {
      let qb = supabase.from("pharmacy_sales").select("*")
        .gte("created_at", `${dateFrom}T00:00:00`)
        .lte("created_at", `${dateTo}T23:59:59`)
        .order("created_at", { ascending: false });
      if (hospitalId) qb = qb.eq("hospital_id", hospitalId);
      const { data } = await qb.limit(1000);
      setDbSales(data || []);
    };
    fetchSales();
  }, [activeTab, dateFrom, dateTo, hospitalId]);

  // Report logic — use DB sales
  const filteredCompleted = dbSales.filter((s: any) => s.status === "completed");
  const filteredRevenue = filteredCompleted.reduce((s: number, sale: any) => s + (sale.total || 0), 0);

  const getReportData = () => {
    switch (selectedReport) {
      case "daily": return filteredCompleted.map((s: any) => ({ Receipt: s.receipt_no, Time: new Date(s.created_at).toLocaleTimeString(), Customer: s.customer_name || "Walk-in", Total: s.total || 0, Payment: s.payment_method || "cash", Cashier: s.cashier_name || "-" }));
      case "medicine": { const m = new Map<string, any>(); filteredCompleted.forEach((s: any) => { const items = s.items || []; items.forEach((i: any) => { const e = m.get(i.medicine_id || i.name) || { name: i.name, qty: 0, revenue: 0 }; m.set(i.medicine_id || i.name, { ...e, qty: e.qty + (i.quantity || 0), revenue: e.revenue + (i.line_total || 0) }); }); }); return Array.from(m.values()).sort((a, b) => b.revenue - a.revenue); }
      case "payment": { const p = new Map<string, any>(); filteredCompleted.forEach((s: any) => { const method = s.payment_method || "cash"; const e = p.get(method) || { count: 0, amount: 0 }; p.set(method, { count: e.count + 1, amount: e.amount + (s.total || 0) }); }); return Array.from(p.entries()).map(([m, d]) => ({ Method: m, Count: d.count, Amount: d.amount, Percentage: `${Math.round((d.amount / (filteredRevenue || 1)) * 100)}%` })); }
      case "expiry": return medicines.filter(m => new Date(m.expiryDate) <= new Date(new Date().setMonth(new Date().getMonth() + 6))).sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()).map(m => ({ Name: m.name, Batch: m.batchNo, Expiry: m.expiryDate, Stock: m.stock, Value: m.price * m.stock }));
      case "refund": return dbSales.filter((s: any) => s.status === "refunded").map((s: any) => ({ Receipt: s.receipt_no, Customer: s.customer_name || "Walk-in", Total: s.total || 0 }));
      case "inventory": return stockAdjustments.map(a => ({ Time: a.timestamp.toLocaleString(), Medicine: a.medicineName, Type: a.type, Change: a.quantityChange, "New Stock": a.newStock, Reason: a.reason }));
      case "profit": return filteredCompleted.map((s: any) => { const items = s.items || []; const cost = items.reduce((sum: number, i: any) => sum + ((i.cost_price || 0) * (i.quantity || 0)), 0); return { Receipt: s.receipt_no, Revenue: s.total || 0, Cost: cost, Profit: (s.total || 0) - cost, Margin: `${Math.round((((s.total || 0) - cost) / ((s.total || 0) || 1)) * 100)}%` }; });
      default: return filteredCompleted.map((s: any) => ({ Receipt: s.receipt_no, Total: s.total || 0, Payment: s.payment_method || "cash" }));
    }
  };

  const reportData = getReportData();

  const handleCSVExport = () => {
    if (reportData.length === 0) { toast({ title: "No Data", variant: "destructive" }); return; }
    exportToCSV(reportData as any, `brightech-${selectedReport}-report`);
    toast({ title: "CSV Exported" });
  };

  const handlePrint = () => {
    const data = reportData as Record<string, unknown>[];
    if (data.length === 0) { toast({ title: "No Data", variant: "destructive" }); return; }
    const headers = Object.keys(data[0]);
    const rows = data.map(row => `<tr>${headers.map(h => `<td>${row[h]}</td>`).join("")}</tr>`).join("");
    const title = reportTypes.find(r => r.id === selectedReport)?.title || "Report";
    exportToPrintableHTML(title, `<h1>${title}</h1><div class="summary"><p><strong>Period:</strong> ${dateFrom} to ${dateTo}</p></div><table><thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>`);
  };

  return (
    <AppLayout title="Admin Panel">
      <div className="space-y-4">
        <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit flex-wrap">
          {(["overview", "staff", "departments", "reports", "activity", "security"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {tab === "overview" ? "📊 Analytics" : tab === "staff" ? "👥 Staff" : tab === "departments" ? "🏢 Departments" : tab === "reports" ? "📋 Reports" : tab === "security" ? "🔐 Security" : "📝 Activity Log"}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Revenue", value: `KES ${totalRevenue.toLocaleString() || "0"}`, icon: DollarSign, change: "+12.5%", up: true, bg: "bg-primary/10", fg: "text-primary" },
                { label: "Net Profit", value: `KES ${totalProfit.toLocaleString() || "0"}`, icon: TrendingUp, change: "+8.2%", up: true, bg: "bg-success/10", fg: "text-success" },
                { label: "Staff Members", value: String(staffList.length), icon: Users, change: "", up: true, bg: "bg-info/10", fg: "text-info" },
                { label: "Active Customers", value: String(customers.length), icon: Users, change: "+3", up: true, bg: "bg-warning/10", fg: "text-warning" },
              ].map(kpi => (
                <Card key={kpi.label}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">{kpi.label}</p>
                        <p className="text-xl font-bold mt-1">{kpi.value}</p>
                        {kpi.change && (
                          <div className="flex items-center gap-1 mt-1">
                            {kpi.up ? <ArrowUpRight className="h-3 w-3 text-success" /> : <ArrowDownRight className="h-3 w-3 text-destructive" />}
                            <span className={`text-[10px] font-semibold ${kpi.up ? "text-success" : "text-destructive"}`}>{kpi.change}</span>
                          </div>
                        )}
                      </div>
                      <div className={`h-10 w-10 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                        <kpi.icon className={`h-5 w-5 ${kpi.fg}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Revenue & Profit Trend</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={monthlySalesData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(217, 71%, 45%)" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(217, 71%, 45%)" stopOpacity={0}/></linearGradient>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(142, 60%, 40%)" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(142, 60%, 40%)" stopOpacity={0}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 88%)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => `KES ${v.toLocaleString()}`} />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(217, 71%, 45%)" fill="url(#colorRevenue)" strokeWidth={2} name="Revenue" />
                      <Area type="monotone" dataKey="profit" stroke="hsl(142, 60%, 40%)" fill="url(#colorProfit)" strokeWidth={2} name="Profit" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Payment Methods</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={paymentMethodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={4} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {paymentMethodData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => `KES ${v.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Top Selling Medicines</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={topMedicines} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 88%)" />
                      <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: number) => `KES ${v.toLocaleString()}`} />
                      <Bar dataKey="revenue" fill="hsl(217, 71%, 45%)" radius={[0, 4, 4, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Weekly Sales Trend</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={weeklyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 88%)" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => `KES ${v.toLocaleString()}`} />
                      <Line type="monotone" dataKey="sales" stroke="hsl(217, 71%, 45%)" strokeWidth={2} dot={{ r: 4 }} name="Sales" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* STAFF TAB */}
        {activeTab === "staff" && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" /> Staff Directory ({staffList.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold text-xs">Staff</th>
                  <th className="text-left p-3 font-semibold text-xs">Role</th>
                  <th className="text-left p-3 font-semibold text-xs hidden md:table-cell">Department</th>
                  <th className="text-left p-3 font-semibold text-xs hidden md:table-cell">Contact</th>
                  <th className="text-left p-3 font-semibold text-xs">Status</th>
                </tr></thead>
                <tbody>
                  {staffList.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">No staff registered. Go to Staff Management to add staff.</td></tr>
                  ) : staffList.map((s: any) => (
                    <tr key={s.id} className="border-b hover:bg-muted/30">
                      <td className="p-3"><p className="font-semibold text-xs">{s.first_name} {s.last_name}</p><p className="text-[10px] text-muted-foreground">{s.staff_no}</p></td>
                      <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[s.role] || "bg-gray-100 text-gray-800"}`}>{ROLES[s.role] || s.role}</span></td>
                      <td className="p-3 text-xs hidden md:table-cell">{s.departments?.name || "—"}</td>
                      <td className="p-3 text-xs hidden md:table-cell">{s.email || s.phone || "—"}</td>
                      <td className="p-3"><Badge variant={s.is_active ? "default" : "secondary"} className="text-[10px]">{s.is_active ? "Active" : "Inactive"}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* DEPARTMENTS TAB */}
        {activeTab === "departments" && (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold">Departments</h2>
              <Button size="sm" onClick={() => setShowDeptModal(true)} className="gap-1"><Plus className="h-3.5 w-3.5" /> Add Department</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {departments.length === 0 ? (
                <p className="text-sm text-muted-foreground col-span-full text-center py-8">No departments created yet.</p>
              ) : departments.map((d: any) => (
                <Card key={d.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Building className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-semibold text-sm">{d.name}</p>
                        {d.head_name && <p className="text-xs text-muted-foreground">Head: {d.head_name}</p>}
                      </div>
                    </div>
                    {d.description && <p className="text-xs text-muted-foreground">{d.description}</p>}
                    <Badge variant={d.is_active ? "default" : "secondary"} className="text-[10px] mt-2">{d.is_active ? "Active" : "Inactive"}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Dialog open={showDeptModal} onOpenChange={setShowDeptModal}>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Department</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Name *</Label><Input value={deptForm.name} onChange={e => setDeptForm(f => ({ ...f, name: e.target.value }))} /></div>
                  <div><Label>Description</Label><Input value={deptForm.description} onChange={e => setDeptForm(f => ({ ...f, description: e.target.value }))} /></div>
                  <div><Label>Department Head</Label><Input value={deptForm.head_name} onChange={e => setDeptForm(f => ({ ...f, head_name: e.target.value }))} /></div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setShowDeptModal(false)}>Cancel</Button>
                  <Button onClick={createDepartment}>Create</Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}

        {/* ACTIVITY LOG TAB */}
        {activeTab === "activity" && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4" /> Activity Log</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold text-xs">Action</th>
                  <th className="text-left p-3 font-semibold text-xs">Staff</th>
                  <th className="text-left p-3 font-semibold text-xs hidden md:table-cell">Module</th>
                  <th className="text-left p-3 font-semibold text-xs hidden md:table-cell">Details</th>
                  <th className="text-left p-3 font-semibold text-xs">Time</th>
                </tr></thead>
                <tbody>
                  {activityLog.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">No activity recorded yet.</td></tr>
                  ) : activityLog.map((a: any) => (
                    <tr key={a.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-semibold text-xs">{a.action}</td>
                      <td className="p-3 text-xs">{a.staff?.first_name ? `${a.staff.first_name} ${a.staff.last_name}` : "System"}</td>
                      <td className="p-3 text-xs hidden md:table-cell"><Badge variant="outline" className="text-[10px]">{a.module || "—"}</Badge></td>
                      <td className="p-3 text-xs hidden md:table-cell text-muted-foreground">{a.details || "—"}</td>
                      <td className="p-3 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* REPORTS TAB */}
        {activeTab === "reports" && (
          <>
            <Card className="border-primary/30">
              <CardContent className="flex flex-col sm:flex-row sm:items-center gap-3 py-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Database className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Full Data Backup</p>
                  <p className="text-xs text-muted-foreground">
                    {backupBusy ? backupStatus : "Download all hospital data (every table) as a ZIP of CSV files."}
                  </p>
                </div>
                <Button size="sm" onClick={handleFullBackup} disabled={backupBusy} className="gap-1.5">
                  {backupBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {backupBusy ? "Preparing…" : "Download ZIP Backup"}
                </Button>
              </CardContent>
            </Card>
            <div className="flex gap-3 flex-wrap items-center">
              <div className="flex gap-1 flex-wrap">
                {reportTypes.map(r => (
                  <Button key={r.id} size="sm" variant={selectedReport === r.id ? "default" : "outline"} onClick={() => setSelectedReport(r.id)} className="text-xs gap-1">
                    <r.icon className="h-3 w-3" />{r.title}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 items-center flex-wrap">
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40 h-9 text-xs" /><span className="text-xs text-muted-foreground">to</span><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40 h-9 text-xs" /></div>
              <div className="flex gap-1.5 ml-auto">
                <Button size="sm" variant="outline" onClick={handleCSVExport} className="gap-1 text-xs"><Download className="h-3 w-3" />CSV</Button>
                <Button size="sm" variant="outline" onClick={handlePrint} className="gap-1 text-xs"><Printer className="h-3 w-3" />Print</Button>
              </div>
            </div>
            <Card>
              <CardContent className="p-0 overflow-auto">
                {reportData.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground"><FileText className="h-8 w-8 mx-auto mb-2 opacity-30" /><p className="text-sm">No data for selected period</p></div>
                ) : (
                  <table className="w-full text-xs">
                    <thead><tr className="border-b bg-muted/50">{Object.keys(reportData[0]).map(h => <th key={h} className="text-left p-3 font-semibold">{h}</th>)}</tr></thead>
                    <tbody>
                      {reportData.map((row, i) => (
                        <tr key={i} className="border-b hover:bg-muted/30">{Object.values(row as any).map((v: any, j) => <td key={j} className="p-3">{typeof v === "number" ? v.toLocaleString() : String(v)}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* SECURITY TAB */}
        {activeTab === "security" && (
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4" /> Change Your Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Current Password</Label>
                <Input type="password" value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} />
              </div>
              <div>
                <Label>New Password</Label>
                <Input type="password" value={pwForm.newPw} onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))} />
              </div>
              <div>
                <Label>Confirm New Password</Label>
                <Input type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} />
              </div>
              <Button disabled={pwSaving} onClick={async () => {
                if (!pwForm.current || !pwForm.newPw) {
                  toast({ title: "Error", description: "All fields required", variant: "destructive" });
                  return;
                }
                if (pwForm.newPw !== pwForm.confirm) {
                  toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
                  return;
                }
                if (pwForm.newPw.length < 6) {
                  toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
                  return;
                }
                setPwSaving(true);
                try {
                  const staffId = currentStaff?.id;
                  if (!staffId) {
                    toast({ title: "Error", description: "Not logged in", variant: "destructive" });
                    setPwSaving(false);
                    return;
                  }
                  const { data: staff } = await supabase.from("staff").select("password_hash").eq("id", staffId).single();
                  if (!staff) {
                    toast({ title: "Error", description: "Could not verify account", variant: "destructive" });
                    setPwSaving(false);
                    return;
                  }
                  const { data: valid } = await supabase.rpc("verify_password", { raw_password: pwForm.current, hashed: (staff as any).password_hash });
                  if (!valid) {
                    toast({ title: "Error", description: "Current password is incorrect", variant: "destructive" });
                    setPwSaving(false);
                    return;
                  }
                  // Save new password - store plaintext AND hash
                  const { data: newHash } = await supabase.rpc("hash_password", { raw_password: pwForm.newPw });
                  await supabase.from("staff").update({
                    password_hash: newHash,
                    plain_password: pwForm.newPw,
                  } as any).eq("id", staffId);
                  toast({ title: "✅ Password Changed", description: "Your password has been updated successfully." });
                  setPwForm({ current: "", newPw: "", confirm: "" });
                } catch (err: any) {
                  toast({ title: "Error", description: err.message || "Failed to change password", variant: "destructive" });
                } finally {
                  setPwSaving(false);
                }
              }} className="w-full">
                {pwSaving ? "Saving..." : "Change Password"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
