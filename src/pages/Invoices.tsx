import { useState, useEffect, useRef, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useHospital } from "@/contexts/HospitalContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { exportToCSV } from "@/utils/exportUtils";
import { ComboInput } from "@/components/ComboInput";
import {
  Plus, Search, Download, FileText, Save, Trash2, Package, Eye,
  ChevronUp, ChevronDown, Calendar, Printer,
} from "lucide-react";

/* ─── types ─── */
interface InvItem {
  medicine_id: string | null;
  medicine_name: string;
  batch_no: string;
  expiry_date: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
}

interface MedOption {
  id: string; name: string; cost_price: number | null; price: number;
  batch_no: string | null; expiry_date: string | null; stock: number | null;
}

type CellPos = { row: number; col: number };

const GRID_COLS = ["medicine_name", "batch_no", "expiry_date", "quantity", "unit_price", "discount", "total"] as const;
type GridCol = (typeof GRID_COLS)[number];

/* ─── component ─── */
export default function Invoices() {
  const { hospitalId } = useHospital();
  const { staff } = useAuth();

  /* ── list tab state ── */
  const [invoices, setInvoices] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"list" | "create">("list");

  /* ── form state ── */
  const [supplierName, setSupplierName] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvItem[]>([emptyItem()]);
  const [saving, setSaving] = useState(false);

  /* ── medicine options ── */
  const [medicines, setMedicines] = useState<MedOption[]>([]);
  const [supplierOptions, setSupplierOptions] = useState<{ label: string; value: string }[]>([]);

  /* ── grid navigation ── */
  const [activeCell, setActiveCell] = useState<CellPos | null>(null);
  const [medSearch, setMedSearch] = useState<{ row: number; q: string; open: boolean } | null>(null);
  const gridRef = useRef<HTMLTableElement>(null);

  /* ── view modal ── */
  const [viewInvoice, setViewInvoice] = useState<any | null>(null);
  const [viewItems, setViewItems] = useState<any[]>([]);

  /* ─── helpers ─── */
  function emptyItem(): InvItem {
    return { medicine_id: null, medicine_name: "", batch_no: "", expiry_date: "", quantity: 1, unit_price: 0, discount: 0, total: 0 };
  }

  function genInvoiceNo() {
    return `INV-${Date.now().toString(36).toUpperCase()}`;
  }

  /* ─── load data ─── */
  const loadInvoices = useCallback(async () => {
    if (!hospitalId) return;
    const { data } = await supabase.from("invoices").select("*").eq("hospital_id", hospitalId).order("created_at", { ascending: false });
    setInvoices(data || []);
  }, [hospitalId]);

  const loadMedicines = useCallback(async () => {
    if (!hospitalId) return;
    const { data } = await supabase.from("medicines").select("id,name,cost_price,price,batch_no,expiry_date,stock").eq("hospital_id", hospitalId).eq("is_active", true);
    setMedicines(data || []);
  }, [hospitalId]);

  const loadSuppliers = useCallback(async () => {
    if (!hospitalId) return;
    const { data } = await supabase.from("dropdown_options").select("label,value").eq("hospital_id", hospitalId).eq("category", "supplier").eq("is_active", true);
    setSupplierOptions(data || []);
  }, [hospitalId]);

  useEffect(() => { loadInvoices(); loadMedicines(); loadSuppliers(); }, [loadInvoices, loadMedicines, loadSuppliers]);

  /* ─── item calculations ─── */
  function updateItem(idx: number, field: string, value: any) {
    setItems(prev => {
      const next = [...prev];
      (next[idx] as any)[field] = value;
      const q = Number(next[idx].quantity) || 0;
      const p = Number(next[idx].unit_price) || 0;
      const d = Number(next[idx].discount) || 0;
      next[idx].total = Math.max(0, q * p - d);
      return next;
    });
  }

  function selectMedicine(rowIdx: number, med: MedOption) {
    setItems(prev => {
      const next = [...prev];
      next[rowIdx] = {
        ...next[rowIdx],
        medicine_id: med.id,
        medicine_name: med.name,
        batch_no: med.batch_no || "",
        expiry_date: med.expiry_date || "",
        unit_price: med.cost_price ?? med.price ?? 0,
        quantity: 1,
        discount: 0,
        total: med.cost_price ?? med.price ?? 0,
      };
      return next;
    });
    setMedSearch(null);
  }

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const taxAmount = 0; // invoices typically no tax on purchase
  const grandTotal = subtotal - 0 + taxAmount;

  /* ─── keyboard nav ─── */
  function handleKeyDown(e: React.KeyboardEvent, row: number, col: number) {
    const colKey = GRID_COLS[col];
    if (colKey === "total") return; // read-only

    let nextRow = row;
    let nextCol = col;

    if (e.key === "ArrowDown" || (e.key === "Enter" && !e.shiftKey)) {
      e.preventDefault();
      nextRow = Math.min(items.length - 1, row + 1);
      if (nextRow === row && e.key === "Enter") {
        setItems(prev => [...prev, emptyItem()]);
        nextRow = row + 1;
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      nextRow = Math.max(0, row - 1);
    } else if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      if (col < GRID_COLS.length - 2) nextCol = col + 1; // skip total
      else { nextRow = Math.min(items.length - 1, row + 1); nextCol = 0; }
    } else if (e.key === "Tab" && e.shiftKey) {
      e.preventDefault();
      if (col > 0) nextCol = col - 1;
      else { nextRow = Math.max(0, row - 1); nextCol = GRID_COLS.length - 2; }
    } else {
      return;
    }

    setActiveCell({ row: nextRow, col: nextCol });
    setTimeout(() => {
      const cell = gridRef.current?.querySelector(`[data-cell="${nextRow}-${nextCol}"]`) as HTMLInputElement;
      cell?.focus();
      cell?.select();
    }, 10);
  }

  /* ─── save invoice ─── */
  async function saveInvoice() {
    if (!hospitalId) return;
    if (!supplierName.trim()) { toast({ title: "Enter supplier name", variant: "destructive" }); return; }
    const validItems = items.filter(i => i.medicine_name.trim() && i.quantity > 0);
    if (validItems.length === 0) { toast({ title: "Add at least one item", variant: "destructive" }); return; }

    setSaving(true);
    try {
      const invNo = invoiceNo || genInvoiceNo();

      // 1. Create invoice
      const { data: inv, error: invErr } = await supabase.from("invoices").insert({
        invoice_no: invNo,
        supplier_name: supplierName,
        invoice_date: invoiceDate,
        subtotal,
        tax: taxAmount,
        total: grandTotal,
        notes,
        status: "received",
        hospital_id: hospitalId,
        created_by: staff?.id || null,
      }).select().single();

      if (invErr || !inv) throw invErr || new Error("Failed to create invoice");

      // 2. Create invoice items
      const itemRows = validItems.map(i => ({
        invoice_id: inv.id,
        medicine_id: i.medicine_id,
        medicine_name: i.medicine_name,
        batch_no: i.batch_no || null,
        expiry_date: i.expiry_date || null,
        quantity: i.quantity,
        unit_price: i.unit_price,
        discount: i.discount,
        total: i.total,
        hospital_id: hospitalId,
      }));
      await supabase.from("invoice_items").insert(itemRows);

      // 3. Atomically update stock for each medicine
      for (const item of validItems) {
        if (item.medicine_id) {
          const med = medicines.find(m => m.id === item.medicine_id);
          const currentStock = med?.stock ?? 0;
          await supabase.from("medicines").update({
            stock: currentStock + item.quantity,
            cost_price: item.unit_price,
            batch_no: item.batch_no || med?.batch_no,
            expiry_date: item.expiry_date || med?.expiry_date,
            supplier: supplierName,
            last_ordered_at: new Date().toISOString(),
          }).eq("id", item.medicine_id);
        }
      }

      // 4. Audit trail
      await supabase.from("activity_log").insert({
        action: "invoice_received",
        module: "pharmacy",
        details: `Invoice ${invNo} from ${supplierName}. ${validItems.length} items, total ${grandTotal.toLocaleString()}`,
        staff_id: staff?.id || null,
        hospital_id: hospitalId,
      });

      toast({ title: `Invoice ${invNo} saved & stock updated` });
      resetForm();
      loadInvoices();
      loadMedicines();
      setTab("list");
    } catch (err: any) {
      toast({ title: "Error saving invoice", description: err?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setSupplierName("");
    setInvoiceNo(genInvoiceNo());
    setInvoiceDate(new Date().toISOString().slice(0, 10));
    setNotes("");
    setItems([emptyItem()]);
    setActiveCell(null);
  }

  /* ─── view invoice detail ─── */
  async function openInvoice(inv: any) {
    setViewInvoice(inv);
    const { data } = await supabase.from("invoice_items").select("*").eq("invoice_id", inv.id);
    setViewItems(data || []);
  }

  /* ─── export ─── */
  function handleExport() {
    exportToCSV(invoices.map(i => ({
      "Invoice #": i.invoice_no, Supplier: i.supplier_name, Date: i.invoice_date,
      Subtotal: i.subtotal, Tax: i.tax, Total: i.total, Status: i.status,
    })), "invoices-export");
    toast({ title: "Exported" });
  }

  /* ─── print invoice ─── */
  function printInvoice(inv: any, items: any[]) {
    const win = window.open("", "", "width=800,height=600");
    if (!win) return;
    win.document.write(`<html><head><title>Invoice ${inv.invoice_no}</title>
      <style>
        body{font-family:system-ui,sans-serif;padding:32px;font-size:13px;color:#1a1a1a}
        h1{font-size:22px;font-weight:900;margin:0}
        .meta{display:flex;justify-content:space-between;margin:16px 0;padding:12px;background:#f4f4f5;border-radius:8px}
        .meta div{font-size:12px}
        .meta strong{font-size:14px;display:block}
        table{width:100%;border-collapse:collapse;margin-top:16px}
        th{background:#18181b;color:#fff;padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.5px}
        td{padding:8px 12px;border-bottom:1px solid #e5e5e5;font-size:12px}
        tr:nth-child(even){background:#fafafa}
        .totals{text-align:right;margin-top:20px}
        .totals div{font-size:13px;margin:4px 0}
        .totals .grand{font-size:18px;font-weight:900;border-top:2px solid #18181b;padding-top:8px;margin-top:8px}
      </style></head><body>
      <h1>PURCHASE INVOICE</h1>
      <div class="meta">
        <div><strong>${inv.invoice_no}</strong>Invoice Number</div>
        <div><strong>${inv.supplier_name}</strong>Supplier</div>
        <div><strong>${inv.invoice_date}</strong>Date</div>
        <div><strong>${inv.status?.toUpperCase()}</strong>Status</div>
      </div>
      <table>
        <thead><tr><th>#</th><th>Medicine</th><th>Batch</th><th>Expiry</th><th>Qty</th><th>Unit Price</th><th>Discount</th><th>Total</th></tr></thead>
        <tbody>${items.map((it: any, i: number) => `<tr>
          <td>${i + 1}</td><td><strong>${it.medicine_name}</strong></td><td>${it.batch_no || "—"}</td>
          <td>${it.expiry_date || "—"}</td><td>${it.quantity}</td>
          <td>${Number(it.unit_price).toLocaleString()}</td><td>${Number(it.discount || 0).toLocaleString()}</td>
          <td><strong>${Number(it.total).toLocaleString()}</strong></td></tr>`).join("")}
        </tbody>
      </table>
      <div class="totals">
        <div>Subtotal: KES ${Number(inv.subtotal).toLocaleString()}</div>
        <div class="grand">TOTAL: KES ${Number(inv.total).toLocaleString()}</div>
      </div>
      ${inv.notes ? `<p style="margin-top:24px;font-size:11px;color:#666">Notes: ${inv.notes}</p>` : ""}
    </body></html>`);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  }

  /* ─── filtered medicine search ─── */
  const filteredMeds = medSearch ? medicines.filter(m =>
    m.name.toLowerCase().includes(medSearch.q.toLowerCase())
  ).slice(0, 8) : [];

  /* ─── filtered invoices ─── */
  const filtered = invoices.filter(i => {
    const q = search.toLowerCase();
    return i.invoice_no?.toLowerCase().includes(q) || i.supplier_name?.toLowerCase().includes(q);
  });

  /* ─── RENDER ─── */
  return (
    <AppLayout title="Purchase Invoices">
      <Tabs value={tab} onValueChange={v => { setTab(v as any); if (v === "create" && !invoiceNo) setInvoiceNo(genInvoiceNo()); }}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="list" className="gap-1"><FileText className="h-3.5 w-3.5" />All Invoices</TabsTrigger>
            <TabsTrigger value="create" className="gap-1"><Plus className="h-3.5 w-3.5" />New Invoice</TabsTrigger>
          </TabsList>
          {tab === "list" && (
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoices..." className="pl-8 w-56 h-8 text-xs" />
              </div>
              <Button size="sm" variant="outline" onClick={handleExport}><Download className="h-3.5 w-3.5 mr-1" />Export</Button>
            </div>
          )}
        </div>

        {/* ═══ LIST TAB ═══ */}
        <TabsContent value="list">
          <Card>
            <CardContent className="p-0 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-semibold text-xs">Invoice #</th>
                    <th className="text-left p-3 font-semibold text-xs">Supplier</th>
                    <th className="text-left p-3 font-semibold text-xs">Date</th>
                    <th className="text-right p-3 font-semibold text-xs">Subtotal</th>
                    <th className="text-right p-3 font-semibold text-xs">Total</th>
                    <th className="text-center p-3 font-semibold text-xs">Status</th>
                    <th className="text-center p-3 font-semibold text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No invoices found. Create one to get started.</td></tr>
                  )}
                  {filtered.map(inv => (
                    <tr key={inv.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-bold text-xs">{inv.invoice_no}</td>
                      <td className="p-3 text-xs">{inv.supplier_name}</td>
                      <td className="p-3 text-xs text-muted-foreground">{inv.invoice_date}</td>
                      <td className="p-3 text-xs text-right">KES {Number(inv.subtotal || 0).toLocaleString()}</td>
                      <td className="p-3 text-xs text-right font-bold">KES {Number(inv.total || 0).toLocaleString()}</td>
                      <td className="p-3 text-center">
                        <Badge variant={inv.status === "received" ? "default" : "secondary"} className="text-[10px]">{inv.status}</Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Button size="sm" variant="ghost" onClick={() => openInvoice(inv)}><Eye className="h-3.5 w-3.5" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ CREATE TAB ═══ */}
        <TabsContent value="create">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Package className="h-5 w-5 text-primary" />New Purchase Invoice</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* HEADER */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg bg-muted/30 border">
                <div>
                  <Label className="text-xs font-semibold mb-1 block">Supplier *</Label>
                  <ComboInput
                    options={supplierOptions}
                    value={supplierName}
                    onChange={setSupplierName}
                    placeholder="Search or type supplier..."
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold mb-1 block">Invoice Number</Label>
                  <Input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} className="h-8 text-xs font-mono" />
                </div>
                <div>
                  <Label className="text-xs font-semibold mb-1 block">Date</Label>
                  <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="h-8 text-xs" />
                </div>
              </div>

              {/* EXCEL GRID */}
              <div className="border rounded-lg overflow-auto relative">
                <table ref={gridRef} className="w-full text-xs">
                  <thead>
                    <tr className="bg-foreground text-background">
                      <th className="p-2 text-left font-bold w-8">#</th>
                      <th className="p-2 text-left font-bold min-w-[200px]">Medicine *</th>
                      <th className="p-2 text-left font-bold w-28">Batch No</th>
                      <th className="p-2 text-left font-bold w-28">Expiry Date</th>
                      <th className="p-2 text-right font-bold w-20">Qty *</th>
                      <th className="p-2 text-right font-bold w-24">Unit Price</th>
                      <th className="p-2 text-right font-bold w-20">Discount</th>
                      <th className="p-2 text-right font-bold w-24">Total</th>
                      <th className="p-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, rowIdx) => (
                      <tr key={rowIdx} className={`border-b transition-colors ${activeCell?.row === rowIdx ? "bg-primary/5" : "hover:bg-muted/30"}`}>
                        <td className="p-1.5 text-muted-foreground font-mono">{rowIdx + 1}</td>

                        {/* Medicine name with search */}
                        <td className="p-1 relative">
                          <Input
                            data-cell={`${rowIdx}-0`}
                            value={item.medicine_name}
                            onChange={e => {
                              updateItem(rowIdx, "medicine_name", e.target.value);
                              setMedSearch({ row: rowIdx, q: e.target.value, open: true });
                            }}
                            onFocus={() => {
                              setActiveCell({ row: rowIdx, col: 0 });
                              if (item.medicine_name) setMedSearch({ row: rowIdx, q: item.medicine_name, open: true });
                            }}
                            onBlur={() => setTimeout(() => setMedSearch(null), 200)}
                            onKeyDown={e => handleKeyDown(e, rowIdx, 0)}
                            placeholder="Search medicine..."
                            className="h-7 text-xs border-0 bg-transparent focus:bg-background focus:border focus:ring-1 focus:ring-primary"
                          />
                          {/* Medicine dropdown */}
                          {medSearch?.row === rowIdx && medSearch.open && filteredMeds.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-0.5 bg-popover border rounded-md shadow-lg z-50 max-h-48 overflow-auto">
                              {filteredMeds.map(m => (
                                <button key={m.id} type="button"
                                  onMouseDown={(e) => { e.preventDefault(); selectMedicine(rowIdx, m); }}
                                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-primary/10 flex justify-between items-center gap-2 transition-colors">
                                  <span className="font-medium">{m.name}</span>
                                  <span className="text-muted-foreground text-[10px]">Stock: {m.stock ?? 0} | Cost: {(m.cost_price ?? m.price).toLocaleString()}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Batch */}
                        <td className="p-1">
                          <Input data-cell={`${rowIdx}-1`} value={item.batch_no} onChange={e => updateItem(rowIdx, "batch_no", e.target.value)}
                            onFocus={() => setActiveCell({ row: rowIdx, col: 1 })} onKeyDown={e => handleKeyDown(e, rowIdx, 1)}
                            className="h-7 text-xs border-0 bg-transparent focus:bg-background focus:border focus:ring-1 focus:ring-primary" />
                        </td>

                        {/* Expiry */}
                        <td className="p-1">
                          <Input data-cell={`${rowIdx}-2`} type="date" value={item.expiry_date} onChange={e => updateItem(rowIdx, "expiry_date", e.target.value)}
                            onFocus={() => setActiveCell({ row: rowIdx, col: 2 })} onKeyDown={e => handleKeyDown(e, rowIdx, 2)}
                            className="h-7 text-xs border-0 bg-transparent focus:bg-background focus:border focus:ring-1 focus:ring-primary" />
                        </td>

                        {/* Qty */}
                        <td className="p-1">
                          <Input data-cell={`${rowIdx}-3`} type="number" min={1} value={item.quantity}
                            onChange={e => updateItem(rowIdx, "quantity", parseInt(e.target.value) || 0)}
                            onFocus={() => setActiveCell({ row: rowIdx, col: 3 })} onKeyDown={e => handleKeyDown(e, rowIdx, 3)}
                            className="h-7 text-xs text-right border-0 bg-transparent focus:bg-background focus:border focus:ring-1 focus:ring-primary" />
                        </td>

                        {/* Unit Price */}
                        <td className="p-1">
                          <Input data-cell={`${rowIdx}-4`} type="number" min={0} value={item.unit_price}
                            onChange={e => updateItem(rowIdx, "unit_price", parseFloat(e.target.value) || 0)}
                            onFocus={() => setActiveCell({ row: rowIdx, col: 4 })} onKeyDown={e => handleKeyDown(e, rowIdx, 4)}
                            className="h-7 text-xs text-right border-0 bg-transparent focus:bg-background focus:border focus:ring-1 focus:ring-primary" />
                        </td>

                        {/* Discount */}
                        <td className="p-1">
                          <Input data-cell={`${rowIdx}-5`} type="number" min={0} value={item.discount}
                            onChange={e => updateItem(rowIdx, "discount", parseFloat(e.target.value) || 0)}
                            onFocus={() => setActiveCell({ row: rowIdx, col: 5 })} onKeyDown={e => handleKeyDown(e, rowIdx, 5)}
                            className="h-7 text-xs text-right border-0 bg-transparent focus:bg-background focus:border focus:ring-1 focus:ring-primary" />
                        </td>

                        {/* Total (read-only) */}
                        <td className="p-2 text-right font-bold tabular-nums">{item.total.toLocaleString()}</td>

                        {/* Delete */}
                        <td className="p-1">
                          {items.length > 1 && (
                            <button onClick={() => setItems(items.filter((_, i) => i !== rowIdx))} className="p-1 rounded hover:bg-destructive/10">
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Add row */}
                <div className="p-2 border-t bg-muted/20">
                  <Button size="sm" variant="ghost" onClick={() => setItems([...items, emptyItem()])} className="text-xs gap-1">
                    <Plus className="h-3 w-3" /> Add Row
                  </Button>
                  <span className="text-[10px] text-muted-foreground ml-2">Tip: Press Enter on last row to auto-add</span>
                </div>
              </div>

              {/* TOTALS + NOTES */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Label className="text-xs font-semibold mb-1 block">Notes</Label>
                  <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes..." className="h-8 text-xs" />
                </div>
                <div className="w-64 space-y-1 text-sm bg-muted/30 p-4 rounded-lg border">
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">Items</span><span className="font-medium">{items.filter(i => i.medicine_name).length}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">Total Qty</span><span className="font-medium">{items.reduce((s, i) => s + i.quantity, 0)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">KES {subtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between font-black text-base border-t border-foreground/20 pt-2 mt-2">
                    <span>TOTAL</span><span>KES {grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* SAVE */}
              <Button onClick={saveInvoice} disabled={saving} className="w-full gap-2 h-10 font-bold text-sm">
                <Save className="h-4 w-4" />{saving ? "Saving..." : "Save Invoice & Update Stock"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ═══ VIEW INVOICE MODAL ═══ */}
      <Dialog open={!!viewInvoice} onOpenChange={() => setViewInvoice(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />Invoice {viewInvoice?.invoice_no}
            </DialogTitle>
          </DialogHeader>
          {viewInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-muted/40 p-3 rounded-lg"><span className="text-muted-foreground block">Supplier</span><span className="font-bold">{viewInvoice.supplier_name}</span></div>
                <div className="bg-muted/40 p-3 rounded-lg"><span className="text-muted-foreground block">Date</span><span className="font-bold">{viewInvoice.invoice_date}</span></div>
                <div className="bg-muted/40 p-3 rounded-lg"><span className="text-muted-foreground block">Status</span><Badge variant="default" className="text-[10px] mt-1">{viewInvoice.status}</Badge></div>
                <div className="bg-muted/40 p-3 rounded-lg"><span className="text-muted-foreground block">Total</span><span className="font-black text-base">KES {Number(viewInvoice.total || 0).toLocaleString()}</span></div>
              </div>

              <table className="w-full text-xs border">
                <thead>
                  <tr className="bg-foreground text-background">
                    <th className="p-2 text-left">#</th>
                    <th className="p-2 text-left">Medicine</th>
                    <th className="p-2 text-left">Batch</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Unit Price</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {viewItems.map((it, i) => (
                    <tr key={it.id} className="border-b">
                      <td className="p-2">{i + 1}</td>
                      <td className="p-2 font-medium">{it.medicine_name}</td>
                      <td className="p-2 text-muted-foreground">{it.batch_no || "—"}</td>
                      <td className="p-2 text-right">{it.quantity}</td>
                      <td className="p-2 text-right">{Number(it.unit_price).toLocaleString()}</td>
                      <td className="p-2 text-right font-bold">{Number(it.total).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => printInvoice(viewInvoice, viewItems)} className="gap-1">
                  <Printer className="h-3.5 w-3.5" />Print
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
                  exportToCSV(viewItems.map((it: any, i: number) => ({
                    "#": i + 1, Medicine: it.medicine_name, Batch: it.batch_no, Qty: it.quantity,
                    "Unit Price": it.unit_price, Discount: it.discount, Total: it.total,
                  })), `invoice-${viewInvoice.invoice_no}`);
                  toast({ title: "Exported" });
                }} className="gap-1">
                  <Download className="h-3.5 w-3.5" />CSV
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
