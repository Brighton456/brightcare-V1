import { useState, useEffect } from "react";
import { safeSupabase as supabase } from "@/lib/safeSupabase";

interface DropdownOption {
  id: string;
  label: string;
  value: string;
  sort_order: number;
}

const cache = new Map<string, DropdownOption[]>();

export function useDropdownOptions(category: string) {
  const [options, setOptions] = useState<DropdownOption[]>(cache.get(category) || []);
  const [loading, setLoading] = useState(!cache.has(category));

  useEffect(() => {
    if (cache.has(category)) {
      setOptions(cache.get(category)!);
      setLoading(false);
      return;
    }
    const fetch = async () => {
      const { data } = await supabase
        .from("dropdown_options")
        .select("id, label, value, sort_order")
        .eq("category", category)
        .eq("is_active", true)
        .order("sort_order");
      const opts = (data || []) as DropdownOption[];
      cache.set(category, opts);
      setOptions(opts);
      setLoading(false);
    };
    fetch();
  }, [category]);

  return { options, loading };
}

export function clearDropdownCache(category?: string) {
  if (category) cache.delete(category);
  else cache.clear();
}
