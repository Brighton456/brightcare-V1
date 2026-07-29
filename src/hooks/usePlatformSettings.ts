import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PlatformSettings {
  support_email: string;
  support_phone: string;
  support_phone_2: string;
  whatsapp_number: string;
  emergency_phone: string;
  website_url: string;
  office_address: string;
  working_hours: string;
}

const DEFAULTS: PlatformSettings = {
  support_email: "support@brightcare.co.ke",
  support_phone: "+254 720363215",
  support_phone_2: "+254 742758711",
  whatsapp_number: "+254 720363215",
  emergency_phone: "+254 742758711",
  website_url: "https://brightcare.co.ke",
  office_address: "Nairobi, Kenya",
  working_hours: "Mon-Fri, 8:00 AM - 6:00 PM EAT",
};

let cachedSettings: PlatformSettings | null = null;

export function usePlatformSettings() {
  const [settings, setSettings] = useState<PlatformSettings>(cachedSettings || DEFAULTS);
  const [loading, setLoading] = useState(!cachedSettings);

  useEffect(() => {
    if (cachedSettings) return;
    (async () => {
      try {
        const { data } = await supabase.from("platform_settings" as any).select("key, value");
        if (data && Array.isArray(data)) {
          const map: Record<string, string> = {};
          (data as any[]).forEach((r: any) => { map[r.key] = r.value; });
          const merged = { ...DEFAULTS, ...map } as PlatformSettings;
          cachedSettings = merged;
          setSettings(merged);
        }
      } catch {
        // use defaults
      }
      setLoading(false);
    })();
  }, []);

  return { settings, loading };
}

export async function savePlatformSettings(settings: Partial<PlatformSettings>) {
  const entries = Object.entries(settings);
  for (const [key, value] of entries) {
    await supabase.from("platform_settings" as any).upsert({ key, value, updated_at: new Date().toISOString() } as any, { onConflict: "key" });
  }
  cachedSettings = null; // bust cache
}
