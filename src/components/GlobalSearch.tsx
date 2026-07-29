import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, User, Pill, FileText, X } from "lucide-react";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useHospital } from "@/contexts/HospitalContext";

interface SearchResult {
  id: string;
  type: "patient" | "medicine" | "receipt";
  label: string;
  sub: string;
  route: string;
}

export function GlobalSearch() {
  const { hospitalId } = useHospital();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!query.trim() || !hospitalId) { setResults([]); return; }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      const q = query.trim().toLowerCase();
      const items: SearchResult[] = [];

      // Search patients
      const { data: patients } = await supabase
        .from("patients")
        .select("id, first_name, last_name, patient_no, phone")
        .eq("hospital_id", hospitalId)
        .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,patient_no.ilike.%${q}%,phone.ilike.%${q}%,id_number.ilike.%${q}%`)
        .limit(5);
      (patients || []).forEach(p => items.push({
        id: p.id, type: "patient",
        label: `${p.first_name} ${p.last_name}`,
        sub: `${p.patient_no} · ${p.phone || "No phone"}`,
        route: "/patients",
      }));

      // Search medicines
      const { data: meds } = await supabase
        .from("medicines")
        .select("id, name, generic_name, stock, price")
        .eq("hospital_id", hospitalId)
        .or(`name.ilike.%${q}%,generic_name.ilike.%${q}%,barcode.ilike.%${q}%`)
        .limit(5);
      (meds || []).forEach(m => items.push({
        id: m.id, type: "medicine",
        label: m.name,
        sub: `${m.generic_name || ""} · Stock: ${m.stock} · KES ${m.price}`,
        route: "/pos",
      }));

      // Search receipts
      const { data: sales } = await supabase
        .from("pharmacy_sales")
        .select("id, receipt_no, customer_name, total, created_at")
        .eq("hospital_id", hospitalId)
        .or(`receipt_no.ilike.%${q}%,customer_name.ilike.%${q}%`)
        .limit(5);
      (sales || []).forEach(s => items.push({
        id: s.id, type: "receipt",
        label: s.receipt_no,
        sub: `${s.customer_name || "Walk-in"} · KES ${s.total}`,
        route: "/sales-history",
      }));

      setResults(items);
      setLoading(false);
    }, 300);
  }, [query, hospitalId]);

  const iconMap = { patient: User, medicine: Pill, receipt: FileText };
  const colorMap = { patient: "text-primary", medicine: "text-emerald-600", receipt: "text-amber-600" };

  return (
    <div ref={ref} className="relative hidden md:block">
      <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        <input
          placeholder="Quick Find Patient, Medicine, Receipt..."
          className="bg-transparent text-xs outline-none w-52 placeholder:text-muted-foreground"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => query && setOpen(true)}
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults([]); setOpen(false); }}>
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
      </div>
      {open && query.trim() && (
        <div className="absolute top-full mt-1 left-0 right-0 w-80 bg-popover border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {loading ? (
            <p className="p-3 text-xs text-muted-foreground text-center">Searching...</p>
          ) : results.length === 0 ? (
            <p className="p-3 text-xs text-muted-foreground text-center">No results for "{query}"</p>
          ) : (
            results.map(r => {
              const Icon = iconMap[r.type];
              return (
                <button
                  key={`${r.type}-${r.id}`}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted text-left transition-colors"
                  onClick={() => { navigate(r.route); setOpen(false); setQuery(""); }}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${colorMap[r.type]}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{r.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{r.sub}</p>
                  </div>
                  <span className="ml-auto text-[9px] uppercase text-muted-foreground">{r.type}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
