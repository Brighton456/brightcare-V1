import { useState, useEffect, useRef, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { exportToCSV } from "@/utils/exportUtils";
import { useHospital } from "@/contexts/HospitalContext";
import { useFacility } from "@/hooks/useFacility";
import { Search, Download, Package } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";

interface MedRow {
  id: string; name: string; generic_name: string | null; brand: string | null;
  stock: number | null; reorder_level: number | null; price: number;
  cost_price: number | null; batch_no: string | null; expiry_date: string | null;
  shelf_location: string | null; unit: string | null;
}

type EditableField = "stock" | "price" | "cost_price" | "reorder_level" | "batch_no" | "expiry_date" | "shelf_location";

const EDITABLE_COLS: { key: EditableField; label: string; type: "number" | "text" | "date"; align: string }[] = [
  { key: "stock", label: "Stock", type: "number", align: "text-right" },
  { key: "price", label: "Price", type: "number", align: "text-right" },
  { key: "cost_price", label: "Cost", type: "number", align: "text-right" },
  { key: "reorder_level", label: "Reorder", type: "number", align: "text-right" },
  { key: "batch_no", label: "Batch", type: "text", align: "text-left" },
  { key: "expiry_date", label: "Expiry", type: "date", align: "text-left" },
  { key: "shelf_location", label: "Shelf", type: "text", align: "text-left" },
];

export default function Inventory() {
  const { hospitalId } = useHospital();
  const { facilityType } = useFacility();
  const isHerbal = facilityType === "herbal";
  const isAdmin = useIsAdmin();
  const [medicines, setMedicines] = useState<MedRow[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "stock" | "expiry" | "value">("name");
  const [loading, setLoading] = useState(true);
  const [editCell, setEditCell] = useState<{ rowId: string; field: EditableField } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const navigatingRef = useRef(false);
  const editCellRef = useRef(editCell);
  const editValueRef = useRef(editValue);

  // Keep refs in sync
  useEffect(() => { editCellRef.current = editCell; }, [editCell]);
  useEffect(() => { editValueRef.current = editValue; }, [editValue]);

  const fetchMedicines = async () => {
    const { data } = await supabase.from("medicines").select("id,name,generic_name,brand,stock,reorder_level,price,cost_price,batch_no,expiry_date,shelf_location,unit").eq("hospital_id", hospitalId).eq("is_active", true).order("name");
    if (data) setMedicines(data as unknown as MedRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchMedicines(); }, [hospitalId]);

  const sorted = [...medicines]
    .filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || (m.generic_name || "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "stock") return (a.stock || 0) - (b.stock || 0);
      if (sortBy === "expiry") return new Date(a.expiry_date || "2099-01-01").getTime() - new Date(b.expiry_date || "2099-01-01").getTime();
      if (sortBy === "value") return ((b.price) * (b.stock || 0)) - ((a.price) * (a.stock || 0));
      return a.name.localeCompare(b.name);
    });

  const totalValue = medicines.reduce((s, m) => s + m.price * (m.stock || 0), 0);
  const totalCostValue = medicines.reduce((s, m) => s + (m.cost_price || 0) * (m.stock || 0), 0);
  const belowReorder = medicines.filter(m => (m.stock || 0) <= (m.reorder_level || 10)).length;

  const commitEdit = async (rowId: string, field: EditableField, value: string) => {
    const col = EDITABLE_COLS.find(c => c.key === field)!;
    let dbValue: any = value;
    if (col.type === "number") dbValue = parseFloat(value) || 0;
    if (value === "" && col.type !== "number") dbValue = null;

    setSaving(rowId);
    const { error } = await supabase.from("medicines").update({ [field]: dbValue } as any).eq("id", rowId);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      setMedicines(prev => prev.map(m => m.id === rowId ? { ...m, [field]: dbValue } : m));
    }
    setSaving(null);
  };

  const startEdit = (rowId: string, field: EditableField) => {
    const med = medicines.find(m => m.id === rowId);
    if (!med) return;
    const val = med[field];
    setEditCell({ rowId, field });
    setEditValue(val != null ? String(val) : "");
  };

  // Focus input whenever editCell changes
  const inputCallbackRef = useCallback((node: HTMLInputElement | null) => {
    if (node) {
      node.focus();
      node.select();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const cell = editCellRef.current;
    if (!cell) return;
    const { rowId, field } = cell;
    const currentValue = editValueRef.current;
    const rowIdx = sorted.findIndex(m => m.id === rowId);
    const colIdx = EDITABLE_COLS.findIndex(c => c.key === field);

    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      navigatingRef.current = true;
      commitEdit(rowId, field, currentValue);
      // Move to next cell
      const nextCol = e.shiftKey ? colIdx - 1 : colIdx + 1;
      if (nextCol >= 0 && nextCol < EDITABLE_COLS.length) {
        startEdit(rowId, EDITABLE_COLS[nextCol].key);
      } else if (!e.shiftKey && rowIdx + 1 < sorted.length) {
        startEdit(sorted[rowIdx + 1].id, EDITABLE_COLS[0].key);
      } else {
        setEditCell(null);
      }
      setTimeout(() => { navigatingRef.current = false; }, 50);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      navigatingRef.current = true;
      commitEdit(rowId, field, currentValue);
      if (rowIdx + 1 < sorted.length) {
        startEdit(sorted[rowIdx + 1].id, field);
      } else {
        setEditCell(null);
      }
      setTimeout(() => { navigatingRef.current = false; }, 50);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      navigatingRef.current = true;
      commitEdit(rowId, field, currentValue);
      if (rowIdx - 1 >= 0) {
        startEdit(sorted[rowIdx - 1].id, field);
      } else {
        setEditCell(null);
      }
      setTimeout(() => { navigatingRef.current = false; }, 50);
    } else if (e.key === "Escape") {
      navigatingRef.current = true;
      setEditCell(null);
      setTimeout(() => { navigatingRef.current = false; }, 50);
    }
  };

  const handleBlur = () => {
    // Skip if we're navigating via keyboard (Tab/Enter/Arrow)
    if (navigatingRef.current) return;
    const cell = editCellRef.current;
    if (!cell) return;
    commitEdit(cell.rowId, cell.field, editValueRef.current);
    setEditCell(null);
  };

  const handleExport = () => {
    exportToCSV(sorted.map(m => ({
      Name: m.name, Generic: m.generic_name, Brand: m.brand, Stock: m.stock,
      Reorder: m.reorder_level, Price: m.price, Cost: m.cost_price,
      Value: m.price * (m.stock || 0), Batch: m.batch_no, Expiry: m.expiry_date,
    })), "brightech-inventory");
    toast({ title: "Exported" });
  };

  const renderCell = (med: MedRow, col: typeof EDITABLE_COLS[0]) => {
    const isEditing = editCell?.rowId === med.id && editCell?.field === col.key;
    const val = med[col.key];
    const isSaving = saving === med.id;

    if (isEditing) {
      return (
        <input
          ref={inputCallbackRef}
          type={col.type}
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`w-full bg-primary/5 border border-primary rounded px-1.5 py-0.5 text-sm outline-none focus:ring-1 focus:ring-primary ${col.align}`}
          style={{ minWidth: col.type === "date" ? 120 : 60 }}
        />
      );
    }

    const displayVal = val != null ? (col.type === "number" ? Number(val).toLocaleString() : String(val)) : "—";
    const isLow = col.key === "stock" && (med.stock || 0) <= (med.reorder_level || 10);

    return (
      <span
        onClick={() => startEdit(med.id, col.key)}
        className={`cursor-pointer hover:bg-primary/10 rounded px-1.5 py-0.5 inline-block min-w-[2rem] transition-colors ${isLow ? "text-destructive font-bold" : ""} ${isSaving ? "opacity-50" : ""}`}
        title="Click to edit"
      >
        {displayVal}
      </span>
    );
  };

  return (
    <AppLayout title={isHerbal ? "Herbal Stock Control" : "Inventory Management"}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Items</p><p className="text-2xl font-bold">{medicines.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Units</p><p className="text-2xl font-bold">{medicines.reduce((s, m) => s + (m.stock || 0), 0).toLocaleString()}</p></CardContent></Card>
          {isAdmin && <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Retail Value</p><p className="text-2xl font-bold">KES {totalValue.toLocaleString()}</p></CardContent></Card>}
          {isAdmin && <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Cost Value</p><p className="text-2xl font-bold">KES {totalCostValue.toLocaleString()}</p></CardContent></Card>}
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Below Reorder</p><p className="text-2xl font-bold text-destructive">{belowReorder}</p></CardContent></Card>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search inventory..." className="pl-9" />
          </div>
          <div className="flex gap-1.5">
            {(["name", "stock", "expiry", "value"] as const).map(s => (
              <Button key={s} size="sm" variant={sortBy === s ? "default" : "outline"} onClick={() => setSortBy(s)} className="text-xs capitalize">{s}</Button>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={handleExport}><Download className="h-4 w-4 mr-1" />Export</Button>
        </div>

        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="bg-muted/50 px-3 py-2 border-b flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" />
              Click any cell to edit · Tab/Enter → next · Arrow ↑↓ · Esc cancel
            </p>
            <Badge variant="outline" className="text-[10px]">{sorted.length} items</Badge>
          </div>
          <div className="overflow-auto max-h-[calc(100vh-20rem)]">
            {loading ? <div className="p-8 text-center text-muted-foreground text-sm">Loading inventory...</div> : (
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b bg-muted/80 backdrop-blur-sm">
                    <th className="text-left p-2 pl-3 font-medium text-xs w-[200px]">{isHerbal ? "Herbal Product" : "Medicine"}</th>
                    {EDITABLE_COLS.map(col => (
                      <th key={col.key} className={`p-2 font-medium text-xs ${col.align}`}>{col.label}</th>
                    ))}
                    <th className="text-right p-2 pr-3 font-medium text-xs">Value</th>
                    <th className="text-center p-2 font-medium text-xs">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((m) => {
                    const isLow = (m.stock || 0) <= (m.reorder_level || 10);
                    const isExpiring = m.expiry_date && new Date(m.expiry_date) <= new Date(new Date().setMonth(new Date().getMonth() + 3));
                    const isActiveRow = editCell?.rowId === m.id;
                    return (
                      <tr key={m.id} className={`border-b transition-colors ${isActiveRow ? "bg-primary/5 ring-1 ring-inset ring-primary/20" : "hover:bg-muted/30"}`}>
                        <td className="p-2 pl-3">
                          <p className="font-medium text-xs truncate max-w-[180px]">{m.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{m.generic_name} · {m.brand}</p>
                        </td>
                        {EDITABLE_COLS.map(col => (
                          <td key={col.key} className={`p-1.5 ${col.align}`}>
                            {renderCell(m, col)}
                          </td>
                        ))}
                        <td className="p-2 pr-3 text-right font-medium text-xs">
                          {(m.price * (m.stock || 0)).toLocaleString()}
                        </td>
                        <td className="p-2 text-center">
                          {isLow && <Badge variant="destructive" className="text-[10px]">Low</Badge>}
                          {isExpiring && <Badge className="text-[10px] bg-warning text-warning-foreground ml-0.5">Exp</Badge>}
                          {!isLow && !isExpiring && <Badge variant="secondary" className="text-[10px]">OK</Badge>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
