import { useState, useEffect } from "react";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useAuth } from "@/contexts/AuthContext";
import { useHospital } from "@/contexts/HospitalContext";
import { Megaphone, X, Bell, AlertTriangle, Info, Sparkles } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  message: string;
  background_color: string;
  icon: string;
  priority: string;
  created_at: string;
  created_by_name?: string;
  created_by_role?: string;
}

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; iconBg: string; accent: string }> = {
  amber:  { bg: "bg-amber-50 dark:bg-amber-950/50",   border: "border-amber-300 dark:border-amber-700",   text: "text-amber-900 dark:text-amber-100",   iconBg: "bg-amber-200 dark:bg-amber-900",   accent: "border-amber-400/50" },
  orange: { bg: "bg-orange-50 dark:bg-orange-950/50",  border: "border-orange-300 dark:border-orange-700",  text: "text-orange-900 dark:text-orange-100",  iconBg: "bg-orange-200 dark:bg-orange-900",  accent: "border-orange-400/50" },
  green:  { bg: "bg-emerald-50 dark:bg-emerald-950/50", border: "border-emerald-300 dark:border-emerald-700", text: "text-emerald-900 dark:text-emerald-100", iconBg: "bg-emerald-200 dark:bg-emerald-900", accent: "border-emerald-400/50" },
  blue:   { bg: "bg-blue-50 dark:bg-blue-950/50",     border: "border-blue-300 dark:border-blue-700",     text: "text-blue-900 dark:text-blue-100",     iconBg: "bg-blue-200 dark:bg-blue-900",     accent: "border-blue-400/50" },
  red:    { bg: "bg-red-50 dark:bg-red-950/50",       border: "border-red-300 dark:border-red-700",       text: "text-red-900 dark:text-red-100",       iconBg: "bg-red-200 dark:bg-red-900",       accent: "border-red-400/50" },
  purple: { bg: "bg-purple-50 dark:bg-purple-950/50",  border: "border-purple-300 dark:border-purple-700",  text: "text-purple-900 dark:text-purple-100",  iconBg: "bg-purple-200 dark:bg-purple-900",  accent: "border-purple-400/50" },
};

const ICON_MAP: Record<string, React.ElementType> = {
  megaphone: Megaphone,
  bell: Bell,
  alert: AlertTriangle,
  info: Info,
  sparkles: Sparkles,
};

export function AnnouncementBanner() {
  const { staff } = useAuth();
  const { hospitalId } = useHospital();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!staff) return;
    const fetch = async () => {
      let q = supabase.from("announcements").select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(5);

      const { data } = await q;
      if (!data) return;

      const role = staff.role || "";
      const filtered = (data as any[]).filter(a => {
        if (a.hospital_id && a.hospital_id !== hospitalId) return false;
        if (a.target_roles && a.target_roles.length > 0 && !a.target_roles.includes(role) && !a.target_roles.includes("all")) return false;
        if (a.expires_at && new Date(a.expires_at) < new Date()) return false;
        return true;
      });
      setAnnouncements(filtered);
    };
    fetch();
  }, [staff, hospitalId]);

  useEffect(() => {
    try {
      const d = sessionStorage.getItem("dismissed_announcements");
      if (d) setDismissed(new Set(JSON.parse(d)));
    } catch {}
  }, []);

  const dismiss = (id: string) => {
    setDismissed(prev => {
      const next = new Set(prev);
      next.add(id);
      try { sessionStorage.setItem("dismissed_announcements", JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const visible = announcements.filter(a => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 mb-3">
      {visible.map(a => {
        const colors = COLOR_MAP[a.background_color] || COLOR_MAP.amber;
        const IconComp = ICON_MAP[a.icon] || Megaphone;
        const isUrgent = a.priority === "urgent";
        const hasSignoff = a.created_by_name || a.created_by_role;

        return (
          <div
            key={a.id}
            className={`relative flex items-start gap-3 px-4 py-3 rounded-xl border-2 ${colors.bg} ${colors.border} ${colors.text} ${isUrgent ? "animate-pulse ring-2 ring-offset-1 ring-amber-400/50" : ""}`}
          >
            {/* Decorative ribbon */}
            <div className={`absolute -top-1 -left-1 w-6 h-6 ${colors.iconBg} rounded-br-lg rounded-tl-lg flex items-center justify-center`}>
              <IconComp className="h-3 w-3" />
            </div>

            <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${colors.iconBg} ml-3`}>
              <IconComp className="h-5 w-5" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm flex items-center gap-2">
                {a.title}
                {isUrgent && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500 text-white font-black uppercase tracking-wider">Urgent</span>}
              </p>
              <p className="text-xs mt-0.5 opacity-90 whitespace-pre-line">{a.message}</p>

              {/* Sign-off */}
              {hasSignoff && (
                <div className={`mt-2 pt-2 border-t ${colors.accent} text-[11px] italic opacity-75`}>
                  <span>Regards,</span>
                  <br />
                  {a.created_by_role && <span className="font-semibold not-italic">{a.created_by_role}</span>}
                  {a.created_by_role && a.created_by_name && <span>,</span>}
                  {a.created_by_name && <><br /><span className="font-bold not-italic">{a.created_by_name}</span></>}
                </div>
              )}

              <p className="text-[10px] opacity-50 mt-1">{new Date(a.created_at).toLocaleDateString()}</p>
            </div>

            <button
              onClick={() => dismiss(a.id)}
              className="shrink-0 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
