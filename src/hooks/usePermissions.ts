import { useState, useEffect, useCallback, useMemo } from "react";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useAuth } from "@/contexts/AuthContext";
import { resolvePermissionValue } from "@/lib/permissionResolver";

interface PermissionsState {
  permissions: Record<string, boolean>;
  loading: boolean;
  /** Check if current staff has a specific permission */
  can: (featureKey: string) => boolean;
  /** Check multiple — returns true only if ALL are granted */
  canAll: (...keys: string[]) => boolean;
  /** Check multiple — returns true if ANY is granted */
  canAny: (...keys: string[]) => boolean;
  /** Refresh permissions from server */
  refresh: () => Promise<void>;
}

export function usePermissions(): PermissionsState {
  const { staff } = useAuth();
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const role = staff?.role ?? "";
  const hospitalId = staff?.hospital_id ?? null;

  const fetchPermissions = useCallback(async () => {
    if (!role) {
      setPermissions({});
      setLoading(false);
      return;
    }

    // super_admin always has everything
    if (role === "super_admin" || role === "platform_admin" || role === "hospital_admin" || role === "admin") {
      setPermissions(new Proxy({}, { get: () => true }) as any);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("feature_key, is_enabled, hospital_id")
        .eq("role_name", role);

      if (error) {
        console.error("Failed to fetch permissions:", error.message);
        setPermissions({});
      } else {
        const map: Record<string, boolean> = {};
        const scopedRows = [
          ...(data || []).filter((row: any) => !row.hospital_id),
          ...(data || []).filter((row: any) => row.hospital_id === hospitalId),
        ];
        scopedRows.forEach((row: any) => {
          map[row.feature_key] = row.is_enabled;
        });
        setPermissions(map);
      }
    } catch (err) {
      console.error("Permission fetch error:", err);
      setPermissions({});
    } finally {
      setLoading(false);
    }
  }, [role, hospitalId]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const can = useCallback(
    (key: string): boolean => {
      if (!role) return false;
      if (role === "super_admin" || role === "hospital_admin" || role === "platform_admin" || role === "admin") return true;
      return resolvePermissionValue(key, permissions) === true;
    },
    [role, permissions]
  );

  const canAll = useCallback(
    (...keys: string[]) => keys.every((k) => can(k)),
    [can]
  );

  const canAny = useCallback(
    (...keys: string[]) => keys.some((k) => can(k)),
    [can]
  );

  return useMemo(
    () => ({ permissions, loading, can, canAll, canAny, refresh: fetchPermissions }),
    [permissions, loading, can, canAll, canAny, fetchPermissions]
  );
}
