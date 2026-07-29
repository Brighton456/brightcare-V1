import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { ChevronDown } from "lucide-react";

interface Option {
  label: string;
  value: string;
}

interface Props {
  options: Option[];
  value: string;
  onChange: (v: string, option?: Option) => void;
  placeholder?: string;
  className?: string;
}

/** A combo-box that supports both dropdown selection AND free-text typing */
export function ComboInput({ options, value, onChange, placeholder = "Select or type...", className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter(o => 
    o.label.toLowerCase().includes((filter || value).toLowerCase())
  );

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div className="flex">
        <Input
          value={value}
          onChange={e => { onChange(e.target.value, undefined); setFilter(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="pr-8 h-8 text-xs"
        />
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
        >
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 max-h-40 overflow-auto">
          {filtered.map(o => (
            <button key={o.value} type="button"
              onClick={() => { onChange(o.label, o); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors">
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
