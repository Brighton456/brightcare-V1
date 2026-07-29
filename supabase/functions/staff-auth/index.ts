import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SESSION_TIMEOUT_HOURS = 12;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, username, staff_no, password, new_password, session_token } = await req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    if (action === "login") {
      // Support both username and staff_no for backward compat
      const loginId = username || staff_no;
      if (!loginId || !password) {
        return json({ error: "Username and password are required." }, 400);
      }

      // Try username first (case-insensitive), then staff_no
      // CRITICAL: only consider ACTIVE staff so that deactivated accounts cannot log in
      // (and therefore stop generating activity_log entries under their name).
      let { data: staffRows } = await sb
        .from("staff")
        .select("id, staff_no, username, first_name, last_name, role, department_id, hospital_id, is_active, password_hash, must_change_password, failed_attempts, locked_until")
        .ilike("username", loginId.trim())
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      let staff: any = staffRows && staffRows.length > 0 ? staffRows[0] : null;

      if (!staff) {
        // Fallback: try staff_no
        const { data: byNo } = await sb
          .from("staff")
          .select("id, staff_no, username, first_name, last_name, role, department_id, hospital_id, is_active, password_hash, must_change_password, failed_attempts, locked_until")
          .eq("staff_no", loginId.trim())
          .eq("is_active", true)
          .order("created_at", { ascending: false });
        staff = byNo && byNo.length > 0 ? byNo[0] : null;
      }

      if (!staff) {
        return json({ error: "Invalid username or this account has been deactivated. Contact your administrator." }, 401);
      }

      // Check lockout
      if (staff.locked_until && new Date(staff.locked_until) > new Date()) {
        const mins = Math.ceil((new Date(staff.locked_until).getTime() - Date.now()) / 60000);
        return json({ error: `Account locked. Try again in ${mins} minute(s).` }, 429);
      }

      // Verify password
      const { data: valid } = await sb.rpc("verify_password", { raw_password: password, hashed: staff.password_hash });

      if (!valid) {
        const attempts = (staff.failed_attempts || 0) + 1;
        const updates: any = { failed_attempts: attempts };
        if (attempts >= 5) {
          updates.locked_until = new Date(Date.now() + 15 * 60000).toISOString();
        }
        await sb.from("staff").update(updates).eq("id", staff.id);
        return json({ error: `Incorrect password. ${Math.max(0, 5 - attempts)} attempt(s) remaining.` }, 401);
      }

      // Generate session token
      const token = crypto.randomUUID() + "-" + crypto.randomUUID();

      // Clear failed attempts, set session, invalidate old session (single-session policy)
      await sb.from("staff").update({
        failed_attempts: 0,
        locked_until: null,
        session_token: token,
        last_login_at: new Date().toISOString(),
      }).eq("id", staff.id);

      // Log the login
      await sb.from("activity_log").insert({
        staff_id: staff.id,
        hospital_id: staff.hospital_id,
        action: "LOGIN",
        module: "auth",
        details: `${staff.first_name} ${staff.last_name} (${staff.role}) logged in via username: ${staff.username}`,
      });

      // Check hospital license status (skip for platform_admin)
      let hospitalInfo = null;
      if (staff.role !== "platform_admin" && staff.hospital_id) {
        const { data: hosp } = await sb
          .from("hospitals")
          .select("id, name, license_status, license_expires_at, trial_ends_at, is_active")
          .eq("id", staff.hospital_id)
          .single();

        if (hosp) {
          hospitalInfo = hosp;
          if (!hosp.is_active || hosp.license_status === "suspended") {
            return json({ error: "Your hospital's license has been suspended. Contact support." }, 403);
          }
          if (hosp.license_status === "expired") {
            return json({ error: "Your hospital's license has expired. Please renew to continue." }, 403);
          }
        }
      }

      return json({
        success: true,
        session_token: token,
        staff: {
          id: staff.id,
          staff_no: staff.staff_no,
          username: staff.username,
          first_name: staff.first_name,
          last_name: staff.last_name,
          role: staff.role,
          department_id: staff.department_id,
          hospital_id: staff.hospital_id,
          must_change_password: staff.must_change_password,
        },
        hospital: hospitalInfo,
      });
    }

    if (action === "change_password") {
      if (!session_token || !new_password) {
        return json({ error: "Missing session or new password" }, 400);
      }
      // Password complexity: min 8 chars, at least 1 uppercase, 1 number
      if (new_password.length < 8) {
        return json({ error: "Password must be at least 8 characters" }, 400);
      }
      if (!/[A-Z]/.test(new_password)) {
        return json({ error: "Password must contain at least one uppercase letter" }, 400);
      }
      if (!/[0-9]/.test(new_password)) {
        return json({ error: "Password must contain at least one number" }, 400);
      }

      const { data: staff } = await sb.from("staff").select("id, first_name, last_name, role, hospital_id").eq("session_token", session_token).single();
      if (!staff) {
        return json({ error: "Invalid session" }, 401);
      }

      const { data: hashed } = await sb.rpc("hash_password", { raw_password: new_password });
      await sb.from("staff").update({ password_hash: hashed, must_change_password: false, plain_password: new_password }).eq("id", staff.id);

      await sb.from("activity_log").insert({
        staff_id: staff.id,
        hospital_id: staff.hospital_id,
        action: "PASSWORD_CHANGE",
        module: "auth",
        details: `${staff.first_name} ${staff.last_name} changed their password`,
      });

      return json({ success: true });
    }

    if (action === "validate") {
      if (!session_token) {
        return json({ valid: false });
      }
      const { data: staff } = await sb
        .from("staff")
        .select("id, staff_no, username, first_name, last_name, role, department_id, hospital_id, is_active, must_change_password, last_login_at")
        .eq("session_token", session_token)
        .eq("is_active", true)
        .single();

      if (!staff) {
        return json({ valid: false });
      }

      // Check session timeout (12 hours)
      if (staff.last_login_at) {
        const loginTime = new Date(staff.last_login_at).getTime();
        const elapsed = Date.now() - loginTime;
        if (elapsed > SESSION_TIMEOUT_HOURS * 60 * 60 * 1000) {
          await sb.from("staff").update({ session_token: null }).eq("id", staff.id);
          return json({ valid: false, reason: "session_expired" });
        }
      }

      return json({ valid: true, staff });
    }

    if (action === "logout") {
      if (session_token) {
        const { data: staff } = await sb.from("staff").select("id, first_name, last_name, role, hospital_id").eq("session_token", session_token).single();
        if (staff) {
          await sb.from("staff").update({ session_token: null }).eq("id", staff.id);
          await sb.from("activity_log").insert({
            staff_id: staff.id,
            hospital_id: staff.hospital_id,
            action: "LOGOUT",
            module: "auth",
            details: `${staff.first_name} ${staff.last_name} (${staff.role}) logged out`,
          });
        }
      }
      return json({ success: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
