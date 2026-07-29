import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePharmacy } from "@/contexts/PharmacyStore";
import { parseCSV } from "@/utils/exportUtils";
import { toast } from "@/hooks/use-toast";
import { Upload, AlertTriangle, CheckCircle, FileText } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CSVImportModal({ open, onClose }: Props) {
  const { addMedicine } = usePharmacy();
  const fileRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<Record<string, string>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const requiredFields = ["name", "genericName", "price", "stock"];
  const allFields = ["name", "genericName", "brand", "category", "price", "costPrice", "stock", "batchNo", "expiryDate", "unit", "reorderLevel", "barcode", "shelfLocation"];

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        setErrors(["File is empty or invalid"]);
        return;
      }
      setData(parsed);
      setColumns(Object.keys(parsed[0]));
      // Auto-map matching columns
      const autoMap: Record<string, string> = {};
      Object.keys(parsed[0]).forEach(col => {
        const lower = col.toLowerCase().replace(/[^a-z]/g, "");
        const match = allFields.find(f => f.toLowerCase() === lower);
        if (match) autoMap[match] = col;
      });
      setMapping(autoMap);
      setErrors([]);
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    const missing = requiredFields.filter(f => !mapping[f]);
    if (missing.length > 0) {
      setErrors(missing.map(f => `Required field "${f}" is not mapped`));
      return;
    }

    const errs: string[] = [];
    let imported = 0;
    data.forEach((row, idx) => {
      const name = row[mapping.name]?.trim();
      const price = parseFloat(row[mapping.price]);
      if (!name) { errs.push(`Row ${idx + 2}: Missing name`); return; }
      if (isNaN(price) || price <= 0) { errs.push(`Row ${idx + 2}: Invalid price`); return; }

      addMedicine({
        name,
        genericName: row[mapping.genericName]?.trim() || name,
        brand: row[mapping.brand]?.trim() || "",
        category: row[mapping.category]?.trim() || "Other",
        price,
        costPrice: parseFloat(row[mapping.costPrice]) || 0,
        stock: parseInt(row[mapping.stock]) || 0,
        batchNo: row[mapping.batchNo]?.trim() || "",
        expiryDate: row[mapping.expiryDate]?.trim() || "",
        requiresPrescription: false,
        unit: row[mapping.unit]?.trim() || "tablet",
        reorderLevel: parseInt(row[mapping.reorderLevel]) || 20,
        barcode: row[mapping.barcode]?.trim(),
        shelfLocation: row[mapping.shelfLocation]?.trim(),
      });
      imported++;
    });

    if (errs.length > 0) setErrors(errs);
    toast({ title: "Import Complete", description: `${imported} medicines imported${errs.length > 0 ? `, ${errs.length} errors` : ""}.` });
    if (errs.length === 0) { setData([]); onClose(); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" /> Import Medicines from CSV
          </DialogTitle>
        </DialogHeader>

        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
            <FileText className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium mb-1">Upload CSV File</p>
            <p className="text-xs text-muted-foreground mb-4">File should have headers matching medicine fields</p>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
            <Button onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4 mr-1" /> Choose File
            </Button>
            <p className="text-[10px] text-muted-foreground mt-4">Required: name, genericName, price, stock</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-success" />
              <span>{data.length} rows found · {columns.length} columns</span>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold">Column Mapping</p>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-auto">
                {allFields.map(field => (
                  <div key={field} className="flex items-center gap-2">
                    <span className="text-xs w-24 shrink-0">
                      {field} {requiredFields.includes(field) && <span className="text-destructive">*</span>}
                    </span>
                    <select value={mapping[field] || ""} onChange={e => setMapping(m => ({ ...m, [field]: e.target.value }))}
                      className="flex-1 h-8 rounded border bg-background px-2 text-xs">
                      <option value="">— skip —</option>
                      {columns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {mapping[field] && <Badge variant="secondary" className="text-[9px]">✓</Badge>}
                  </div>
                ))}
              </div>
            </div>

            <div className="border rounded overflow-auto max-h-32">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="bg-muted/50">{columns.map(c => <th key={c} className="p-1.5 text-left">{c}</th>)}</tr>
                </thead>
                <tbody>
                  {data.slice(0, 3).map((row, i) => (
                    <tr key={i} className="border-t">{columns.map(c => <td key={c} className="p-1.5">{row[c]}</td>)}</tr>
                  ))}
                </tbody>
              </table>
              {data.length > 3 && <p className="text-[10px] text-muted-foreground p-1.5">...and {data.length - 3} more rows</p>}
            </div>

            {errors.length > 0 && (
              <div className="p-2 rounded bg-destructive/10 border border-destructive/30 max-h-24 overflow-auto">
                {errors.map((e, i) => (
                  <div key={i} className="flex items-center gap-1 text-xs text-destructive">
                    <AlertTriangle className="h-3 w-3 shrink-0" /> {e}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setData([]); setErrors([]); }}>Reset</Button>
              <Button onClick={handleImport}>Import {data.length} Medicines</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
