import { useAuth } from "@/contexts/AuthContext";

const ADMIN_ROLES = ["platform_admin", "super_admin", "hospital_admin", "admin"];

/** Returns true if the current staff member has an admin-level role */
export function useIsAdmin(): boolean {
  const { staff } = useAuth();
  return ADMIN_ROLES.includes(staff?.role || "");
}
