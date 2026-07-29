import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ADMIN_ROLES = ["hospital_admin", "super_admin", "platform_admin"];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, history, staff_role, staff_name, staff_id, hospital_id } = await req.json();

    // Role check: only admins can use AI
    if (!staff_role || !ADMIN_ROLES.includes(staff_role)) {
      return new Response(JSON.stringify({
        reply: "🔒 **Access Restricted**\n\nThe Brightcare AI Assistant is available to hospital administrators only. Please contact your admin if you need AI-powered insights.",
        alerts: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!hospital_id) {
      return new Response(JSON.stringify({
        reply: "⚠️ No hospital context found. Please ensure you're logged into a hospital account.",
        alerts: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('API key not configured');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Fetch role-specific context — ALL filtered by hospital_id
    let dbContext = "";
    let proactiveAlerts: string[] = [];
    try {
      const [patientsRes, medsRes, billsRes, labRes, admissionsRes, prescRes, appointRes] = await Promise.all([
        sb.from("patients").select("id", { count: "exact", head: true }).eq("hospital_id", hospital_id),
        sb.from("medicines").select("id, name, stock, reorder_level, expiry_date, price, category").eq("hospital_id", hospital_id).order("stock", { ascending: true }).limit(50),
        sb.from("bills").select("id, total, status, created_at, payment_method").eq("hospital_id", hospital_id).order("created_at", { ascending: false }).limit(100),
        sb.from("lab_tests").select("id, status, test_name, patient_id, requested_at, completed_at").eq("hospital_id", hospital_id).order("requested_at", { ascending: false }).limit(50),
        sb.from("admissions").select("id, status, patient_id, admitted_at, bed_id").eq("hospital_id", hospital_id).eq("status", "admitted"),
        sb.from("prescriptions").select("id, status, created_at, patient_id").eq("hospital_id", hospital_id).order("created_at", { ascending: false }).limit(30),
        sb.from("appointments").select("id, status, appointment_date, appointment_time, reason").eq("hospital_id", hospital_id).eq("appointment_date", new Date().toISOString().split("T")[0]),
      ]);

      const meds = medsRes.data || [];
      const lowStock = meds.filter((m: any) => (m.stock || 0) <= (m.reorder_level || 10));
      const expiringSoon = meds.filter((m: any) => {
        if (!m.expiry_date) return false;
        const diff = (new Date(m.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return diff > 0 && diff <= 90;
      });
      const outOfStock = meds.filter((m: any) => (m.stock || 0) === 0);
      const bills = billsRes.data || [];
      const todayBills = bills.filter((b: any) => new Date(b.created_at).toDateString() === new Date().toDateString());
      const pendingBills = bills.filter((b: any) => b.status === "pending");
      const paidToday = todayBills.filter((b: any) => b.status === "paid");
      const todayRevenue = paidToday.reduce((s: number, b: any) => s + (b.total || 0), 0);
      const labs = labRes.data || [];
      const pendingLab = labs.filter((t: any) => t.status === "requested" || t.status === "in_progress");
      const completedLabToday = labs.filter((t: any) => t.status === "completed" && t.completed_at && new Date(t.completed_at).toDateString() === new Date().toDateString());
      const prescriptions = prescRes.data || [];
      const pendingRx = prescriptions.filter((p: any) => p.status === "pending");
      const todayAppointments = appointRes.data || [];

      dbContext = `
LIVE SYSTEM DATA (answer questions using this real data — this is YOUR hospital's data only):
- Total Patients Registered: ${patientsRes.count || 0}
- Current Admissions: ${admissionsRes.data?.length || 0} patients admitted
- Today's Appointments: ${todayAppointments.length} scheduled
- Medicines Inventory: ${meds.length} items tracked
  - Out of Stock: ${outOfStock.length}${outOfStock.length > 0 ? ` → ${outOfStock.slice(0, 5).map((m: any) => m.name).join(", ")}` : ""}
  - Low Stock (≤ reorder level): ${lowStock.length}${lowStock.length > 0 ? ` → ${lowStock.slice(0, 8).map((m: any) => `${m.name} (${m.stock} left)`).join(", ")}` : ""}
  - Expiring Within 90 Days: ${expiringSoon.length}${expiringSoon.length > 0 ? ` → ${expiringSoon.slice(0, 5).map((m: any) => `${m.name} (exp: ${m.expiry_date})`).join(", ")}` : ""}
- Bills Today: ${todayBills.length} (${paidToday.length} paid, Revenue: KES ${todayRevenue.toLocaleString()})
- Pending Bills: ${pendingBills.length} (Total: KES ${pendingBills.reduce((s: number, b: any) => s + (b.total || 0), 0).toLocaleString()})
- Lab Tests: ${pendingLab.length} pending, ${completedLabToday.length} completed today
- Prescriptions: ${pendingRx.length} awaiting dispensing`;

      if (outOfStock.length > 0) proactiveAlerts.push(`⚠️ ${outOfStock.length} medicine(s) are OUT OF STOCK and need urgent restocking.`);
      if (expiringSoon.length > 0) proactiveAlerts.push(`📅 ${expiringSoon.length} medicine(s) expiring within 90 days — review and reorder.`);
      if (pendingBills.length > 10) proactiveAlerts.push(`💰 ${pendingBills.length} bills are pending payment — follow up with patients.`);
      if (pendingLab.length > 5) proactiveAlerts.push(`🔬 ${pendingLab.length} lab tests are pending — lab queue may be backed up.`);
      if (pendingRx.length > 3) proactiveAlerts.push(`💊 ${pendingRx.length} prescriptions awaiting dispensing in the pharmacy.`);
      if (todayAppointments.length > 10) proactiveAlerts.push(`📋 Busy day ahead — ${todayAppointments.length} appointments scheduled today.`);

    } catch (e) {
      console.error("DB context fetch error:", e);
    }

    // Log the AI interaction
    if (staff_id) {
      try {
        await sb.from("activity_log").insert({
          staff_id,
          hospital_id,
          action: "ai_assistant_query",
          module: "ai_assistant",
          details: `Query: ${message.substring(0, 200)}`,
        });
      } catch (e) {
        console.error("Failed to log AI interaction:", e);
      }
    }

    const roleContext: Record<string, string> = {
      hospital_admin: `The current user is a HOSPITAL ADMINISTRATOR. Focus on: overall operations, staff management, department performance, compliance, strategic insights, system configuration. Provide executive-level summaries.`,
      super_admin: `The current user is a SUPER ADMIN with full system access. Provide comprehensive insights across all departments. Include technical operational details when relevant.`,
      platform_admin: `The current user is a PLATFORM ADMIN with full system access across all hospitals. Provide comprehensive insights.`,
    };

    const userRole = staff_role || "hospital_admin";
    const roleFocus = roleContext[userRole] || `The current user is an administrator. Provide executive-level insights.`;

    const alertsSection = proactiveAlerts.length > 0
      ? `\n\nPROACTIVE ALERTS TO MENTION WHEN RELEVANT:\n${proactiveAlerts.join("\n")}`
      : "";

    const systemPrompt = `You are Brightcare AI, the intelligent assistant built into Brightcare — a comprehensive Hospital Management & Pharmacy POS System by Brightech Publishers.

${roleFocus}

Current user: ${staff_name || "Administrator"} (${userRole})

STRICT RULES:
- NEVER mention how the system was built, what frameworks or libraries are used, or any technical implementation details.
- NEVER mention "Lovable", "Supabase", "React", "Vite", "TypeScript", "PostgreSQL", "IndexedDB", "Electron", or any technology name.
- If asked about technology, say: "Brightcare uses proprietary Brightech technology optimized for healthcare."
- NEVER reveal API endpoints, database structures, or source code.
- Refer to backend as "Brightech Cloud" and AI as "Brightcare AI".
- Be conversational, professional, and warm. Use the user's name when appropriate.
- When asked about data (stock, bills, patients, etc.), USE THE LIVE DATA provided below. Do NOT make up numbers.
- ALL data shown is specific to THIS hospital only. Never reference other hospitals' data.
- If asked irrelevant/off-topic questions, redirect warmly: "Great question! But let me help you with something even better in Brightcare..." and share a useful tip.
- Always promote Brightcare's capabilities naturally.
- Provide specific step-by-step guidance when asked "how to" questions.
- When providing data, format it clearly with bullet points and numbers.
- If you spot issues in the data (low stock, pending items), proactively mention them.

RESPONSE STYLE:
- Keep responses focused and actionable (not too long, not too short)
- Use bullet points for lists
- Bold important numbers and names
- Include specific navigation paths like "Go to Pharmacy → POS → [action]"
- End with a helpful follow-up question when appropriate

Key system features:
- Hospital Management: Patient registration, appointments, consultations, lab tests, wards, discharge
- Pharmacy POS: Fast sales, barcode scanning, split payments, hold/recall, M-Pesa STK Push
- Billing: Real-time/cumulative/hybrid modes, insurance claims, multi-payment
- Laboratory: Test tracking, result entry, abnormal flagging, consumable management
- Inventory: Real-time tracking, batch management, expiry alerts, CSV import, purchase orders
- Reports: 80+ report types, CSV/PDF export, analytics dashboards
- Staff: 10+ roles, 300+ permissions, department assignment, audit logging
- Inpatient: Ward management, bed allocation, vitals, nursing notes
- Financial Reconciliation: Daily/weekly/monthly settlements
- Offline Mode: Full offline with automatic sync
- Internal Messaging: Department-to-department with auto-expiry
- Keyboard shortcuts: F2=Quick Pick, F3=Held Sales, F4=Discount, F5=Return, F6=Split, F7=Credit
${dbContext}${alertsSection}`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []).slice(-12).map((m: any) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages,
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI API error:', response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ reply: "I'm handling many requests right now. Please try again in a moment!" }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ reply: "The AI service needs a configuration update. Please contact your system administrator." }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('AI service temporarily unavailable');
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "I'm here to help! Could you rephrase your question?";

    return new Response(JSON.stringify({ reply, alerts: proactiveAlerts }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      reply: "I appreciate your patience! Let me help you with Brightcare.\n\n🏥 **Quick Guide:**\n- **Patient Registration** → Patients module\n- **Make a Sale** → Pharmacy POS (F2 for Quick Pick)\n- **Lab Tests** → Doctor Console → Request Lab Test\n- **Reports** → Reports Center (80+ analytics)\n- **Billing** → Process Payment module\n\n💡 Brightcare supports full offline mode — your work syncs automatically!\n\nWhat specific task can I guide you through?",
      alerts: []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});
