import { useState, useRef, useEffect, useCallback } from "react";
import { type Medicine } from "@/data/medicines";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { Search, ChevronDown } from "lucide-react";

interface Props {
  onAdd: (medicine: Medicine) => void;
}

export function POSSearchBar({ onAdd, hospitalId }: Props & { hospitalId?: string | null }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const [results, setResults] = useState<Medicine[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHighlightIdx(0);
    if (query.length < 1) { setResults([]); return; }
    const timeout = setTimeout(async () => {
      const q = `%${query}%`;
      let qb = supabase.from("medicines").select("*")
        .or(`name.ilike.${q},generic_name.ilike.${q},brand.ilike.${q},barcode.ilike.${q}`)
        .eq("is_active", true);
      if (hospitalId) qb = qb.eq("hospital_id", hospitalId);
      const { data } = await qb.limit(12);
      if (data) {
        setResults(data.map(m => ({
          id: m.id, name: m.name, genericName: m.generic_name || "", brand: m.brand || "",
          category: m.category || "", price: m.price, costPrice: m.cost_price || 0,
          stock: m.stock || 0, batchNo: m.batch_no || "", expiryDate: m.expiry_date || "",
          requiresPrescription: m.requires_prescription || false, unit: m.unit || "tablet",
          reorderLevel: m.reorder_level || 10, supplier: m.supplier || "",
          barcode: m.barcode || "", shelfLocation: m.shelf_location || "",
        })));
      }
    }, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  const selectItem = useCallback((med: Medicine) => {
    if (med.stock > 0) {
      onAdd(med);
      setQuery("");
      setIsOpen(false);
      inputRef.current?.focus();
    }
  }, [onAdd]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlightIdx(prev => Math.min(prev + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlightIdx(prev => Math.max(prev - 1, 0)); }
    else if (e.key === "Enter" && results.length > 0) { e.preventDefault(); selectItem(results[highlightIdx]); }
    else if (e.key === "Escape") { setIsOpen(false); setQuery(""); }
  };

  return (
    <div className="relative flex-1">
      <div className="flex items-center border-2 border-border rounded-lg bg-card focus-within:border-primary transition-colors">
        <Search className="h-4 w-4 ml-3 text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder="Scan barcode or search medicine..."
          className="flex-1 bg-transparent text-sm outline-none py-2.5 px-3 placeholder:text-muted-foreground"
          autoComplete="off"
        />
        <button className="px-2 py-1 mr-1">
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {isOpen && results.length > 0 && (
        <div ref={dropdownRef} className="pos-search-dropdown">
          <div className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold flex justify-between">
            <span>Search Results</span>
            <span>{results.length} found</span>
          </div>
          {results.map((med, i) => (
            <button
              key={med.id}
              onMouseDown={(e) => { e.preventDefault(); selectItem(med); }}
              className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between border-b hover:bg-primary/5 ${
                i === highlightIdx ? "bg-primary/10" : ""
              } ${med.stock === 0 ? "opacity-40" : ""}`}
            >
              <div className="flex-1">
                <span className="font-medium">{med.name}</span>
                <span className="text-xs text-muted-foreground ml-2">{med.genericName}</span>
                {med.requiresPrescription && <span className="ml-1 text-[10px] text-destructive font-bold">Rx</span>}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Stock: {med.stock}</span>
                <span>{med.unit}</span>
                <span className="font-semibold text-foreground w-20 text-right">
                  KES {med.price.toLocaleString()}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
