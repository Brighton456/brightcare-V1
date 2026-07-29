import { useState, useEffect, useMemo } from "react";
import brightcareLogo from "@/assets/brightcare-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { AnnouncementManager } from "@/components/AnnouncementManager";
import { useAuth } from "@/contexts/AuthContext";
import { savePlatformSettings } from "@/hooks/usePlatformSettings";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import {
  Building2, DollarSign, Users, Activity, Search, Ban, CheckCircle, AlertTriangle,
  Key, Copy, Plus, RefreshCw, Shield, BarChart3, FileText, Settings, LogOut,
  TrendingUp, Eye, Edit, Trash2, Crown, Zap, Sparkles, Globe, Clock,
  ChevronRight, LayoutDashboard, Package, ScrollText, CreditCard, Heart,
  Stethoscope, Pill, TestTube, BedDouble, UserCog, Database, Server,
  Monitor, AlertCircle, Info, ArrowUpRight, ArrowDownRight, Wallet,
  MapPin, Phone, Mail, Calendar, Hash, Lock, Unlock, ChevronDown,
  PieChart, BarChart, LineChart, Layers, Cpu, HardDrive, Wifi, ShieldCheck
} from "lucide-react";
import { format, differenceInDays, subDays } from "date-fns";
import { generateLicenseKey } from "@/utils/licenseKeys";
import { useConfirm } from "@/hooks/useConfirm";

// Editable date field with local draft state — commits onBlur / Enter so typing
// digits doesn't fire a save on every keystroke (which made native <input type="date"> feel broken).
function DateEditField({
  value,
  onCommit,
  className = "",
}: {
  value: string | null;
  onCommit: (isoOrNull: string | null) => void | Promise<void>;
  className?: string;
}) {
  const initial = value ? format(new Date(value), "yyyy-MM-dd") : "";
  const [draft, setDraft] = useState(initial);
  // Re-sync when parent value changes (e.g. quick-extend buttons)
  useEffect(() => {
    setDraft(value ? format(new Date(value), "yyyy-MM-dd") : "");
  }, [value]);

  const commit = () => {
    const current = value ? format(new Date(value), "yyyy-MM-dd") : "";
    if (draft === current) return; // no change
    if (draft && isNaN(new Date(draft).getTime())) return; // invalid, ignore
    onCommit(draft ? new Date(draft).toISOString() : null);
  };

  return (
    <Input
      type="date"
      className={className}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.currentTarget.blur();
        }
      }}
    />
  );
}

// Types
interface HospitalRow {
  id: string; name: string; slug: string; email: string | null; city: string | null;
  license_status: string; license_expires_at: string | null; trial_ends_at: string | null;
  is_active: boolean; created_at: string; phone: string | null; country: string | null;
  address: string | null; license_started_at: string | null;
  maintenance_due_at: string | null; maintenance_last_paid_at: string | null; maintenance_warning_days: number;
  license_packages?: { display_name: string; price_yearly: number; maintenance_monthly: number; name: string } | null;
}

interface LicenseKeyRow {
  id: string; license_key: string; hospital_id: string | null; package_id: string | null;
  status: string; duration_months: number; activated_at: string | null; expires_at: string | null;
  created_at: string; notes: string | null;
  license_packages?: { display_name: string } | null;
  hospitals?: { name: string } | null;
}

interface PackageRow {
  id: string; name: string; display_name: string; price_monthly: number; price_yearly: number | null;
  price_lifetime: number | null; maintenance_monthly: number | null; max_staff: number | null;
  max_patients: number | null; is_active: boolean; sort_order: number | null;
  allowed_modules: string[]; description: string | null;
}

interface AuditRow {
  id: string; hospital_id: string; action: string; details: string | null;
  created_at: string | null; hospitals?: { name: string } | null;
}

interface HospitalStats {
  staffCount: number; patientCount: number; salesCount: number; billsCount: number;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: "bg-emerald-500/10", text: "text-emerald-600", dot: "bg-emerald-500" },
  trial: { bg: "bg-amber-500/10", text: "text-amber-600", dot: "bg-amber-500" },
  grace: { bg: "bg-orange-500/10", text: "text-orange-600", dot: "bg-orange-500" },
  suspended: { bg: "bg-red-500/10", text: "text-red-600", dot: "bg-red-500" },
  expired: { bg: "bg-slate-500/10", text: "text-slate-600", dot: "bg-slate-500" },
};

type Tab = "overview" | "hospitals" | "hospital-detail" | "keys" | "packages" | "audit" | "system" | "revenue" | "support" | "mpesa" | "announcements";

const NAV_SECTIONS = [
  { label: "Analytics", items: [
    { key: "overview" as Tab, icon: LayoutDashboard, label: "Overview" },
    { key: "revenue" as Tab, icon: TrendingUp, label: "Revenue" },
  ]},
  { label: "Management", items: [
    { key: "hospitals" as Tab, icon: Building2, label: "Hospitals" },
    { key: "keys" as Tab, icon: Key, label: "License Keys" },
    { key: "packages" as Tab, icon: Package, label: "Packages" },
    { key: "mpesa" as Tab, icon: Wallet, label: "M-Pesa Config" },
    { key: "announcements" as Tab, icon: Globe, label: "Announcements" },
  ]},
  { label: "System", items: [
    { key: "audit" as Tab, icon: ScrollText, label: "Audit Trail" },
    { key: "system" as Tab, icon: Server, label: "System Health" },
    { key: "support" as Tab, icon: Phone, label: "Support Settings" },
  ]},
];

export default function PlatformAdmin() {
  const { staff, signOut } = useAuth();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [tab, setTab] = useState<Tab>("overview");
  const [hospitals, setHospitals] = useState<HospitalRow[]>([]);
  const [licenseKeys, setLicenseKeys] = useState<LicenseKeyRow[]>([]);
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedHospital, setSelectedHospital] = useState<HospitalRow | null>(null);
  const [hospitalStats, setHospitalStats] = useState<HospitalStats>({ staffCount: 0, patientCount: 0, salesCount: 0, billsCount: 0 });
  const [totalStaff, setTotalStaff] = useState(0);
  const [totalPatients, setTotalPatients] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [hospitalStaffList, setHospitalStaffList] = useState<any[]>([]);
  const [resettingPw, setResettingPw] = useState(false);
  const [showAddHidden, setShowAddHidden] = useState(false);
  const [hiddenForm, setHiddenForm] = useState({ first_name: "", last_name: "", username: "" });
  const [confirmResetId, setConfirmResetId] = useState<string | null>(null);
  const [confirmResetName, setConfirmResetName] = useState("");

  // Dialogs
  const [showGenerate, setShowGenerate] = useState(false);
  const [genPackage, setGenPackage] = useState("");
  const [genDuration, setGenDuration] = useState("12");
  const [genCount, setGenCount] = useState("1");
  const [genNotes, setGenNotes] = useState("");
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);
  const [editPkg, setEditPkg] = useState<PackageRow | null>(null);
  const [editForm, setEditForm] = useState({ display_name: "", price_yearly: "", price_monthly: "", price_lifetime: "", maintenance_monthly: "", max_staff: "", description: "" });
  const [statusFilter, setStatusFilter] = useState("all");
  const [supportSettings, setSupportSettings] = useState({
    support_email: "support@brightcare.co.ke",
    support_phone: "+254 720363215",
    support_phone_2: "+254 742758711",
    whatsapp_number: "+254 720363215",
    website_url: "https://brightcare.co.ke",
    office_address: "Nairobi, Kenya",
    working_hours: "Mon-Fri, 8:00 AM - 6:00 PM EAT",
    emergency_phone: "+254 742758711",
  });
  const [mpesaHospitalId, setMpesaHospitalId] = useState("");
  const [mpesaApiKey, setMpesaApiKey] = useState("");
  const [mpesaShortcode, setMpesaShortcode] = useState("174379");
  const [mpesaSaving, setMpesaSaving] = useState(false);

  const saveMpesaForHospital = async () => {
    if (!mpesaHospitalId || !mpesaApiKey) { toast({ title: "Select hospital and enter API key", variant: "destructive" }); return; }
    setMpesaSaving(true);
    const { data: h } = await supabase.from("hospitals").select("settings").eq("id", mpesaHospitalId).single();
    const currentSettings = (h as any)?.settings || {};
    const { error } = await supabase.from("hospitals").update({
      settings: {
        ...currentSettings,
        mpesa_endpoint: "https://ftwbfezbikovfzfbxvnn.supabase.co/functions/v1/endpoint-pay",
        mpesa_status_endpoint: "https://ftwbfezbikovfzfbxvnn.supabase.co/functions/v1/endpoint-status",
        mpesa_api_key: mpesaApiKey,
        mpesa_shortcode: mpesaShortcode,
      },
    } as any).eq("id", mpesaHospitalId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅ M-Pesa configured for hospital" });
      await supabase.from("license_audit_log").insert({ hospital_id: mpesaHospitalId, action: "MPESA_CONFIGURED", details: `M-Pesa API key configured by platform admin`, performed_by: staff?.id });
    }
    setMpesaSaving(false);
  };

  useEffect(() => {
    if (staff?.role !== "platform_admin") { navigate("/login"); return; }
    fetchAll();
  }, [staff]);

  const fetchAll = async () => {
    setLoading(true);
    const [hRes, kRes, pRes, aRes, staffRes, patRes, salesRes] = await Promise.all([
      supabase.from("hospitals").select("*, license_packages(display_name, price_yearly, maintenance_monthly, name)").order("created_at", { ascending: false }),
      supabase.from("license_keys").select("*, license_packages(display_name), hospitals(name)").order("created_at", { ascending: false }).limit(500),
      supabase.from("license_packages").select("*").order("sort_order"),
      supabase.from("license_audit_log").select("*, hospitals(name)").order("created_at", { ascending: false }).limit(200),
      supabase.from("staff").select("id", { count: "exact", head: true }),
      supabase.from("patients").select("id", { count: "exact", head: true }),
      supabase.from("pharmacy_sales").select("total").limit(1000),
    ]);

    if (hRes.data) setHospitals(hRes.data as any);
    if (kRes.data) setLicenseKeys(kRes.data as any);
    if (pRes.data) setPackages(pRes.data as any);
    if (aRes.data) setAuditLogs(aRes.data as any);
    setTotalStaff(staffRes.count || 0);
    setTotalPatients(patRes.count || 0);
    setTotalSales(salesRes.data?.reduce((s, r) => s + (Number(r.total) || 0), 0) || 0);

    // Load platform settings from DB
    const { data: psData } = await supabase.from("platform_settings" as any).select("key, value");
    if (psData && Array.isArray(psData)) {
      const map: Record<string, string> = {};
      (psData as any[]).forEach((r: any) => { map[r.key] = r.value; });
      setSupportSettings(prev => ({ ...prev, ...map }));
    }

    setLoading(false);
  };

  const fetchHospitalDetail = async (h: HospitalRow) => {
    // Re-fetch hospital to get latest data (including maintenance fields)
    const { data: freshH } = await supabase.from("hospitals").select("*, license_packages(display_name, price_yearly, maintenance_monthly, name)").eq("id", h.id).single();
    const hospital = (freshH as any as HospitalRow) || h;
    setSelectedHospital(hospital);
    setTab("hospital-detail");
    const [s, p, sales, bills, staffList] = await Promise.all([
      supabase.from("staff").select("id", { count: "exact", head: true }).eq("hospital_id", h.id),
      supabase.from("patients").select("id", { count: "exact", head: true }).eq("hospital_id", h.id),
      supabase.from("pharmacy_sales").select("id", { count: "exact", head: true }).eq("hospital_id", h.id),
      supabase.from("bills").select("id", { count: "exact", head: true }).eq("hospital_id", h.id),
      supabase.from("staff").select("id,username,first_name,last_name,role,plain_password,is_active,is_hidden").eq("hospital_id", h.id).order("created_at"),
    ]);
    setHospitalStats({ staffCount: s.count || 0, patientCount: p.count || 0, salesCount: sales.count || 0, billsCount: bills.count || 0 });
    setHospitalStaffList((staffList.data as any[]) || []);
  };

  const toggleSuspend = async (h: HospitalRow) => {
    const newStatus = h.license_status === "suspended" ? "active" : "suspended";
    const ok = await confirm({
      title: newStatus === "suspended" ? "Suspend hospital?" : "Reactivate hospital?",
      description: newStatus === "suspended"
        ? `This will immediately lock all staff at "${h.name}" out of the system. Continue?`
        : `This will restore access for all staff at "${h.name}". Continue?`,
      confirmLabel: newStatus === "suspended" ? "Yes, Suspend" : "Yes, Reactivate",
      destructive: newStatus === "suspended",
    });
    if (!ok) return;
    await supabase.from("hospitals").update({ license_status: newStatus, is_active: newStatus !== "suspended" } as any).eq("id", h.id);
    await supabase.from("license_audit_log").insert({ hospital_id: h.id, action: newStatus === "suspended" ? "SUSPENDED" : "REACTIVATED", details: `By platform admin`, performed_by: staff?.id });
    toast({ title: newStatus === "suspended" ? "Hospital Suspended" : "Hospital Reactivated" });
    fetchAll();
  };

  const handleGenerateKeys = async () => {
    if (!genPackage) { toast({ title: "Select a package", variant: "destructive" }); return; }
    const count = Math.min(parseInt(genCount) || 1, 50);
    const duration = parseInt(genDuration) || 12;
    const keys: string[] = [];
    for (let i = 0; i < count; i++) {
      const key = generateLicenseKey();
      keys.push(key);
      await supabase.from("license_keys").insert({ license_key: key, package_id: genPackage, duration_months: duration, generated_by: staff?.id, notes: genNotes || null, status: "unused" } as any);
    }
    setGeneratedKeys(keys);
    toast({ title: `✅ ${count} license key(s) generated` });
    fetchAll();
  };

  const revokeKey = async (id: string) => {
    await supabase.from("license_keys").update({ status: "revoked" } as any).eq("id", id);
    toast({ title: "Key revoked" });
    fetchAll();
  };

  const openEditPkg = (p: PackageRow) => {
    setEditPkg(p);
    setEditForm({
      display_name: p.display_name, price_yearly: String(p.price_yearly || 0),
      price_monthly: String(p.price_monthly || 3000), price_lifetime: String(p.price_lifetime || 80000),
      maintenance_monthly: String(p.maintenance_monthly || 3000), max_staff: String(p.max_staff || 50),
      description: p.description || "",
    });
  };

  const savePackage = async () => {
    if (!editPkg) return;
    await supabase.from("license_packages").update({
      display_name: editForm.display_name, price_yearly: parseFloat(editForm.price_yearly) || 0,
      price_monthly: parseFloat(editForm.price_monthly) || 3000, price_lifetime: parseFloat(editForm.price_lifetime) || null,
      maintenance_monthly: parseFloat(editForm.maintenance_monthly) || 3000, max_staff: parseInt(editForm.max_staff) || 50,
      description: editForm.description,
    } as any).eq("id", editPkg.id);
    toast({ title: "Package updated" });
    setEditPkg(null);
    fetchAll();
  };

  // Computed stats
  const stats = useMemo(() => {
    const active = hospitals.filter(h => h.license_status === "active").length;
    const trial = hospitals.filter(h => h.license_status === "trial").length;
    const suspended = hospitals.filter(h => h.license_status === "suspended").length;
    const expired = hospitals.filter(h => h.license_status === "expired").length;
    const grace = hospitals.filter(h => h.license_status === "grace").length;
    const revenueYearly = hospitals.filter(h => h.license_status === "active").reduce((s, h) => s + ((h as any).license_packages?.price_yearly || 0), 0);
    const revenueMonthly = hospitals.filter(h => h.license_status === "active").reduce((s, h) => s + ((h as any).license_packages?.maintenance_monthly || 3000), 0);
    const unusedKeys = licenseKeys.filter(k => k.status === "unused").length;
    const activatedKeys = licenseKeys.filter(k => k.status === "activated").length;
    const recentHospitals = hospitals.filter(h => h.created_at && differenceInDays(new Date(), new Date(h.created_at)) <= 30).length;
    return { total: hospitals.length, active, trial, suspended, expired, grace, revenueYearly, revenueMonthly, unusedKeys, activatedKeys, recentHospitals };
  }, [hospitals, licenseKeys]);

  const filteredH = useMemo(() => {
    let list = hospitals;
    if (statusFilter !== "all") list = list.filter(h => h.license_status === statusFilter);
    if (search) list = list.filter(h => h.name.toLowerCase().includes(search.toLowerCase()) || h.email?.toLowerCase().includes(search.toLowerCase()) || h.city?.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [hospitals, search, statusFilter]);

  const handleLogout = async () => { await signOut(); navigate("/login"); };
  const fmt = (n: number) => `KES ${n.toLocaleString()}`;

  const resetStaffPassword = async (staffId: string) => {
    setResettingPw(true);
    try {
      const defaultPw = "changeme";
      const { data: pwHash } = await supabase.rpc("hash_password", { raw_password: defaultPw });
      await supabase.from("staff").update({ password_hash: pwHash, plain_password: defaultPw, must_change_password: true } as any).eq("id", staffId);
      toast({ title: "✅ Password Reset", description: `Password reset to "changeme".`, duration: 8000 });
      setConfirmResetId(null);
      if (selectedHospital) fetchHospitalDetail(selectedHospital);
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setResettingPw(false);
  };

  const addHiddenStaff = async () => {
    if (!selectedHospital || !hiddenForm.first_name || !hiddenForm.last_name) {
      toast({ title: "Name required", variant: "destructive" }); return;
    }
    const autoUsername = hiddenForm.username || `${hiddenForm.first_name}.${hiddenForm.last_name}`.toLowerCase().replace(/\s+/g, '');
    const defaultPw = "changeme";
    const { data: pwHash } = await supabase.rpc("hash_password", { raw_password: defaultPw });
    const { error } = await supabase.from("staff").insert({
      first_name: hiddenForm.first_name, last_name: hiddenForm.last_name,
      username: autoUsername, role: "hospital_admin",
      staff_no: `STF-${Date.now().toString().slice(-6)}`,
      password_hash: pwHash, plain_password: defaultPw,
      must_change_password: true, hospital_id: selectedHospital.id,
      is_hidden: true,
    } as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Hidden Staff Added", description: `Username: ${autoUsername} | Password: ${defaultPw}. Role: Hospital Admin. This staff is invisible to the hospital admin.`, duration: 20000 });
    setShowAddHidden(false);
    setHiddenForm({ first_name: "", last_name: "", username: "" });
    fetchHospitalDetail(selectedHospital);
  };

  const StatusDot = ({ status }: { status: string }) => {
    const c = STATUS_COLORS[status] || STATUS_COLORS.expired;
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${c.text}`}>
        <span className={`h-2 w-2 rounded-full ${c.dot} animate-pulse`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="w-[260px] bg-slate-900/80 backdrop-blur-xl border-r border-white/5 flex flex-col shrink-0">
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <img src={brightcareLogo} alt="Brightcare" className="h-10 w-10 rounded-xl object-contain" />
            <div>
              <h1 className="font-bold text-sm text-white">Brightcare</h1>
              <p className="text-[10px] text-slate-500">Platform Control Center</p>
            </div>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <nav className="p-3 space-y-5">
            {NAV_SECTIONS.map(section => (
              <div key={section.label}>
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider px-3 mb-1.5">{section.label}</p>
                <div className="space-y-0.5">
                  {section.items.map(item => (
                    <button key={item.key} onClick={() => { setTab(item.key); setSelectedHospital(null); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${tab === item.key ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-400 font-semibold border border-amber-500/20" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Quick stats in sidebar */}
        <div className="p-4 border-t border-white/5 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-white">{stats.total}</p>
              <p className="text-[9px] text-slate-500">Hospitals</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-emerald-400">{stats.active}</p>
              <p className="text-[9px] text-slate-500">Active</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
              <Crown className="h-4 w-4 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{staff?.first_name} {staff?.last_name}</p>
              <p className="text-[10px] text-slate-600">Platform Admin</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full text-slate-500 hover:text-white gap-2 justify-start h-8 text-xs" onClick={handleLogout}>
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="p-6 max-w-[1400px] mx-auto space-y-6">

          {/* OVERVIEW TAB */}
          {tab === "overview" && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Platform Overview</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Real-time metrics across all hospital tenants</p>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5 border-white/10 text-slate-300 hover:text-white" onClick={fetchAll}>
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
                </Button>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: Building2, color: "from-blue-500 to-cyan-500", value: stats.total, label: "Total Hospitals", sub: `${stats.recentHospitals} this month` },
                  { icon: CheckCircle, color: "from-emerald-500 to-green-500", value: stats.active, label: "Active Licenses", sub: `${stats.trial} on trial` },
                  { icon: Users, color: "from-violet-500 to-purple-500", value: totalStaff, label: "Total Staff", sub: "Across all hospitals" },
                  { icon: Heart, color: "from-pink-500 to-rose-500", value: totalPatients, label: "Total Patients", sub: "All registered" },
                  { icon: TrendingUp, color: "from-amber-500 to-orange-500", value: fmt(stats.revenueYearly), label: "Annual License Revenue", sub: "Active subscriptions" },
                  { icon: CreditCard, color: "from-indigo-500 to-blue-500", value: fmt(stats.revenueMonthly), label: "Monthly Maintenance", sub: "Recurring revenue" },
                  { icon: Key, color: "from-teal-500 to-cyan-500", value: stats.unusedKeys, label: "Unused Keys", sub: `${stats.activatedKeys} activated` },
                  { icon: Wallet, color: "from-fuchsia-500 to-pink-500", value: fmt(totalSales), label: "Platform Sales Volume", sub: "Pharmacy transactions" },
                ].map((s, i) => (
                  <Card key={i} className="bg-slate-900/50 border-white/5 hover:border-white/10 transition-all group">
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[11px] text-slate-500 font-medium mb-1">{s.label}</p>
                          <p className="text-xl font-bold text-white">{s.value}</p>
                          <p className="text-[10px] text-slate-600 mt-1">{s.sub}</p>
                        </div>
                        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-lg opacity-80 group-hover:opacity-100 transition-opacity`}>
                          <s.icon className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Hospital Status Distribution */}
              <div className="grid lg:grid-cols-3 gap-4">
                <Card className="bg-slate-900/50 border-white/5 lg:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-white">Hospital Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { label: "Active", count: stats.active, color: "bg-emerald-500", pct: stats.total ? (stats.active / stats.total) * 100 : 0 },
                        { label: "Trial", count: stats.trial, color: "bg-amber-500", pct: stats.total ? (stats.trial / stats.total) * 100 : 0 },
                        { label: "Grace", count: stats.grace, color: "bg-orange-500", pct: stats.total ? (stats.grace / stats.total) * 100 : 0 },
                        { label: "Suspended", count: stats.suspended, color: "bg-red-500", pct: stats.total ? (stats.suspended / stats.total) * 100 : 0 },
                        { label: "Expired", count: stats.expired, color: "bg-slate-500", pct: stats.total ? (stats.expired / stats.total) * 100 : 0 },
                      ].map(s => (
                        <div key={s.label} className="flex items-center gap-3">
                          <span className="text-xs text-slate-400 w-20">{s.label}</span>
                          <div className="flex-1 bg-white/5 rounded-full h-2.5 overflow-hidden">
                            <div className={`h-full rounded-full ${s.color} transition-all duration-700`} style={{ width: `${s.pct}%` }} />
                          </div>
                          <span className="text-xs font-mono text-slate-400 w-8 text-right">{s.count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border-white/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-white">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { label: "Generate License Keys", icon: Key, action: () => { setShowGenerate(true); setGeneratedKeys([]); setGenPackage(""); } },
                      { label: "View All Hospitals", icon: Building2, action: () => setTab("hospitals") },
                      { label: "Edit Package Pricing", icon: DollarSign, action: () => setTab("packages") },
                      { label: "View Audit Logs", icon: ScrollText, action: () => setTab("audit") },
                      { label: "System Health", icon: Server, action: () => setTab("system") },
                    ].map((a, i) => (
                      <button key={i} onClick={a.action} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all text-sm group">
                        <a.icon className="h-4 w-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                        {a.label}
                        <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity & Hospitals */}
              <div className="grid lg:grid-cols-2 gap-4">
                <Card className="bg-slate-900/50 border-white/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-white flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-amber-400" /> Recent Hospitals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {hospitals.slice(0, 6).map(h => (
                        <button key={h.id} onClick={() => fetchHospitalDetail(h)} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-all group text-left">
                          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center shrink-0">
                            <Building2 className="h-4 w-4 text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{h.name}</p>
                            <p className="text-[10px] text-slate-500">{h.city || "—"} • {h.created_at ? format(new Date(h.created_at), "MMM d, yyyy") : ""}</p>
                          </div>
                          <StatusDot status={h.license_status} />
                          <ChevronRight className="h-3.5 w-3.5 text-slate-600 opacity-0 group-hover:opacity-100" />
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border-white/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-white flex items-center gap-2">
                      <ScrollText className="h-4 w-4 text-amber-400" /> Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[280px]">
                      <div className="space-y-2">
                        {auditLogs.slice(0, 12).map(log => (
                          <div key={log.id} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                            <div className="h-7 w-7 rounded-full bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                              <FileText className="h-3.5 w-3.5 text-slate-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-slate-300"><span className="font-semibold text-white">{(log as any).hospitals?.name || "System"}</span> — {log.action}</p>
                              {log.details && <p className="text-[10px] text-slate-600 truncate">{log.details}</p>}
                            </div>
                            <span className="text-[10px] text-slate-600 shrink-0">{log.created_at ? format(new Date(log.created_at), "MMM d, HH:mm") : ""}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* REVENUE TAB */}
          {tab === "revenue" && (
            <>
              <div>
                <h2 className="text-2xl font-bold text-white">Revenue Analytics</h2>
                <p className="text-sm text-slate-500 mt-0.5">Financial overview and projections</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Annual License Revenue", value: fmt(stats.revenueYearly), icon: TrendingUp, color: "from-emerald-500 to-green-600" },
                  { label: "Monthly Maintenance", value: fmt(stats.revenueMonthly) + "/mo", icon: CreditCard, color: "from-blue-500 to-indigo-600" },
                  { label: "Projected Annual", value: fmt(stats.revenueYearly + stats.revenueMonthly * 12), icon: BarChart3, color: "from-purple-500 to-pink-600" },
                  { label: "Platform Sales Volume", value: fmt(totalSales), icon: Wallet, color: "from-amber-500 to-orange-600" },
                ].map((s, i) => (
                  <Card key={i} className="bg-slate-900/50 border-white/5">
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[11px] text-slate-500">{s.label}</p>
                          <p className="text-xl font-bold text-white mt-1">{s.value}</p>
                        </div>
                        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                          <s.icon className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Revenue by package */}
              <Card className="bg-slate-900/50 border-white/5">
                <CardHeader>
                  <CardTitle className="text-base text-white">Revenue by Package</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/5">
                        <TableHead className="text-slate-400">Package</TableHead>
                        <TableHead className="text-slate-400">Active Subscribers</TableHead>
                        <TableHead className="text-slate-400">Annual Rate</TableHead>
                        <TableHead className="text-slate-400">Monthly Maint.</TableHead>
                        <TableHead className="text-slate-400">Total Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {packages.filter(p => p.is_active).map(p => {
                        const subs = hospitals.filter(h => h.license_status === "active" && (h as any).license_packages?.name === p.name).length;
                        return (
                          <TableRow key={p.id} className="border-white/5">
                            <TableCell className="text-sm font-medium text-white">{p.display_name}</TableCell>
                            <TableCell className="text-sm text-slate-300">{subs}</TableCell>
                            <TableCell className="text-sm text-slate-300">{fmt(p.price_yearly || 0)}</TableCell>
                            <TableCell className="text-sm text-slate-300">{fmt(p.maintenance_monthly || 3000)}</TableCell>
                            <TableCell className="text-sm font-semibold text-emerald-400">{fmt(subs * ((p.price_yearly || 0) + (p.maintenance_monthly || 3000) * 12))}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}

          {/* HOSPITALS TAB */}
          {tab === "hospitals" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Hospital Management</h2>
                  <p className="text-sm text-slate-500">{filteredH.length} hospital(s)</p>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-36 bg-slate-800 border-white/10 text-slate-300 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="grace">Grace</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input className="pl-9 bg-slate-800 border-white/10 text-white h-9" placeholder="Search hospitals..." value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                {filteredH.map(h => {
                  const trialDays = h.trial_ends_at ? Math.max(0, differenceInDays(new Date(h.trial_ends_at), new Date())) : null;
                  return (
                    <Card key={h.id} className="bg-slate-900/50 border-white/5 hover:border-white/10 transition-all cursor-pointer group" onClick={() => fetchHospitalDetail(h)}>
                      <CardContent className="py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center shrink-0">
                            <Building2 className="h-6 w-6 text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-white">{h.name}</p>
                              <StatusDot status={h.license_status} />
                              {h.license_status === "trial" && trialDays !== null && (
                                <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-400">{trialDays}d left</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1">
                              {h.email && <span className="text-[11px] text-slate-500 flex items-center gap-1"><Mail className="h-3 w-3" />{h.email}</span>}
                              {h.city && <span className="text-[11px] text-slate-500 flex items-center gap-1"><MapPin className="h-3 w-3" />{h.city}</span>}
                              {h.phone && <span className="text-[11px] text-slate-500 flex items-center gap-1"><Phone className="h-3 w-3" />{h.phone}</span>}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-slate-400">{(h as any).license_packages?.display_name || "Trial"}</p>
                            <p className="text-[10px] text-slate-600">{h.created_at ? format(new Date(h.created_at), "MMM d, yyyy") : ""}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button size="sm" variant={h.license_status === "suspended" ? "default" : "destructive"} className="h-8 text-[11px] gap-1" onClick={(e) => { e.stopPropagation(); toggleSuspend(h); }}>
                              {h.license_status === "suspended" ? <><Unlock className="h-3 w-3" /> Activate</> : <><Lock className="h-3 w-3" /> Suspend</>}
                            </Button>
                            <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {filteredH.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No hospitals match your search.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* HOSPITAL DETAIL TAB */}
          {tab === "hospital-detail" && selectedHospital && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white gap-1" onClick={() => setTab("hospitals")}>
                  ← Back
                </Button>
              </div>

              {/* Hospital Header */}
              <div className="flex items-start gap-6">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white">{selectedHospital.name}</h2>
                    <StatusDot status={selectedHospital.license_status} />
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    {selectedHospital.email && <span className="text-sm text-slate-500 flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{selectedHospital.email}</span>}
                    {selectedHospital.city && <span className="text-sm text-slate-500 flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{selectedHospital.city}</span>}
                    {selectedHospital.phone && <span className="text-sm text-slate-500 flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{selectedHospital.phone}</span>}
                  </div>
                </div>
                <Button size="sm" variant={selectedHospital.license_status === "suspended" ? "default" : "destructive"} className="gap-1" onClick={() => toggleSuspend(selectedHospital)}>
                  {selectedHospital.license_status === "suspended" ? <><Unlock className="h-3.5 w-3.5" /> Reactivate</> : <><Lock className="h-3.5 w-3.5" /> Suspend</>}
                </Button>
              </div>

              {/* Hospital Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: Users, label: "Staff Members", value: hospitalStats.staffCount, color: "from-blue-500 to-cyan-500" },
                  { icon: Heart, label: "Patients", value: hospitalStats.patientCount, color: "from-pink-500 to-rose-500" },
                  { icon: Pill, label: "Pharmacy Sales", value: hospitalStats.salesCount, color: "from-emerald-500 to-green-500" },
                  { icon: CreditCard, label: "Bills Generated", value: hospitalStats.billsCount, color: "from-purple-500 to-indigo-500" },
                ].map((s, i) => (
                  <Card key={i} className="bg-slate-900/50 border-white/5">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                          <s.icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xl font-bold text-white">{s.value}</p>
                          <p className="text-[10px] text-slate-500">{s.label}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* License Info */}
              <Card className="bg-slate-900/50 border-white/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-white flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-amber-400" /> License Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Package", value: (selectedHospital as any).license_packages?.display_name || "Trial" },
                      { label: "Status", value: selectedHospital.license_status.charAt(0).toUpperCase() + selectedHospital.license_status.slice(1) },
                      { label: "Started", value: selectedHospital.license_started_at ? format(new Date(selectedHospital.license_started_at), "MMM d, yyyy") : "—" },
                      { label: "Expires", value: selectedHospital.license_expires_at ? format(new Date(selectedHospital.license_expires_at), "MMM d, yyyy") : selectedHospital.trial_ends_at ? format(new Date(selectedHospital.trial_ends_at), "MMM d, yyyy") + " (Trial)" : "—" },
                    ].map((info, i) => (
                      <div key={i} className="bg-white/5 rounded-lg p-3">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{info.label}</p>
                        <p className="text-sm font-semibold text-white mt-1">{info.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* License & Trial Management — Platform Admin Override */}
              <Card className="bg-slate-900/50 border-amber-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-white flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-amber-400" /> License & Trial Management
                    <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-400 ml-auto">PLATFORM ADMIN OVERRIDE</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Editable fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-slate-400 uppercase tracking-wider">Trial Ends</Label>
                      <DateEditField
                        className="h-8 text-xs bg-white/5 border-white/10 text-white"
                        value={selectedHospital.trial_ends_at}
                        onCommit={async (val) => {
                          const ok = await confirm({
                            title: "Update trial end date?",
                            description: `Set trial end to ${val ? format(new Date(val), "MMM d, yyyy") : "(cleared)"} for "${selectedHospital.name}"?`,
                            confirmLabel: "Yes, Update",
                          });
                          if (!ok) { fetchHospitalDetail(selectedHospital); return; }
                          await supabase.from("hospitals").update({ trial_ends_at: val } as any).eq("id", selectedHospital.id);
                          await supabase.from("license_audit_log").insert({
                            hospital_id: selectedHospital.id, action: "TRIAL_DATE_EDITED",
                            details: `Trial end date set to ${val ? format(new Date(val), "MMM d, yyyy") : "null"} by platform admin`,
                            performed_by: staff?.id,
                          });
                          toast({ title: "✅ Trial Date Updated" });
                          fetchHospitalDetail(selectedHospital);
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-slate-400 uppercase tracking-wider">License Expires</Label>
                      <DateEditField
                        className="h-8 text-xs bg-white/5 border-white/10 text-white"
                        value={selectedHospital.license_expires_at}
                        onCommit={async (val) => {
                          const ok = await confirm({
                            title: "Update license expiry?",
                            description: `Set license expiry to ${val ? format(new Date(val), "MMM d, yyyy") : "(cleared)"} for "${selectedHospital.name}"?`,
                            confirmLabel: "Yes, Update",
                          });
                          if (!ok) { fetchHospitalDetail(selectedHospital); return; }
                          await supabase.from("hospitals").update({ license_expires_at: val } as any).eq("id", selectedHospital.id);
                          await supabase.from("license_audit_log").insert({
                            hospital_id: selectedHospital.id, action: "LICENSE_EXPIRY_EDITED",
                            details: `License expiry set to ${val ? format(new Date(val), "MMM d, yyyy") : "null"} by platform admin`,
                            performed_by: staff?.id,
                          });
                          toast({ title: "✅ License Expiry Updated" });
                          fetchHospitalDetail(selectedHospital);
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-slate-400 uppercase tracking-wider">Maintenance Due</Label>
                      <DateEditField
                        className="h-8 text-xs bg-white/5 border-white/10 text-white"
                        value={selectedHospital.maintenance_due_at}
                        onCommit={async (val) => {
                          const ok = await confirm({
                            title: "Update maintenance due date?",
                            description: `Set maintenance due to ${val ? format(new Date(val), "MMM d, yyyy") : "(cleared)"} for "${selectedHospital.name}"?`,
                            confirmLabel: "Yes, Update",
                          });
                          if (!ok) { fetchHospitalDetail(selectedHospital); return; }
                          await supabase.from("hospitals").update({ maintenance_due_at: val } as any).eq("id", selectedHospital.id);
                          await supabase.from("license_audit_log").insert({
                            hospital_id: selectedHospital.id, action: "MAINTENANCE_DUE_EDITED",
                            details: `Maintenance due set to ${val ? format(new Date(val), "MMM d, yyyy") : "null"} by platform admin`,
                            performed_by: staff?.id,
                          });
                          toast({ title: "✅ Maintenance Due Updated" });
                          fetchHospitalDetail(selectedHospital);
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-slate-400 uppercase tracking-wider">License Status</Label>
                      <Select
                        value={selectedHospital.license_status}
                        onValueChange={async (val) => {
                          if (val === selectedHospital.license_status) return;
                          const ok = await confirm({
                            title: "Change license status?",
                            description: `Change status of "${selectedHospital.name}" from "${selectedHospital.license_status}" to "${val}"?`,
                            confirmLabel: "Yes, Change",
                            destructive: val === "suspended" || val === "expired",
                          });
                          if (!ok) { fetchHospitalDetail(selectedHospital); return; }
                          await supabase.from("hospitals").update({ license_status: val } as any).eq("id", selectedHospital.id);
                          await supabase.from("license_audit_log").insert({
                            hospital_id: selectedHospital.id, action: "STATUS_CHANGED",
                            details: `License status changed to "${val}" by platform admin`,
                            performed_by: staff?.id,
                          });
                          toast({ title: "✅ Status Updated", description: `Now: ${val}` });
                          fetchHospitalDetail(selectedHospital);
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="trial">Trial</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="grace">Grace Period</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Account Active Toggle */}
                  <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                    <div>
                      <p className="text-xs font-semibold text-white">Account Active</p>
                      <p className="text-[10px] text-slate-400">When disabled, all hospital staff are locked out instantly.</p>
                    </div>
                    <Switch
                      checked={selectedHospital.is_active}
                      onCheckedChange={async (checked) => {
                        const ok = await confirm({
                          title: checked ? "Enable account?" : "Disable account?",
                          description: checked
                            ? `Re-enable "${selectedHospital.name}"? Staff will be able to log in again.`
                            : `Disable "${selectedHospital.name}"? All staff will be locked out instantly.`,
                          confirmLabel: checked ? "Yes, Enable" : "Yes, Disable",
                          destructive: !checked,
                        });
                        if (!ok) { fetchHospitalDetail(selectedHospital); return; }
                        await supabase.from("hospitals").update({ is_active: checked } as any).eq("id", selectedHospital.id);
                        await supabase.from("license_audit_log").insert({
                          hospital_id: selectedHospital.id, action: checked ? "ACCOUNT_ENABLED" : "ACCOUNT_DISABLED",
                          details: `Account ${checked ? "enabled" : "disabled"} by platform admin`,
                          performed_by: staff?.id,
                        });
                        toast({ title: checked ? "✅ Account Enabled" : "🔒 Account Disabled" });
                        fetchHospitalDetail(selectedHospital);
                      }}
                    />
                  </div>

                  {/* Quick Extend Buttons */}
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">Quick Extensions</p>
                    <div className="flex flex-wrap gap-2">
                      {[3, 7, 14, 30, 90].map((days) => (
                        <Button
                          key={days}
                          size="sm"
                          variant="outline"
                          className="h-8 text-[11px] gap-1.5 border-amber-500/20 text-amber-300 hover:text-white hover:bg-amber-500/10"
                          onClick={async () => {
                            const isTrial = selectedHospital.license_status === "trial";
                            const baseField = isTrial ? "trial_ends_at" : "license_expires_at";
                            const currentVal = isTrial ? selectedHospital.trial_ends_at : selectedHospital.license_expires_at;
                            const base = currentVal ? new Date(currentVal) : new Date();
                            // If already expired, extend from now; else extend from current date
                            const startFrom = base.getTime() < Date.now() ? new Date() : base;
                            const newDate = new Date(startFrom.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
                            const ok = await confirm({
                              title: `Extend by ${days} days?`,
                              description: `${isTrial ? "Trial" : "License"} for "${selectedHospital.name}" will be extended to ${format(new Date(newDate), "MMM d, yyyy")}.`,
                              confirmLabel: `Yes, Extend ${days}d`,
                            });
                            if (!ok) return;
                            const updates: any = { [baseField]: newDate };
                            // If license was expired and we're extending, restore to active/trial status
                            if (selectedHospital.license_status === "expired" || selectedHospital.license_status === "grace") {
                              updates.license_status = isTrial ? "trial" : "active";
                            }
                            await supabase.from("hospitals").update(updates).eq("id", selectedHospital.id);
                            await supabase.from("license_audit_log").insert({
                              hospital_id: selectedHospital.id,
                              action: isTrial ? "TRIAL_EXTENDED" : "LICENSE_EXTENDED",
                              details: `${isTrial ? "Trial" : "License"} extended by ${days} days by platform admin. New ${isTrial ? "trial end" : "expiry"}: ${format(new Date(newDate), "MMM d, yyyy")}`,
                              performed_by: staff?.id,
                            });
                            toast({ title: `✅ Extended ${days} Days`, description: `New ${isTrial ? "trial end" : "expiry"}: ${format(new Date(newDate), "MMM d, yyyy")}` });
                            fetchHospitalDetail(selectedHospital);
                          }}
                        >
                          <Clock className="h-3.5 w-3.5" /> +{days}d
                        </Button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2">
                      💡 Extends <span className="text-amber-400 font-semibold">{selectedHospital.license_status === "trial" ? "trial period" : "license expiry"}</span> based on current status. Auto-restores expired/grace accounts.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Maintenance Management */}
              <Card className="bg-slate-900/50 border-white/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-white flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-amber-400" /> Maintenance Management
                    <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-400 ml-auto">PLATFORM ADMIN</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const maintFee = (selectedHospital as any).license_packages?.maintenance_monthly ?? 3000;
                    const dueAt = selectedHospital.maintenance_due_at ? new Date(selectedHospital.maintenance_due_at) : null;
                    const lastPaid = selectedHospital.maintenance_last_paid_at ? new Date(selectedHospital.maintenance_last_paid_at) : null;
                    const now = new Date();
                    const daysLeft = dueAt ? Math.ceil((dueAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
                    const isOverdue = daysLeft !== null && daysLeft <= 0;
                    const isWarning = daysLeft !== null && daysLeft > 0 && daysLeft <= 7;

                    return (
                      <>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                          <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Maintenance Fee</p>
                            <p className="text-sm font-bold text-white mt-1">KES {maintFee.toLocaleString()}</p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Due Date</p>
                            <p className={`text-sm font-bold mt-1 ${isOverdue ? "text-red-400" : isWarning ? "text-amber-400" : "text-white"}`}>
                              {dueAt ? format(dueAt, "MMM d, yyyy") : "Not set"}
                            </p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Status</p>
                            <p className={`text-sm font-bold mt-1 ${isOverdue ? "text-red-400" : isWarning ? "text-amber-400" : "text-emerald-400"}`}>
                              {isOverdue ? `Overdue (${Math.abs(daysLeft!)}d)` : isWarning ? `Due in ${daysLeft}d` : daysLeft !== null ? `OK (${daysLeft}d)` : "N/A"}
                            </p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Last Paid</p>
                            <p className="text-sm font-bold text-white mt-1">{lastPaid ? format(lastPaid, "MMM d, yyyy") : "Never"}</p>
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          <Button size="sm" className="h-8 text-[11px] gap-1.5 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white border-0"
                            onClick={async () => {
                              const ok = await confirm({
                                title: "Mark maintenance as paid?",
                                description: `Manually mark maintenance as paid for "${selectedHospital.name}". Next due in 3 days. Continue?`,
                                confirmLabel: "Yes, Mark Paid",
                              });
                              if (!ok) return;
                              const newDue = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
                              await supabase.from("hospitals").update({
                                maintenance_due_at: newDue,
                                maintenance_last_paid_at: new Date().toISOString(),
                              } as any).eq("id", selectedHospital.id);
                              await supabase.from("license_audit_log").insert({
                                hospital_id: selectedHospital.id,
                                action: "MAINTENANCE_MARKED_PAID",
                                details: `Manually marked as paid by platform admin. Next due: ${format(new Date(newDue), "MMM d, yyyy")}`,
                                performed_by: staff?.id,
                              });
                              toast({ title: "✅ Maintenance Marked as Paid", description: "Next cycle due in 3 days." });
                              fetchHospitalDetail(selectedHospital);
                            }}
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Mark as Paid
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 text-[11px] gap-1.5 border-white/10 text-slate-300 hover:text-white"
                            onClick={async () => {
                              const ok = await confirm({
                                title: "Extend maintenance by 7 days?",
                                description: `Push maintenance due date forward by 7 days for "${selectedHospital.name}"?`,
                                confirmLabel: "Yes, Extend",
                              });
                              if (!ok) return;
                              const newDue = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
                              await supabase.from("hospitals").update({ maintenance_due_at: newDue } as any).eq("id", selectedHospital.id);
                              await supabase.from("license_audit_log").insert({
                                hospital_id: selectedHospital.id,
                                action: "MAINTENANCE_EXTENDED",
                                details: `Maintenance deadline extended by 7 days by platform admin`,
                                performed_by: staff?.id,
                              });
                              toast({ title: "✅ Maintenance Extended", description: "Due date pushed by 7 days." });
                              fetchHospitalDetail(selectedHospital);
                            }}
                          >
                            <Clock className="h-3.5 w-3.5" /> Extend 7 Days
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 text-[11px] gap-1.5 border-white/10 text-slate-300 hover:text-white"
                            onClick={async () => {
                              const ok = await confirm({
                                title: "Clear maintenance tracking?",
                                description: `This will clear the maintenance due date and last-paid record for "${selectedHospital.name}". Continue?`,
                                confirmLabel: "Yes, Clear",
                                destructive: true,
                              });
                              if (!ok) return;
                              await supabase.from("hospitals").update({ maintenance_due_at: null, maintenance_last_paid_at: null } as any).eq("id", selectedHospital.id);
                              await supabase.from("license_audit_log").insert({
                                hospital_id: selectedHospital.id,
                                action: "MAINTENANCE_CLEARED",
                                details: `Maintenance tracking cleared by platform admin`,
                                performed_by: staff?.id,
                              });
                              toast({ title: "Maintenance Cleared", description: "No maintenance tracking active." });
                              fetchHospitalDetail(selectedHospital);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Clear
                          </Button>
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
              <Card className="bg-slate-900/50 border-white/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-white flex items-center gap-2">
                    <Eye className="h-4 w-4 text-amber-400" /> Staff Credentials
                    <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-400 ml-auto">ADMIN ONLY</Badge>
                  </CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" className="h-7 text-[10px] gap-1.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white border-0" onClick={() => setShowAddHidden(true)}>
                      <Plus className="h-3 w-3" /> Add Hidden Staff
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/5">
                        <TableHead className="text-slate-400">Name</TableHead>
                        <TableHead className="text-slate-400">Username</TableHead>
                        <TableHead className="text-slate-400">Role</TableHead>
                        <TableHead className="text-slate-400">Password</TableHead>
                        <TableHead className="text-slate-400">Status</TableHead>
                        <TableHead className="text-slate-400">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hospitalStaffList.map((s: any) => (
                        <TableRow key={s.id} className={`border-white/5 ${s.is_hidden ? "bg-red-950/20" : ""}`}>
                          <TableCell className="text-slate-300 text-xs">
                            {s.first_name} {s.last_name}
                            {s.is_hidden && <Badge variant="outline" className="ml-1.5 text-[8px] border-red-500/30 text-red-400 py-0">HIDDEN</Badge>}
                          </TableCell>
                          <TableCell className="text-white font-mono text-xs">{s.username}</TableCell>
                          <TableCell className="text-slate-400 text-xs capitalize">{s.role?.replace(/_/g, " ")}</TableCell>
                          <TableCell className="text-amber-400 font-mono text-xs">{s.plain_password || "••••••••"}</TableCell>
                          <TableCell><Badge variant={s.is_active ? "default" : "secondary"} className="text-[9px]">{s.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost" className="h-6 text-[9px] gap-1 text-amber-400 hover:text-amber-300" disabled={resettingPw} onClick={() => { setConfirmResetId(s.id); setConfirmResetName(`${s.first_name} ${s.last_name}`); }}>
                              <RefreshCw className="h-3 w-3" /> Reset
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {hospitalStaffList.length === 0 && (
                        <TableRow className="border-white/5">
                          <TableCell colSpan={6} className="text-center text-slate-600 py-4">No staff found</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-white/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-white">Activity Log</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {auditLogs.filter(l => l.hospital_id === selectedHospital.id).slice(0, 10).map(log => (
                      <div key={log.id} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                        <div className="h-6 w-6 rounded-full bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                          <FileText className="h-3 w-3 text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-300">{log.action}</p>
                          {log.details && <p className="text-[10px] text-slate-600 truncate">{log.details}</p>}
                        </div>
                        <span className="text-[10px] text-slate-600 shrink-0">{log.created_at ? format(new Date(log.created_at), "MMM d, HH:mm") : ""}</span>
                      </div>
                    ))}
                    {auditLogs.filter(l => l.hospital_id === selectedHospital.id).length === 0 && (
                      <p className="text-sm text-slate-600 text-center py-4">No audit logs for this hospital.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* LICENSE KEYS TAB */}
          {tab === "keys" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">License Keys</h2>
                  <p className="text-sm text-slate-500">Generate and manage activation codes</p>
                </div>
                <Button onClick={() => { setShowGenerate(true); setGeneratedKeys([]); setGenPackage(""); setGenNotes(""); }} className="gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0">
                  <Plus className="h-4 w-4" /> Generate Keys
                </Button>
              </div>

              {/* Key stats */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Total Keys", value: licenseKeys.length, color: "text-white" },
                  { label: "Unused", value: licenseKeys.filter(k => k.status === "unused").length, color: "text-amber-400" },
                  { label: "Activated", value: licenseKeys.filter(k => k.status === "activated").length, color: "text-emerald-400" },
                  { label: "Revoked", value: licenseKeys.filter(k => k.status === "revoked").length, color: "text-red-400" },
                ].map((s, i) => (
                  <Card key={i} className="bg-slate-900/50 border-white/5">
                    <CardContent className="py-3 text-center">
                      <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-[10px] text-slate-500">{s.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-slate-900/50 border-white/5">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/5">
                        <TableHead className="text-slate-400">License Key</TableHead>
                        <TableHead className="text-slate-400">Package</TableHead>
                        <TableHead className="text-slate-400">Duration</TableHead>
                        <TableHead className="text-slate-400">Status</TableHead>
                        <TableHead className="text-slate-400">Hospital</TableHead>
                        <TableHead className="text-slate-400">Created</TableHead>
                        <TableHead className="text-slate-400">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {licenseKeys.slice(0, 50).map(k => (
                        <TableRow key={k.id} className="border-white/5">
                          <TableCell><code className="text-[11px] font-mono bg-white/5 px-2 py-0.5 rounded text-amber-300">{k.license_key}</code></TableCell>
                          <TableCell className="text-xs text-slate-300">{(k as any).license_packages?.display_name || "—"}</TableCell>
                          <TableCell className="text-xs text-slate-300">{k.duration_months}mo</TableCell>
                          <TableCell><StatusDot status={k.status === "unused" ? "trial" : k.status === "activated" ? "active" : "suspended"} /></TableCell>
                          <TableCell className="text-xs text-slate-300">{(k as any).hospitals?.name || "—"}</TableCell>
                          <TableCell className="text-xs text-slate-500">{k.created_at ? format(new Date(k.created_at), "MMM d, yyyy") : "—"}</TableCell>
                          <TableCell>
                            {k.status === "unused" && (
                              <Button size="sm" variant="destructive" className="h-7 text-[10px] gap-1" onClick={() => revokeKey(k.id)}>
                                <Ban className="h-3 w-3" /> Revoke
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {licenseKeys.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-600">No keys generated yet.</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* PACKAGES TAB */}
          {tab === "packages" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-white">License Packages</h2>
                <p className="text-sm text-slate-500">Manage pricing, features, and limits</p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {packages.filter(p => p.is_active).map(p => {
                  const colors: Record<string, string> = { basic: "from-emerald-500 to-teal-600", standard: "from-blue-500 to-indigo-600", premium: "from-purple-500 to-pink-600" };
                  const icons: Record<string, React.ReactNode> = { basic: <Shield className="h-6 w-6" />, standard: <Zap className="h-6 w-6" />, premium: <Sparkles className="h-6 w-6" /> };
                  const subs = hospitals.filter(h => h.license_status === "active" && (h as any).license_packages?.name === p.name).length;
                  return (
                    <Card key={p.id} className="bg-slate-900/50 border-white/5 hover:border-white/10 transition-all relative overflow-hidden">
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colors[p.name] || "from-gray-500 to-gray-600"}`} />
                      <CardHeader className="pb-3 pt-5">
                        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${colors[p.name] || "from-gray-500 to-gray-600"} text-white flex items-center justify-center mb-3 shadow-lg`}>
                          {icons[p.name] || <Package className="h-6 w-6" />}
                        </div>
                        <CardTitle className="text-lg text-white">{p.display_name}</CardTitle>
                        <CardDescription className="text-[11px] text-slate-500">{p.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-slate-500">Annual License</span><span className="font-bold text-white">KES {(p.price_yearly || 0).toLocaleString()}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Monthly Maint.</span><span className="font-bold text-white">KES {(p.maintenance_monthly || 3000).toLocaleString()}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Lifetime</span><span className="font-bold text-white">KES {(p.price_lifetime || 0).toLocaleString()}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Max Staff</span><span className="text-white">{p.max_staff || "∞"}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Subscribers</span><span className="font-bold text-amber-400">{subs}</span></div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full gap-1.5 border-white/10 text-slate-300 hover:text-white" onClick={() => openEditPkg(p)}>
                          <Edit className="h-3.5 w-3.5" /> Edit Package
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* AUDIT TAB */}
          {tab === "audit" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Audit Trail</h2>
                <p className="text-sm text-slate-500">Cross-hospital activity and license tracking</p>
              </div>
              <Card className="bg-slate-900/50 border-white/5">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/5">
                        <TableHead className="text-slate-400">Hospital</TableHead>
                        <TableHead className="text-slate-400">Action</TableHead>
                        <TableHead className="text-slate-400">Details</TableHead>
                        <TableHead className="text-slate-400">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map(log => (
                        <TableRow key={log.id} className="border-white/5">
                          <TableCell className="text-sm font-medium text-white">{(log as any).hospitals?.name || "System"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] border-white/10 text-slate-300">{log.action}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-slate-500 max-w-xs truncate">{log.details || "—"}</TableCell>
                          <TableCell className="text-xs text-slate-500">{log.created_at ? format(new Date(log.created_at), "MMM d, yyyy HH:mm") : "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* SYSTEM HEALTH TAB */}
          {tab === "system" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-white">System Health</h2>
                <p className="text-sm text-slate-500">Platform infrastructure monitoring</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: Server, label: "Database", status: "Operational", color: "text-emerald-400", bg: "bg-emerald-500/10" },
                  { icon: Globe, label: "API Gateway", status: "Operational", color: "text-emerald-400", bg: "bg-emerald-500/10" },
                  { icon: Shield, label: "Authentication", status: "Operational", color: "text-emerald-400", bg: "bg-emerald-500/10" },
                  { icon: Wifi, label: "Edge Functions", status: "Operational", color: "text-emerald-400", bg: "bg-emerald-500/10" },
                ].map((s, i) => (
                  <Card key={i} className="bg-slate-900/50 border-white/5">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                          <s.icon className={`h-5 w-5 ${s.color}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{s.label}</p>
                          <p className={`text-xs ${s.color}`}>● {s.status}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <Card className="bg-slate-900/50 border-white/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-white">Database Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { label: "Hospitals", count: stats.total },
                      { label: "Staff Records", count: totalStaff },
                      { label: "Patient Records", count: totalPatients },
                      { label: "License Keys", count: licenseKeys.length },
                      { label: "Audit Log Entries", count: auditLogs.length },
                    ].map(s => (
                      <div key={s.label} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                        <span className="text-sm text-slate-400">{s.label}</span>
                        <span className="text-sm font-mono font-bold text-white">{s.count.toLocaleString()}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border-white/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-white">Platform Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { label: "Default Departments", value: "50" },
                      { label: "Module Settings", value: "100+" },
                      { label: "Dropdown Options", value: "1000+" },
                      { label: "Role Permissions", value: "800+" },
                      { label: "Total Platform Defaults", value: "1,500+" },
                    ].map(s => (
                      <div key={s.label} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                        <span className="text-sm text-slate-400">{s.label}</span>
                        <span className="text-sm font-bold text-amber-400">{s.value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* M-PESA CONFIG TAB */}
          {tab === "mpesa" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">M-Pesa Payment Gateway</h2>
                <p className="text-sm text-slate-500">Configure M-Pesa API keys for each hospital</p>
              </div>

              <Card className="bg-slate-900/50 border-white/5">
                <CardHeader>
                  <CardTitle className="text-base text-white flex items-center gap-2"><Wallet className="h-4 w-4 text-emerald-400" /> Default BrightPay Configuration</CardTitle>
                  <CardDescription className="text-slate-500">These endpoints are used by all hospitals</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid lg:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-slate-300">Payment Endpoint</Label>
                      <Input className="bg-slate-800 border-white/10 text-white font-mono text-xs" value="https://ftwbfezbikovfzfbxvnn.supabase.co/functions/v1/endpoint-pay" readOnly />
                    </div>
                    <div>
                      <Label className="text-slate-300">Status Endpoint</Label>
                      <Input className="bg-slate-800 border-white/10 text-white font-mono text-xs" value="https://ftwbfezbikovfzfbxvnn.supabase.co/functions/v1/endpoint-status" readOnly />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-600">These are global defaults. Each hospital needs an API key configured below.</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-white/5">
                <CardHeader>
                  <CardTitle className="text-base text-white flex items-center gap-2"><Key className="h-4 w-4 text-amber-400" /> Configure Hospital API Key</CardTitle>
                  <CardDescription className="text-slate-500">Set the M-Pesa API key for a specific hospital</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Select Hospital</Label>
                    <Select value={mpesaHospitalId} onValueChange={async (hId) => {
                      setMpesaHospitalId(hId);
                      const { data } = await supabase.from("hospitals").select("settings").eq("id", hId).single();
                      const s = (data as any)?.settings || {};
                      setMpesaApiKey(s.mpesa_api_key || "");
                      setMpesaShortcode(s.mpesa_shortcode || "174379");
                    }}>
                      <SelectTrigger className="bg-slate-800 border-white/10 text-white"><SelectValue placeholder="Choose hospital..." /></SelectTrigger>
                      <SelectContent>
                        {hospitals.map(h => (
                          <SelectItem key={h.id} value={h.id}>{h.name} ({h.slug})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {mpesaHospitalId && (
                    <>
                      <div>
                        <Label className="text-slate-300">API Key (x-api-key header)</Label>
                        <Input className="bg-slate-800 border-white/10 text-white font-mono" value={mpesaApiKey} onChange={e => setMpesaApiKey(e.target.value)} placeholder="bp_ep_xxxxxxxxxxxx" />
                      </div>
                      <div>
                        <Label className="text-slate-300">Business Short Code</Label>
                        <Input className="bg-slate-800 border-white/10 text-white" value={mpesaShortcode} onChange={e => setMpesaShortcode(e.target.value)} />
                      </div>
                      <Button className="w-full bg-gradient-to-r from-emerald-500 to-green-500" disabled={mpesaSaving} onClick={saveMpesaForHospital}>
                        {mpesaSaving ? "Saving..." : "Save M-Pesa Config"}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-white/5">
                <CardHeader>
                  <CardTitle className="text-base text-white">Hospital M-Pesa Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/5">
                        <TableHead className="text-slate-400">Hospital</TableHead>
                        <TableHead className="text-slate-400">Status</TableHead>
                        <TableHead className="text-slate-400">Short Code</TableHead>
                        <TableHead className="text-slate-400">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hospitals.map(h => {
                        const s = (h as any).settings || {};
                        const configured = !!s.mpesa_api_key;
                        return (
                          <TableRow key={h.id} className="border-white/5">
                            <TableCell className="text-white text-sm">{h.name}</TableCell>
                            <TableCell>
                              <Badge className={configured ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}>
                                {configured ? "✅ Active" : "❌ Not Set"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-400 font-mono text-xs">{s.mpesa_shortcode || "—"}</TableCell>
                            <TableCell>
                              <Button size="sm" variant="ghost" className="text-amber-400 hover:text-amber-300 h-7 text-xs" onClick={async () => {
                                setMpesaHospitalId(h.id);
                                const { data } = await supabase.from("hospitals").select("settings").eq("id", h.id).single();
                                const settings = (data as any)?.settings || {};
                                setMpesaApiKey(settings.mpesa_api_key || "");
                                setMpesaShortcode(settings.mpesa_shortcode || "174379");
                              }}>
                                <Edit className="h-3 w-3 mr-1" /> Configure
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* SUPPORT SETTINGS TAB */}
          {tab === "support" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Support & Customer Care Settings</h2>
                <p className="text-sm text-slate-500">Configure contact details displayed across the platform</p>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="bg-slate-900/50 border-white/5">
                  <CardHeader>
                    <CardTitle className="text-base text-white flex items-center gap-2"><Mail className="h-4 w-4 text-amber-400" /> Contact Details</CardTitle>
                    <CardDescription className="text-slate-500">These appear on login, landing page, and footer</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-slate-300">Support Email</Label>
                      <Input className="bg-slate-800 border-white/10 text-white" value={supportSettings.support_email} onChange={e => setSupportSettings(s => ({ ...s, support_email: e.target.value }))} />
                    </div>
                    <div>
                      <Label className="text-slate-300">Support Phone 1</Label>
                      <Input className="bg-slate-800 border-white/10 text-white" value={supportSettings.support_phone} onChange={e => setSupportSettings(s => ({ ...s, support_phone: e.target.value }))} />
                    </div>
                    <div>
                      <Label className="text-slate-300">Support Phone 2</Label>
                      <Input className="bg-slate-800 border-white/10 text-white" value={supportSettings.support_phone_2} onChange={e => setSupportSettings(s => ({ ...s, support_phone_2: e.target.value }))} />
                    </div>
                    <div>
                      <Label className="text-slate-300">WhatsApp Customer Care</Label>
                      <Input className="bg-slate-800 border-white/10 text-white" value={supportSettings.whatsapp_number} onChange={e => setSupportSettings(s => ({ ...s, whatsapp_number: e.target.value }))} placeholder="+254 7XX XXX XXX" />
                    </div>
                    <div>
                      <Label className="text-slate-300">Emergency Line</Label>
                      <Input className="bg-slate-800 border-white/10 text-white" value={supportSettings.emergency_phone} onChange={e => setSupportSettings(s => ({ ...s, emergency_phone: e.target.value }))} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border-white/5">
                  <CardHeader>
                    <CardTitle className="text-base text-white flex items-center gap-2"><Globe className="h-4 w-4 text-amber-400" /> Business Info</CardTitle>
                    <CardDescription className="text-slate-500">Company presence and hours</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-slate-300">Website URL</Label>
                      <Input className="bg-slate-800 border-white/10 text-white" value={supportSettings.website_url} onChange={e => setSupportSettings(s => ({ ...s, website_url: e.target.value }))} />
                    </div>
                    <div>
                      <Label className="text-slate-300">Office Address</Label>
                      <Input className="bg-slate-800 border-white/10 text-white" value={supportSettings.office_address} onChange={e => setSupportSettings(s => ({ ...s, office_address: e.target.value }))} />
                    </div>
                    <div>
                      <Label className="text-slate-300">Working Hours</Label>
                      <Input className="bg-slate-800 border-white/10 text-white" value={supportSettings.working_hours} onChange={e => setSupportSettings(s => ({ ...s, working_hours: e.target.value }))} />
                    </div>
                    <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 mt-2" onClick={async () => {
                      await savePlatformSettings(supportSettings);
                      toast({ title: "✅ Support settings saved to database" });
                    }}>
                      Save Settings
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Live Preview */}
              <Card className="bg-slate-900/50 border-white/5">
                <CardHeader>
                  <CardTitle className="text-base text-white">Preview — Customer Care Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-400 text-sm border border-blue-500/20">
                      <Mail className="h-4 w-4" /> {supportSettings.support_email}
                    </span>
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 text-violet-400 text-sm border border-violet-500/20">
                      <Phone className="h-4 w-4" /> {supportSettings.support_phone}
                    </span>
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 text-sm border border-emerald-500/20">
                      <Info className="h-4 w-4" /> WhatsApp: {supportSettings.whatsapp_number}
                    </span>
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-400 text-sm border border-red-500/20">
                      <AlertCircle className="h-4 w-4" /> Emergency: {supportSettings.emergency_phone}
                    </span>
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-400 text-sm border border-amber-500/20">
                      <Clock className="h-4 w-4" /> {supportSettings.working_hours}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {tab === "announcements" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">📢 Announcements</h2>
              <p className="text-sm text-slate-400">Create and manage announcements visible across all user dashboards. Target specific roles or broadcast to everyone.</p>
              <AnnouncementManager />
            </div>
          )}
        </div>
      </main>

      {/* Generate Keys Dialog */}
      <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
        <DialogContent className="max-w-md bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white"><Key className="h-5 w-5 text-amber-400" /> Generate License Keys</DialogTitle>
          </DialogHeader>
          {generatedKeys.length === 0 ? (
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">Package *</Label>
                <Select value={genPackage} onValueChange={setGenPackage}>
                  <SelectTrigger className="bg-slate-800 border-white/10 text-white"><SelectValue placeholder="Select package" /></SelectTrigger>
                  <SelectContent>{packages.filter(p => p.is_active).map(p => <SelectItem key={p.id} value={p.id}>{p.display_name} — KES {(p.price_yearly || 0).toLocaleString()}/yr</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-300">Duration (months)</Label>
                  <Select value={genDuration} onValueChange={setGenDuration}>
                    <SelectTrigger className="bg-slate-800 border-white/10 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>{[1, 3, 6, 12, 24, 36].map(m => <SelectItem key={m} value={String(m)}>{m} month{m > 1 ? "s" : ""}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">Count</Label>
                  <Input type="number" className="bg-slate-800 border-white/10 text-white" value={genCount} onChange={e => setGenCount(e.target.value)} min={1} max={50} />
                </div>
              </div>
              <div>
                <Label className="text-slate-300">Notes</Label>
                <Input className="bg-slate-800 border-white/10 text-white" value={genNotes} onChange={e => setGenNotes(e.target.value)} placeholder="e.g. For City Hospital pilot" />
              </div>
              <Button className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500" onClick={handleGenerateKeys}><Key className="h-4 w-4" /> Generate</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">✅ {generatedKeys.length} key(s) generated.</p>
              <div className="bg-slate-800 rounded-lg p-3 max-h-48 overflow-auto space-y-1">
                {generatedKeys.map((k, i) => <code key={i} className="block text-sm font-mono text-amber-300">{k}</code>)}
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 gap-1" onClick={() => { navigator.clipboard.writeText(generatedKeys.join("\n")); toast({ title: "Copied" }); }}><Copy className="h-4 w-4" /> Copy All</Button>
                <Button variant="outline" className="flex-1 border-white/10 text-slate-300" onClick={() => { setShowGenerate(false); setGeneratedKeys([]); }}>Done</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Package Dialog */}
      <Dialog open={!!editPkg} onOpenChange={() => setEditPkg(null)}>
        <DialogContent className="max-w-md bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Edit {editPkg?.display_name}</DialogTitle>
            <DialogDescription className="text-slate-500">Update pricing, limits, and details</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-slate-300">Display Name</Label><Input className="bg-slate-800 border-white/10 text-white" value={editForm.display_name} onChange={e => setEditForm(f => ({ ...f, display_name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-slate-300">Annual License (KES)</Label><Input className="bg-slate-800 border-white/10 text-white" type="number" value={editForm.price_yearly} onChange={e => setEditForm(f => ({ ...f, price_yearly: e.target.value }))} /></div>
              <div><Label className="text-slate-300">Monthly Maint. (KES)</Label><Input className="bg-slate-800 border-white/10 text-white" type="number" value={editForm.maintenance_monthly} onChange={e => setEditForm(f => ({ ...f, maintenance_monthly: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-slate-300">Lifetime (KES)</Label><Input className="bg-slate-800 border-white/10 text-white" type="number" value={editForm.price_lifetime} onChange={e => setEditForm(f => ({ ...f, price_lifetime: e.target.value }))} /></div>
              <div><Label className="text-slate-300">Max Staff</Label><Input className="bg-slate-800 border-white/10 text-white" type="number" value={editForm.max_staff} onChange={e => setEditForm(f => ({ ...f, max_staff: e.target.value }))} /></div>
            </div>
            <div><Label className="text-slate-300">Description</Label><Textarea className="bg-slate-800 border-white/10 text-white" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
            <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500" onClick={savePackage}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Hidden Staff Dialog */}
      <Dialog open={showAddHidden} onOpenChange={setShowAddHidden}>
        <DialogContent className="max-w-md bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2"><Shield className="h-5 w-5 text-red-400" /> Add Hidden Staff</DialogTitle>
            <DialogDescription className="text-slate-500">This staff member will be invisible to the hospital admin. Only platform admins can see them.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-slate-300">First Name *</Label><Input className="bg-slate-800 border-white/10 text-white" value={hiddenForm.first_name} onChange={e => setHiddenForm(f => ({ ...f, first_name: e.target.value }))} /></div>
              <div><Label className="text-slate-300">Last Name *</Label><Input className="bg-slate-800 border-white/10 text-white" value={hiddenForm.last_name} onChange={e => setHiddenForm(f => ({ ...f, last_name: e.target.value }))} /></div>
            </div>
            <div>
              <Label className="text-slate-300">Username</Label>
              <Input className="bg-slate-800 border-white/10 text-white" value={hiddenForm.username} onChange={e => setHiddenForm(f => ({ ...f, username: e.target.value }))}
                placeholder={hiddenForm.first_name && hiddenForm.last_name ? `${hiddenForm.first_name}.${hiddenForm.last_name}`.toLowerCase() : "Auto-generated"} />
            </div>
            <div className="bg-amber-950/30 border border-amber-500/20 rounded-lg p-3 text-[11px] text-amber-300">
              <p className="font-semibold mb-1">🔑 Role: Hospital Admin</p>
              <p>This hidden staff will be created as a <strong>Hospital Admin</strong> with full access to all hospital features.</p>
            </div>
            <div className="bg-red-950/30 border border-red-500/20 rounded-lg p-3 text-[11px] text-red-300">
              <p className="font-semibold mb-1">⚠️ Hidden Staff Notice</p>
              <p>This account will have full access to the hospital but will NOT appear in the hospital admin's staff list. Default password: <code className="bg-red-900/50 px-1 rounded">changeme</code></p>
            </div>
            <Button className="w-full gap-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white" onClick={addHiddenStaff}>
              <Shield className="h-4 w-4" /> Add Hidden Staff
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Password Reset Dialog */}
      <Dialog open={!!confirmResetId} onOpenChange={(open) => { if (!open) setConfirmResetId(null); }}>
        <DialogContent className="max-w-sm bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2"><AlertCircle className="h-5 w-5 text-amber-400" /> Confirm Password Reset</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to reset the password for <strong className="text-white">{confirmResetName}</strong> to the default <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-400">changeme</code>?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="outline" className="border-white/10 text-slate-300" onClick={() => setConfirmResetId(null)} disabled={resettingPw}>Cancel</Button>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5" disabled={resettingPw} onClick={() => confirmResetId && resetStaffPassword(confirmResetId)}>
              <RefreshCw className={`h-3.5 w-3.5 ${resettingPw ? "animate-spin" : ""}`} /> {resettingPw ? "Resetting..." : "Reset Password"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
