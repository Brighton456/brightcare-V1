import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { safeSupabase as supabase } from "@/lib/safeSupabase";

export interface StaffUser {
  id: string;
  staff_no: string;
  username?: string;
  first_name: string;
  last_name: string;
  role: string;
  department_id: string | null;
  hospital_id: string | null;
  must_change_password: boolean;
}

interface AuthState {
  staff: StaffUser | null;
  loading: boolean;
  user: { id: string } | null;
  session: { user: { id: string } } | null;
  signIn: (username: string, password: string) => Promise<{ error?: string; mustChange?: boolean; staff?: any }>;
  signOut: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ error?: string }>;
}

const SESSION_KEY = "brightcare_session";
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 min inactivity timeout
const AuthContext = createContext<AuthState | null>(null);

async function callAuth(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("staff-auth", { body });
  if (error) {
    // Try to extract the actual error message from the response body
    try {
      if ((error as any).context) {
        const resp = (error as any).context as Response;
        if (resp && typeof resp.json === "function") {
          const body = await resp.json();
          if (body?.error) return { error: body.error };
        }
      }
    } catch {}
    // If data was still returned with an error field, use it
    if (data?.error) return { error: data.error };
    throw new Error(error.message || "Network error");
  }
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);

  const getToken = () => localStorage.getItem(SESSION_KEY);

  // Validate session on mount
  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    callAuth({ action: "validate", session_token: token })
      .then((res) => {
        if (res.valid && res.staff) setStaff(res.staff);
        else {
          localStorage.removeItem(SESSION_KEY);
          if (res.reason === "session_expired") {
            // Session expired — clear quietly
          }
        }
      })
      .catch(() => localStorage.removeItem(SESSION_KEY))
      .finally(() => setLoading(false));
  }, []);

  // Inactivity timeout
  useEffect(() => {
    if (!staff) return;
    let timer: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        // Auto-logout on inactivity
        signOut();
      }, INACTIVITY_TIMEOUT);
    };
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      clearTimeout(timer);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [staff]);

  const signIn = useCallback(async (username: string, password: string) => {
    try {
      const res = await callAuth({ action: "login", username, password });
      if (res.error) return { error: res.error };
      if (res.session_token) {
        localStorage.setItem(SESSION_KEY, res.session_token);
        setStaff(res.staff);
        if (res.staff.must_change_password) return { mustChange: true };
        return { staff: res.staff };
      }
      return {};
    } catch (e: any) {
      return { error: e.message || "Connection error. Please try again." };
    }
  }, []);

  const signOut = useCallback(async () => {
    const token = getToken();
    if (token) {
      try { await callAuth({ action: "logout", session_token: token }); } catch {}
    }
    localStorage.removeItem(SESSION_KEY);
    setStaff(null);
  }, []);

  const changePassword = useCallback(async (newPassword: string) => {
    const token = getToken();
    if (!token) return { error: "No active session" };
    try {
      const res = await callAuth({ action: "change_password", session_token: token, new_password: newPassword });
      if (res.error) return { error: res.error };
      if (staff) setStaff({ ...staff, must_change_password: false });
      return {};
    } catch (e: any) {
      return { error: e.message };
    }
  }, [staff]);

  const user = staff ? { id: staff.id } : null;
  const session = staff ? { user: { id: staff.id } } : null;

  return (
    <AuthContext.Provider value={{ staff, loading, user, session, signIn, signOut, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
