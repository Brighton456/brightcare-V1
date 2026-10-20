import { useState, useEffect, useCallback, useMemo } from "react";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useAuth } from "@/contexts/AuthContext";

interface ModuleSettingsState {
  modules: Record<string, boolean>;
  loading: boolean;
  /** Check if a module is enabled (by module_key or route path) */
  isEnabled: (keyOrPath: string) => boolean;
  /** Set a module's enabled state (creates or updates the module_settings row) */
  setModule: (moduleKey: string, enabled: boolean) => Promise<void>;
  refresh: () => Promise<void>;
}

/** Map route paths to module_keys */
function routeToModuleKey(path: string): string {
  // Strip leading slash and convert hyphens to underscores
  return path.replace(/^\//, "").replace(/-/g, "_");
}

export function useModuleSettings(): ModuleSettingsState {
  const { staff } = useAuth();
  const [modules, setModules] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const query = supabase.from("module_settings").select("module_key, is_enabled");
      if (staff?.hospital_id) {
        query.eq("hospital_id", staff.hospital_id);
      }
      const { data } = await query;
      const map: Record<string, boolean> = {};
      (data || []).forEach((row: any) => {
        map[row.module_key] = row.is_enabled;
      });
      setModules(map);
    } catch (err) {
      console.error("Failed to fetch module settings:", err);
    } finally {
      setLoading(false);
    }
  }, [staff?.hospital_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const isEnabled = useCallback(
    (keyOrPath: string): boolean => {
      // Platform/super admins always see everything
      if (staff?.role === "platform_admin" || staff?.role === "super_admin") return true;
      // Dashboard, login, settings are always accessible
      if (keyOrPath === "/" || keyOrPath === "/login" || keyOrPath === "/settings" || keyOrPath === "/admin") return true;

      const key = keyOrPath.startsWith("/") ? routeToModuleKey(keyOrPath) : keyOrPath;
      // If no entry exists for this module, default to enabled
      if (!(key in modules)) return true;
      return modules[key] === true;
    },
    [modules, staff?.role]
  );

  const setModule = useCallback(
    async (moduleKey: string, enabled: boolean) => {
      if (!staff?.hospital_id) return;
      await supabase.from("module_settings").upsert(
        { module_key: moduleKey, is_enabled: enabled, hospital_id: staff.hospital_id },
        { onConflict: "module_key,hospital_id" }
      );
      // Optimistically update local state
      setModules((prev) => ({ ...prev, [moduleKey]: enabled }));
    },
    [staff?.hospital_id]
  );

  return useMemo(
    () => ({ modules, loading, isEnabled, setModule, refresh: fetch }),
    [modules, loading, isEnabled, setModule, fetch]
  );
}
