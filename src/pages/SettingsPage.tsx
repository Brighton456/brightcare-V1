import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useAuth } from "@/contexts/AuthContext";
import { usePharmacy } from "@/contexts/PharmacyStore";
import { CSVImportModal } from "@/components/inventory/CSVImportModal";
import { ReceiptDesigner } from "@/components/settings/ReceiptDesigner";
import { clearDropdownCache } from "@/hooks/useDropdownOptions";
import { toast } from "@/hooks/use-toast";
import { isValidLicenseKeyFormat } from "@/utils/licenseKeys";
import { useHospital } from "@/contexts/HospitalContext";
import {
  Building2, Receipt, Database, Bell, Upload, Download, Shield, Palette,
  Users, Lock, CreditCard, Smartphone, Globe, FileText, Printer,
  Heart, Pill, FlaskConical, Bed, Calendar, Clock, Settings, Stethoscope,
  Mail, MessageSquare, Eye, Key, Server, HardDrive, AlertTriangle, CheckCircle,
  Plus, Trash2, ClipboardList, Layers, Power, Search,
} from "lucide-react";

const settingsSections = [
  { id: "profile" as const, label: "Hospital Profile", icon: Building2 },
  { id: "modules" as const, label: "Module Management", icon: Layers },
  { id: "receipt" as const, label: "Receipt Design", icon: Palette },
  { id: "roles" as const, label: "Roles & Access", icon: Shield },
  { id: "departments" as const, label: "Departments", icon: Building2 },
  { id: "billing" as const, label: "Billing & Payments", icon: CreditCard },
  { id: "clinical" as const, label: "Clinical Settings", icon: Stethoscope },
  { id: "pharmacy" as const, label: "Pharmacy Config", icon: Pill },
  { id: "dropdowns" as const, label: "Dropdown Catalogs", icon: ClipboardList },
  { id: "notifications" as const, label: "Notifications", icon: Bell },
  { id: "data" as const, label: "Data & Backup", icon: Database },
  { id: "security" as const, label: "Security", icon: Lock },
  { id: "branding" as const, label: "Branding", icon: Eye },
  { id: "system" as const, label: "System Info", icon: Server },
];

const ROLES_LIST = ["Super Admin", "Hospital Admin", "Doctor", "Nurse", "Receptionist", "Pharmacist", "Cashier", "Lab Technician", "Accountant", "Records Officer"];

// Default settings shape stored in hospitals.settings JSONB
const DEFAULT_SETTINGS: Record<string, any> = {
  // Billing
  billing_mode: "hybrid",
  cumulative_threshold: "50000",
  auto_bill_discharge: true,
  auto_verify_insurance: true,
  require_confirmation: true,
  pay_cash: true, pay_mpesa: true, pay_card: true, pay_credit: true,
  pay_gift: true, pay_account: true, pay_insurance: true, pay_installment: true,
  mpesa_endpoint: "",
  mpesa_api_key: "",
  mpesa_shortcode: "174379",
  // Clinical
  default_consultation_fee: "500",
  default_followup_fee: "300",
  default_emergency_fee: "1500",
  specialist_fee: "2000",
  drug_interaction_alerts: true,
  auto_bill_on_completion: true,
  require_vitals_before_consult: true,
  followup_reminders: true,
  // Ward
  general_ward_rate: "1000",
  private_room_rate: "5000",
  icu_rate: "15000",
  maternity_rate: "3000",
  // Pharmacy
  default_reorder_level: "10",
  expiry_alert_days: "90",
  max_discount_pct: "10",
  prescription_validation: true,
  auto_restock_alerts: true,
  batch_tracking: true,
  barcode_scanning: true,
  controlled_drug_tracking: true,
  allergy_cross_check: true,
  // Security
  two_factor_auth: false,
  session_timeout: true,
  password_complexity: true,
  login_rate_limiting: true,
  audit_trail: true,
  data_encryption: true,
  ip_whitelisting: false,
  api_access_keys: false,
  // Branding
  primary_color: "#1e40af",
  accent_color: "#059669",
  logo_url: "",
  favicon_url: "",
  terms_conditions: "All services subject to hospital policies...",
  privacy_policy: "Patient data is handled in accordance with HIPAA guidelines...",
  language: "en",
  // Notification channels
  sms_gateway: false,
  email_notifications: false,
  in_app_alerts: true,
  push_notifications: false,
};

export default function SettingsPage() {
  const { hospitalId, refreshHospital } = useHospital();
  const { staff } = useAuth();
  const navigate = useNavigate();
  const { notifications, updateNotifications } = usePharmacy();
  const [showImport, setShowImport] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("profile");
  const [departments, setDepartments] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [dropdownCategory, setDropdownCategory] = useState("prescription_frequency");
  const [dropdownItems, setDropdownItems] = useState<any[]>([]);
  const [newDropdownLabel, setNewDropdownLabel] = useState("");
  const [newDropdownValue, setNewDropdownValue] = useState("");
  const [modules, setModules] = useState<any[]>([]);
  const [moduleSearch, setModuleSearch] = useState("");
  const [moduleCategory, setModuleCategory] = useState("all");
  const [hospital, setHospital] = useState<any>(null);
  const [profileForm, setProfileForm] = useState({
    name: "", phone: "", email: "", city: "", address: "",
    license_number: "", tax_rate: "16", currency: "KES",
    invoice_prefix: "BILL-", receipt_prefix: "RCT-",
  });
  const [licenseKeyInput, setLicenseKeyInput] = useState("");
  const [activatingKey, setActivatingKey] = useState(false);
  // All settings stored in hospitals.settings JSONB
  const [settings, setSettings] = useState<Record<string, any>>({ ...DEFAULT_SETTINGS });
  const [savingSection, setSavingSection] = useState("");

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const normalizeTaxRate = (value: string, fallback = 16) => {
    const trimmed = `${value ?? ""}`.trim();
    if (!trimmed) return fallback;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const saveSettings = async (sectionName: string, keys?: string[]) => {
    if (!hospital?.id) { toast({ title: "No hospital context", variant: "destructive" }); return; }
    setSavingSection(sectionName);
    try {
      // Always re-read current settings from DB to avoid stale overwrites
      const { data: freshHospital } = await supabase.from("hospitals").select("settings").eq("id", hospital.id).single();
      const currentSettings = (freshHospital as any)?.settings || {};
      const updatedSettings = { ...currentSettings };
      const keysToSave = keys || Object.keys(settings);
      keysToSave.forEach(k => { updatedSettings[k] = settings[k]; });
      const { error } = await supabase.from("hospitals").update({
        settings: updatedSettings,
      } as any).eq("id", hospital.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      setHospital((prev: any) => ({ ...prev, settings: updatedSettings }));
      toast({ title: `✅ ${sectionName} Saved` });
    } finally {
      setSavingSection("");
    }
  };

  const fetchDropdowns = async (cat: string) => {
    const { data } = await supabase.from("dropdown_options").select("*").eq("hospital_id", hospitalId).eq("category", cat).order("sort_order");
    setDropdownItems(data || []);
  };

  useEffect(() => {
    const fetch = async () => {
      const hospitalId = staff?.hospital_id;
      const [dRes, sRes, mRes, hRes] = await Promise.all([
        supabase.from("departments").select("*").eq("hospital_id", hospitalId).order("name"),
        supabase.from("staff").select("*, departments(name)").eq("hospital_id", hospitalId).order("first_name"),
        supabase.from("module_settings").select("*").eq("hospital_id", hospitalId).order("category,module_name"),
        hospitalId ? supabase.from("hospitals").select("*, license_packages(display_name)").eq("id", hospitalId).single() : Promise.resolve({ data: null }),
      ]);
      if (dRes.data) setDepartments(dRes.data as any[]);
      if (sRes.data) setStaffList(sRes.data as any[]);
      if (mRes.data) setModules(mRes.data as any[]);
      if (hRes.data) {
        const h = hRes.data as any;
        setHospital(h);
        setProfileForm({
          name: h.name || "", phone: h.phone || "", email: h.email || "",
          city: h.city || "", address: h.address || "",
          license_number: (h.settings as any)?.license_number || "",
          tax_rate: String(h.tax_rate ?? 16), currency: h.currency || "KES",
          invoice_prefix: h.invoice_prefix || "BILL-", receipt_prefix: h.receipt_prefix || "RCT-",
        });
        // Load saved settings from JSONB
        const saved = h.settings || {};
        setSettings(prev => ({ ...prev, ...saved }));
      }
    };
    fetch();
  }, [staff?.hospital_id]);

  useEffect(() => { fetchDropdowns(dropdownCategory); }, [dropdownCategory]);

  const toggleModule = async (id: string, current: boolean) => {
    await supabase.from("module_settings").update({ is_enabled: !current, updated_at: new Date().toISOString() } as any).eq("id", id);
    setModules(prev => prev.map(m => m.id === id ? { ...m, is_enabled: !current } : m));
    toast({ title: `Module ${!current ? "enabled" : "disabled"}` });
  };

  const toggleCategoryModules = async (category: string, enable: boolean) => {
    const catModules = modules.filter(m => m.category === category);
    for (const m of catModules) {
      await supabase.from("module_settings").update({ is_enabled: enable } as any).eq("id", m.id);
    }
    setModules(prev => prev.map(m => m.category === category ? { ...m, is_enabled: enable } : m));
    toast({ title: `All ${category} modules ${enable ? "enabled" : "disabled"}` });
  };

  const addDropdownItem = async () => {
    if (!newDropdownLabel) return;
    const val = newDropdownValue || newDropdownLabel.toLowerCase().replace(/[^a-z0-9]/g, "_");
    await supabase.from("dropdown_options").insert({ category: dropdownCategory, label: newDropdownLabel, value: val, sort_order: dropdownItems.length + 1 , hospital_id: hospitalId } as any);
    setNewDropdownLabel(""); setNewDropdownValue("");
    clearDropdownCache(dropdownCategory);
    fetchDropdowns(dropdownCategory);
    toast({ title: "Dropdown option added" });
  };

  const removeDropdownItem = async (id: string) => {
    await supabase.from("dropdown_options").delete().eq("id", id);
    clearDropdownCache(dropdownCategory);
    fetchDropdowns(dropdownCategory);
    toast({ title: "Option removed" });
  };

  const saveHospitalProfile = async () => {
    if (!hospital?.id) {
      toast({ title: "No hospital context", variant: "destructive" });
      return;
    }

    const fallbackTaxRate = typeof hospital?.tax_rate === "number" ? hospital.tax_rate : 16;
    const normalizedTaxRate = normalizeTaxRate(profileForm.tax_rate, fallbackTaxRate);

    const { data: freshHospital, error: freshError } = await supabase
      .from("hospitals")
      .select("settings")
      .eq("id", hospital.id)
      .single();

    if (freshError) {
      toast({ title: "Error", description: freshError.message, variant: "destructive" });
      return;
    }

    const currentSettings = (freshHospital as any)?.settings || {};
    const currentReceiptConfig = currentSettings?.receipt_config && typeof currentSettings.receipt_config === "object"
      ? currentSettings.receipt_config
      : {};

    const mergedSettings = {
      ...currentSettings,
      license_number: profileForm.license_number,
      receipt_config: {
        ...currentReceiptConfig,
        taxRate: normalizedTaxRate,
        currency: profileForm.currency || currentReceiptConfig.currency || "KES",
      },
    };

    const { data: updatedHospital, error } = await supabase
      .from("hospitals")
      .update({
        name: profileForm.name,
        phone: profileForm.phone,
        email: profileForm.email,
        city: profileForm.city,
        address: profileForm.address,
        tax_rate: normalizedTaxRate,
        currency: profileForm.currency,
        invoice_prefix: profileForm.invoice_prefix,
        receipt_prefix: profileForm.receipt_prefix,
        settings: mergedSettings,
      } as any)
      .eq("id", hospital.id)
      .select("*")
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    setHospital((prev: any) => ({
      ...prev,
      ...(updatedHospital || {}),
      settings: mergedSettings,
      tax_rate: normalizedTaxRate,
    }));

    setSettings(prev => ({
      ...prev,
      receipt_config: {
        ...(prev.receipt_config || {}),
        ...mergedSettings.receipt_config,
      },
    }));

    setProfileForm(prev => ({
      ...prev,
      tax_rate: String(normalizedTaxRate),
    }));

    await refreshHospital();
    toast({ title: "✅ Hospital Profile Saved", description: `Tax rate updated to ${normalizedTaxRate}%` });
  };

  const handleExportAll = async () => {
    toast({ title: "Export Started", description: "Preparing full data export..." });
    try {
      const tables = ["patients", "medicines", "bills", "bill_items", "consultations", "prescriptions", "prescription_items", "lab_tests", "admissions", "pharmacy_sales", "pharmacy_sale_items", "appointments", "staff"];
      const allData: Record<string, any[]> = {};
      await Promise.all(tables.map(async (t) => {
        const { data } = await supabase.from(t as any).select("*").eq("hospital_id", hospitalId).limit(5000);
        if (data && data.length > 0) allData[t] = data;
      }));
      // Export each table as a separate CSV download
      const { exportToCSV } = await import("@/utils/exportUtils");
      let exported = 0;
      for (const [table, rows] of Object.entries(allData)) {
        if (rows.length > 0) {
          exportToCSV(rows, `export-${table}-${new Date().toISOString().split("T")[0]}`);
          exported++;
        }
      }
      if (exported === 0) {
        toast({ title: "No Data", description: "No data found to export.", variant: "destructive" });
      } else {
        toast({ title: "✅ Export Complete", description: `${exported} table(s) exported as CSV files.` });
      }
    } catch (e: any) {
      toast({ title: "Export Failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <AppLayout title="Settings">
      <div className="flex gap-4 max-w-6xl">
        {/* Settings Navigation */}
        <div className="w-56 shrink-0 hidden lg:block">
          <div className="space-y-0.5 sticky top-4">
            {settingsSections.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                  activeSection === s.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}>
                <s.icon className="h-4 w-4" />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile nav */}
        <div className="lg:hidden w-full">
          <Select value={activeSection} onValueChange={setActiveSection}>
            <SelectTrigger className="mb-4"><SelectValue /></SelectTrigger>
            <SelectContent>
              {settingsSections.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4 min-w-0">
          {activeSection === "profile" && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Building2 className="h-4 w-4" />Hospital Profile</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div><Label>Hospital Name</Label><Input value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} /></div>
                    <div><Label>Phone Number</Label><Input value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} /></div>
                    <div><Label>Email</Label><Input value={profileForm.email} onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))} /></div>
                    <div><Label>City</Label><Input value={profileForm.city} onChange={e => setProfileForm(f => ({ ...f, city: e.target.value }))} /></div>
                    <div><Label>License Number</Label><Input value={profileForm.license_number} onChange={e => setProfileForm(f => ({ ...f, license_number: e.target.value }))} /></div>
                    <div><Label>Tax Rate (%)</Label><Input value={profileForm.tax_rate} onChange={e => setProfileForm(f => ({ ...f, tax_rate: e.target.value }))} type="number" /></div>
                    <div><Label>Currency</Label><Input value={profileForm.currency} onChange={e => setProfileForm(f => ({ ...f, currency: e.target.value }))} /></div>
                    <div><Label>Invoice Prefix</Label><Input value={profileForm.invoice_prefix} onChange={e => setProfileForm(f => ({ ...f, invoice_prefix: e.target.value }))} /></div>
                    <div className="md:col-span-2"><Label>Address</Label><Textarea value={profileForm.address} onChange={e => setProfileForm(f => ({ ...f, address: e.target.value }))} /></div>
                  </div>
                  <Button size="sm" onClick={saveHospitalProfile}>Save Changes</Button>
                </CardContent>
              </Card>

              {/* License Key Activation */}
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Key className="h-4 w-4" />License & Activation</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Status</span>
                      <Badge variant={hospital?.license_status === "active" ? "default" : hospital?.license_status === "trial" ? "secondary" : "destructive"}>
                        {hospital?.license_status || "Unknown"}
                      </Badge>
                    </div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Package</span><span className="font-medium">{(hospital as any)?.license_packages?.display_name || "None"}</span></div>
                    {hospital?.license_expires_at && <div className="flex justify-between"><span className="text-muted-foreground">Expires</span><span className="font-medium">{new Date(hospital.license_expires_at).toLocaleDateString()}</span></div>}
                    {hospital?.trial_ends_at && hospital?.license_status === "trial" && <div className="flex justify-between"><span className="text-muted-foreground">Trial Ends</span><span className="font-medium">{new Date(hospital.trial_ends_at).toLocaleDateString()}</span></div>}
                  </div>
                  <div>
                    <Label>Activate License Key</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={licenseKeyInput}
                        onChange={e => setLicenseKeyInput(e.target.value.toUpperCase())}
                        placeholder="XXXX-XXXX-XXXX-XXXX"
                        className="font-mono"
                        maxLength={19}
                      />
                      <Button disabled={activatingKey || !licenseKeyInput} onClick={async () => {
                        if (!isValidLicenseKeyFormat(licenseKeyInput)) {
                          toast({ title: "Invalid format", description: "Key must be XXXX-XXXX-XXXX-XXXX", variant: "destructive" });
                          return;
                        }
                        setActivatingKey(true);
                        try {
                          const { data: keyRow, error: keyErr } = await supabase
                            .from("license_keys")
                            .select("*, license_packages(id, display_name, allowed_modules)")
                            .eq("license_key", licenseKeyInput)
                            .single();
                          if (keyErr || !keyRow) { toast({ title: "Invalid key", description: "This license key was not found.", variant: "destructive" }); return; }
                          if ((keyRow as any).status !== "unused") { toast({ title: "Key already used", description: `This key is ${(keyRow as any).status}.`, variant: "destructive" }); return; }

                          const now = new Date();
                          const expires = new Date(now);
                          expires.setMonth(expires.getMonth() + ((keyRow as any).duration_months || 1));

                          // Activate the key
                          await supabase.from("license_keys").update({
                            status: "activated",
                            hospital_id: hospital.id,
                            activated_at: now.toISOString(),
                            expires_at: expires.toISOString(),
                          } as any).eq("id", (keyRow as any).id);

                          // Update hospital
                          await supabase.from("hospitals").update({
                            license_status: "active",
                            license_package_id: (keyRow as any).package_id,
                            license_started_at: now.toISOString(),
                            license_expires_at: expires.toISOString(),
                            license_key: licenseKeyInput,
                          } as any).eq("id", hospital.id);

                          // Audit log
                          await supabase.from("license_audit_log").insert({
                            hospital_id: hospital.id,
                            action: "LICENSE_ACTIVATED",
                            details: `License key ${licenseKeyInput} activated. Package: ${(keyRow as any).license_packages?.display_name}. Expires: ${expires.toLocaleDateString()}`,
                            performed_by: staff?.id,
                          });

                          toast({ title: "🎉 License Activated!", description: `${(keyRow as any).license_packages?.display_name} activated until ${expires.toLocaleDateString()}` });
                          setLicenseKeyInput("");
                          // Reload
                          window.location.reload();
                        } catch (err: any) {
                          toast({ title: "Activation Error", description: err.message, variant: "destructive" });
                        } finally {
                          setActivatingKey(false);
                        }
                      }}>
                        {activatingKey ? "Activating..." : "Activate"}
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Enter the activation code provided by your vendor to unlock your license.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "modules" && (() => {
            const categories = [...new Set(modules.map(m => m.category))];
            const filtered = modules.filter(m => {
              const matchSearch = !moduleSearch || m.module_name.toLowerCase().includes(moduleSearch.toLowerCase()) || m.module_key.toLowerCase().includes(moduleSearch.toLowerCase());
              const matchCat = moduleCategory === "all" || m.category === moduleCategory;
              return matchSearch && matchCat;
            });
            const grouped = filtered.reduce((acc: Record<string, any[]>, m: any) => {
              if (!acc[m.category]) acc[m.category] = [];
              acc[m.category].push(m);
              return acc;
            }, {});
            const enabledCount = modules.filter(m => m.is_enabled).length;
            return (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2"><Layers className="h-4 w-4" />Module Management</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-muted-foreground">Enable or disable system modules. Disabled modules will be hidden from all users across the platform.</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="relative flex-1 min-w-[12rem]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search modules..." value={moduleSearch} onChange={e => setModuleSearch(e.target.value)} className="pl-10 h-9" />
                      </div>
                      <Select value={moduleCategory} onValueChange={setModuleCategory}>
                        <SelectTrigger className="w-48 h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <div className="text-xs text-muted-foreground"><span className="font-bold text-foreground">{enabledCount}</span> / {modules.length} active</div>
                    </div>
                  </CardContent>
                </Card>
                {Object.entries(grouped).map(([category, mods]) => {
                  const catEnabled = (mods as any[]).filter((m: any) => m.is_enabled).length;
                  return (
                    <Card key={category}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Power className="h-4 w-4" />
                            {category}
                            <Badge variant="outline" className="text-[10px] ml-1">{catEnabled}/{(mods as any[]).length}</Badge>
                          </CardTitle>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => toggleCategoryModules(category, true)}>Enable All</Button>
                            <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => toggleCategoryModules(category, false)}>Disable All</Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(mods as any[]).map((m: any) => (
                            <div key={m.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${m.is_enabled ? "bg-card" : "bg-muted/50 opacity-60"}`}>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold truncate">{m.module_name}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{m.description || m.module_key}</p>
                              </div>
                              <Switch checked={m.is_enabled} onCheckedChange={() => toggleModule(m.id, m.is_enabled)} />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            );
          })()}

          {activeSection === "receipt" && <ReceiptDesigner />}

          {activeSection === "roles" && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" />User Roles & Access Control</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-start justify-between gap-3 mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="text-xs">
                      <p className="font-semibold text-foreground mb-0.5">Permission changes are saved in the Role Permissions editor.</p>
                      <p className="text-muted-foreground">Toggle feature access, page visibility and per-role rules. Changes apply immediately after Save and take effect on the user's next page load.</p>
                    </div>
                    <Button size="sm" onClick={() => navigate("/role-permissions")} className="gap-1 shrink-0">
                      <Shield className="h-3.5 w-3.5" /> Open Editor
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {ROLES_LIST.map(role => (
                      <div key={role} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                        <div>
                          <p className="text-sm font-semibold">{role}</p>
                          <p className="text-xs text-muted-foreground">
                            {role === "Super Admin" ? "Full access to all modules" :
                             role === "Doctor" ? "Consultations, prescriptions, lab requests" :
                             role === "Nurse" ? "Inpatient care, vitals, nursing notes" :
                             role === "Pharmacist" ? "POS, medicines, inventory" :
                             role === "Cashier" ? "POS, billing, payments" :
                             role === "Lab Technician" ? "Lab tests, results, sample management" :
                             role === "Receptionist" ? "Patient registration, appointments" :
                             role === "Accountant" ? "Billing, reports, financial analytics" :
                             role === "Records Officer" ? "Patient records, discharge summaries" :
                             "Department & staff management"}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] gap-1"
                          onClick={() => {
                            const roleKey = role.toLowerCase().replace(/\s+/g, "_");
                            navigate(`/role-permissions?role=${roleKey}`);
                          }}
                        >
                          Configure
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Staff Accounts ({staffList.length})</CardTitle></CardHeader>
                <CardContent className="p-0 overflow-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-semibold">Staff</th>
                      <th className="text-left p-3 font-semibold">Role</th>
                      <th className="text-left p-3 font-semibold">Department</th>
                      <th className="text-left p-3 font-semibold">Status</th>
                    </tr></thead>
                    <tbody>
                      {staffList.map((s: any) => (
                        <tr key={s.id} className="border-b hover:bg-muted/30">
                          <td className="p-3 font-semibold">{s.first_name} {s.last_name}</td>
                          <td className="p-3 capitalize">{(s.role || "").replace("_", " ")}</td>
                          <td className="p-3">{s.departments?.name || "—"}</td>
                          <td className="p-3"><Badge variant={s.is_active ? "default" : "secondary"} className="text-[10px]">{s.is_active ? "Active" : "Inactive"}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "departments" && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Building2 className="h-4 w-4" />Department Configuration</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {departments.map(d => (
                    <div key={d.id} className="p-3 rounded-lg border flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{d.name}</p>
                        <p className="text-xs text-muted-foreground">{d.description || "No description"}</p>
                        {d.head_name && <p className="text-xs text-muted-foreground">Head: {d.head_name}</p>}
                      </div>
                      <Badge variant={d.is_active ? "default" : "secondary"} className="text-[10px]">{d.is_active ? "Active" : "Inactive"}</Badge>
                    </div>
                  ))}
                  {departments.length === 0 && <p className="text-sm text-muted-foreground col-span-2 text-center py-6">No departments. Create them in Admin Panel.</p>}
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "billing" && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><CreditCard className="h-4 w-4" />Billing Strategy</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Billing Mode</Label>
                    <Select value={settings.billing_mode} onValueChange={v => updateSetting("billing_mode", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realtime">Real-time — Pay after each service</SelectItem>
                        <SelectItem value="cumulative">Cumulative — Pay at discharge</SelectItem>
                        <SelectItem value="hybrid">Hybrid — Partial payments during stay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div><Label>Cumulative Threshold (KES)</Label><Input value={settings.cumulative_threshold} onChange={e => updateSetting("cumulative_threshold", e.target.value)} type="number" /></div>
                    <div><Label>Default Tax Rate (%)</Label><Input value={profileForm.tax_rate} onChange={e => setProfileForm(f => ({ ...f, tax_rate: e.target.value }))} type="number" /></div>
                    <div><Label>Currency</Label><Input value={profileForm.currency} onChange={e => setProfileForm(f => ({ ...f, currency: e.target.value }))} /></div>
                    <div><Label>Invoice Prefix</Label><Input value={profileForm.invoice_prefix} onChange={e => setProfileForm(f => ({ ...f, invoice_prefix: e.target.value }))} /></div>
                    <div><Label>Receipt Prefix</Label><Input value={profileForm.receipt_prefix} onChange={e => setProfileForm(f => ({ ...f, receipt_prefix: e.target.value }))} /></div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { key: "auto_bill_discharge", label: "Auto-generate Bill on Discharge", desc: "Consolidate all charges when patient is discharged" },
                      { key: "auto_verify_insurance", label: "Auto-verify Insurance", desc: "Check coverage before service delivery" },
                      { key: "require_confirmation", label: "Require Payment Confirmation", desc: "Prompt seller to confirm payment before marking paid" },
                    ].map(m => (
                      <div key={m.key} className="flex items-center justify-between p-3 rounded-lg border">
                        <div><p className="text-sm font-medium">{m.label}</p><p className="text-xs text-muted-foreground">{m.desc}</p></div>
                        <Switch checked={!!settings[m.key]} onCheckedChange={v => updateSetting(m.key, v)} />
                      </div>
                    ))}
                  </div>
                  <Button size="sm" disabled={savingSection === "Billing Strategy"} onClick={async () => {
                    if (hospital?.id) {
                      await supabase.from("hospitals").update({ tax_rate: parseFloat(profileForm.tax_rate) || 16, currency: profileForm.currency, invoice_prefix: profileForm.invoice_prefix, receipt_prefix: profileForm.receipt_prefix } as any).eq("id", hospital.id);
                    }
                    await saveSettings("Billing Strategy", ["billing_mode","cumulative_threshold","auto_bill_discharge","auto_verify_insurance","require_confirmation"]);
                  }}>{savingSection === "Billing Strategy" ? "Saving..." : "Save"}</Button>
                </CardContent>
              </Card>

              {/* Installment Plans */}
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><CreditCard className="h-4 w-4" />Installment Payment Plans</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div><p className="text-sm font-medium">Enable Installment Payments</p><p className="text-xs text-muted-foreground">Allow patients to pay in multiple installments for bills and medicine purchases</p></div>
                    <Switch checked={!!settings.installment_enabled} onCheckedChange={v => updateSetting("installment_enabled", v)} />
                  </div>
                  {settings.installment_enabled && (
                    <div className="space-y-3 pl-3 border-l-2 border-primary/20">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <Label>Max Installments</Label>
                          <Select value={String(settings.installment_max || 3)} onValueChange={v => updateSetting("installment_max", parseInt(v))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="2">2 Installments</SelectItem>
                              <SelectItem value="3">3 Installments</SelectItem>
                              <SelectItem value="4">4 Installments</SelectItem>
                              <SelectItem value="6">6 Installments</SelectItem>
                              <SelectItem value="12">12 Installments</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div><Label>Min Amount for Installment (KES)</Label><Input value={settings.installment_min_amount || "1000"} onChange={e => updateSetting("installment_min_amount", e.target.value)} type="number" /></div>
                        <div><Label>Down Payment % (minimum)</Label><Input value={settings.installment_downpayment_pct || "30"} onChange={e => updateSetting("installment_downpayment_pct", e.target.value)} type="number" /></div>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border">
                        <div><p className="text-sm font-medium">Allow for Medicine Purchases</p><p className="text-xs text-muted-foreground">Enable installment plans when dispensing medicines at POS</p></div>
                        <Switch checked={!!settings.installment_pharmacy} onCheckedChange={v => updateSetting("installment_pharmacy", v)} />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border">
                        <div><p className="text-sm font-medium">Allow for Hospital Bills</p><p className="text-xs text-muted-foreground">Enable installment plans for consultation and admission bills</p></div>
                        <Switch checked={settings.installment_billing !== false} onCheckedChange={v => updateSetting("installment_billing", v)} />
                      </div>
                    </div>
                  )}
                  <Button size="sm" disabled={savingSection === "Installment Settings"} onClick={() => saveSettings("Installment Settings", ["installment_enabled","installment_max","installment_min_amount","installment_downpayment_pct","installment_pharmacy","installment_billing"])}>{savingSection === "Installment Settings" ? "Saving..." : "Save"}</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><CreditCard className="h-4 w-4" />Payment Methods</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { key: "pay_cash", label: "Cash Payments", desc: "Accept cash at all stations" },
                    { key: "pay_mpesa", label: "M-Pesa Integration", desc: "STK Push via Brightcare API" },
                    { key: "pay_card", label: "Card Payments", desc: "Credit/debit card terminal" },
                    { key: "pay_credit", label: "Credit Facility", desc: "Allow credit sales with tracking" },
                    { key: "pay_gift", label: "Gift Cards/Vouchers", desc: "Accept gift card payments" },
                    { key: "pay_account", label: "Account Billing", desc: "Bill to patient account" },
                    { key: "pay_insurance", label: "Insurance Billing", desc: "Direct insurance claims" },
                    { key: "pay_installment", label: "Installment Plans", desc: "Split payments over time" },
                  ].map(m => (
                    <div key={m.key} className="flex items-center justify-between p-3 rounded-lg border">
                      <div><p className="text-sm font-medium">{m.label}</p><p className="text-xs text-muted-foreground">{m.desc}</p></div>
                      <Switch checked={!!settings[m.key]} onCheckedChange={v => updateSetting(m.key, v)} />
                    </div>
                  ))}
                  <Button size="sm" disabled={savingSection === "Payment Methods"} onClick={() => saveSettings("Payment Methods", ["pay_cash","pay_mpesa","pay_card","pay_credit","pay_gift","pay_account","pay_insurance","pay_installment"])}>{savingSection === "Payment Methods" ? "Saving..." : "Save"}</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Smartphone className="h-4 w-4" />M-Pesa Configuration</CardTitle></CardHeader>
                <CardContent>
                  <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 text-sm space-y-2">
                    <p className="font-medium text-primary">ℹ️ M-Pesa API settings are managed by the Platform Administrator</p>
                    <p className="text-muted-foreground text-xs">The M-Pesa endpoint and API key are configured centrally for each hospital. Contact your platform admin to update payment gateway settings.</p>
                    <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                      <p><strong>Status:</strong> {settings.mpesa_api_key ? "✅ Configured" : "⚠️ Not configured — contact platform admin"}</p>
                      <p><strong>Business Shortcode:</strong> {settings.mpesa_shortcode || "174379"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "clinical" && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Stethoscope className="h-4 w-4" />Consultation Settings</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div><Label>Default Consultation Fee (KES)</Label><Input value={settings.default_consultation_fee} onChange={e => updateSetting("default_consultation_fee", e.target.value)} type="number" /></div>
                    <div><Label>Follow-up Fee (KES)</Label><Input value={settings.default_followup_fee} onChange={e => updateSetting("default_followup_fee", e.target.value)} type="number" /></div>
                    <div><Label>Emergency Fee (KES)</Label><Input value={settings.default_emergency_fee} onChange={e => updateSetting("default_emergency_fee", e.target.value)} type="number" /></div>
                    <div><Label>Specialist Consultation Fee</Label><Input value={settings.specialist_fee} onChange={e => updateSetting("specialist_fee", e.target.value)} type="number" /></div>
                  </div>
                  <div className="space-y-3 mt-4">
                    {[
                      { key: "drug_interaction_alerts", label: "Drug Interaction Alerts", desc: "Warn when conflicting medications are prescribed" },
                      { key: "auto_bill_on_completion", label: "Auto-generate Bill on Completion", desc: "Create a bill when consultation is marked complete" },
                      { key: "require_vitals_before_consult", label: "Require Vitals Before Consultation", desc: "Nurses must record vitals before doctor can start" },
                      { key: "followup_reminders", label: "Follow-up Reminders", desc: "Send SMS reminders for scheduled follow-ups" },
                    ].map(s => (
                      <div key={s.key} className="flex items-center justify-between p-3 rounded-lg border">
                        <div><p className="text-sm font-medium">{s.label}</p><p className="text-xs text-muted-foreground">{s.desc}</p></div>
                        <Switch checked={!!settings[s.key]} onCheckedChange={v => updateSetting(s.key, v)} />
                      </div>
                    ))}
                  </div>
                  <Button size="sm" disabled={savingSection === "Clinical Settings"} onClick={async () => {
                    if (hospital?.id) {
                      await supabase.from("hospitals").update({ default_consultation_fee: parseFloat(settings.default_consultation_fee) || 500, default_followup_fee: parseFloat(settings.default_followup_fee) || 300, default_emergency_fee: parseFloat(settings.default_emergency_fee) || 1500 } as any).eq("id", hospital.id);
                    }
                    await saveSettings("Clinical Settings", ["default_consultation_fee","default_followup_fee","default_emergency_fee","specialist_fee","drug_interaction_alerts","auto_bill_on_completion","require_vitals_before_consult","followup_reminders"]);
                  }}>{savingSection === "Clinical Settings" ? "Saving..." : "Save"}</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><FlaskConical className="h-4 w-4" />Lab Test Catalog</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {["Complete Blood Count (CBC) — KES 800", "Urinalysis — KES 300", "Blood Sugar (RBS) — KES 200", "Liver Function Test — KES 1,500", "Kidney Function Test — KES 1,200", "HIV Test — KES 500", "Malaria Test (RDT) — KES 200", "Full Haemogram — KES 600", "Widal Test — KES 400", "Stool Analysis — KES 300"].map(t => (
                    <div key={t} className="flex items-center justify-between p-2 rounded border text-xs">
                      <span className="font-medium">{t}</span>
                      <Badge variant="outline" className="text-[10px]">Active</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Bed className="h-4 w-4" />Ward & Bed Configuration</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div><Label>General Ward Daily Rate (KES)</Label><Input value={settings.general_ward_rate} onChange={e => updateSetting("general_ward_rate", e.target.value)} type="number" /></div>
                    <div><Label>Private Room Daily Rate (KES)</Label><Input value={settings.private_room_rate} onChange={e => updateSetting("private_room_rate", e.target.value)} type="number" /></div>
                    <div><Label>ICU Daily Rate (KES)</Label><Input value={settings.icu_rate} onChange={e => updateSetting("icu_rate", e.target.value)} type="number" /></div>
                    <div><Label>Maternity Ward Daily Rate (KES)</Label><Input value={settings.maternity_rate} onChange={e => updateSetting("maternity_rate", e.target.value)} type="number" /></div>
                  </div>
                  <Button size="sm" disabled={savingSection === "Ward Settings"} onClick={() => saveSettings("Ward Settings", ["general_ward_rate","private_room_rate","icu_rate","maternity_rate"])}>{savingSection === "Ward Settings" ? "Saving..." : "Save"}</Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "pharmacy" && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Pill className="h-4 w-4" />Pharmacy Configuration</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div><Label>Default Reorder Level</Label><Input value={settings.default_reorder_level} onChange={e => updateSetting("default_reorder_level", e.target.value)} type="number" /></div>
                    <div><Label>Expiry Alert Days</Label><Input value={settings.expiry_alert_days} onChange={e => updateSetting("expiry_alert_days", e.target.value)} type="number" /></div>
                    <div><Label>Receipt Number Prefix</Label><Input value={profileForm.receipt_prefix} onChange={e => setProfileForm(f => ({ ...f, receipt_prefix: e.target.value }))} /></div>
                    <div><Label>Max Discount % (Cashier)</Label><Input value={settings.max_discount_pct} onChange={e => updateSetting("max_discount_pct", e.target.value)} type="number" /></div>
                  </div>
                  <div className="space-y-3 mt-4">
                    {[
                      { key: "prescription_validation", label: "Prescription Validation", desc: "Require valid prescription for Rx medicines" },
                      { key: "auto_restock_alerts", label: "Auto Restock Alerts", desc: "Notify when stock falls below reorder level" },
                      { key: "batch_tracking", label: "Batch Number Tracking", desc: "Track medicines by batch number" },
                      { key: "barcode_scanning", label: "Barcode Scanning", desc: "Enable barcode scanner for quick lookups" },
                      { key: "controlled_drug_tracking", label: "Controlled Drug Tracking", desc: "Special logging for controlled substances" },
                      { key: "allergy_cross_check", label: "Allergy Cross-Check", desc: "Warn if patient has known drug allergies" },
                    ].map(s => (
                      <div key={s.key} className="flex items-center justify-between p-3 rounded-lg border">
                        <div><p className="text-sm font-medium">{s.label}</p><p className="text-xs text-muted-foreground">{s.desc}</p></div>
                        <Switch checked={!!settings[s.key]} onCheckedChange={v => updateSetting(s.key, v)} />
                      </div>
                    ))}
                  </div>
                  <Button size="sm" disabled={savingSection === "Pharmacy Settings"} onClick={() => saveSettings("Pharmacy Settings", ["default_reorder_level","expiry_alert_days","max_discount_pct","prescription_validation","auto_restock_alerts","batch_tracking","barcode_scanning","controlled_drug_tracking","allergy_cross_check"])}>{savingSection === "Pharmacy Settings" ? "Saving..." : "Save"}</Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "dropdowns" && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><ClipboardList className="h-4 w-4" />Dropdown Catalog Management</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground">Manage dropdown options used across the system.</p>
                  <div>
                    <Label className="text-xs">Category</Label>
                    <Select value={dropdownCategory} onValueChange={setDropdownCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[
                          { value: "prescription_frequency", label: "Prescription Frequencies" },
                          { value: "prescription_duration", label: "Prescription Durations" },
                          { value: "dosage_form", label: "Dosage Forms" },
                          { value: "visit_type", label: "Visit Types" },
                          { value: "ward_type", label: "Ward Types" },
                          { value: "lab_test_category", label: "Lab Test Categories" },
                          { value: "medicine_category", label: "Medicine Categories" },
                          { value: "admission_type", label: "Admission Types" },
                          { value: "blood_type", label: "Blood Types" },
                          { value: "gender", label: "Gender Options" },
                        ].map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="border rounded-lg">
                    <div className="p-3 bg-muted/50 border-b flex items-center gap-2">
                      <Input placeholder="Label (e.g., Once daily)" value={newDropdownLabel} onChange={e => setNewDropdownLabel(e.target.value)} className="h-8 text-xs flex-1" />
                      <Input placeholder="Value (auto)" value={newDropdownValue} onChange={e => setNewDropdownValue(e.target.value)} className="h-8 text-xs w-40" />
                      <Button size="sm" className="gap-1 h-8" onClick={addDropdownItem}><Plus className="h-3 w-3" /> Add</Button>
                    </div>
                    <div className="max-h-64 overflow-auto">
                      {dropdownItems.map((item: any, idx: number) => (
                        <div key={item.id} className="flex items-center justify-between px-3 py-2 border-b last:border-0 hover:bg-muted/30">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground w-6">{idx + 1}.</span>
                            <span className="text-sm font-medium">{item.label}</span>
                            <span className="text-[10px] text-muted-foreground">({item.value})</span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeDropdownItem(item.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                      {dropdownItems.length === 0 && <p className="text-center text-xs text-muted-foreground py-4">No options in this category</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "notifications" && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Bell className="h-4 w-4" />Notification Preferences</CardTitle></CardHeader>
              <CardContent className="space-y-3 max-w-lg">
                {[
                  { key: "lowStockAlerts" as const, label: "Low stock alerts", desc: "Notify when items fall below reorder level", icon: AlertTriangle },
                  { key: "expiryWarnings" as const, label: "Expiry warnings", desc: "Alerts for medicines expiring within 3 months", icon: Clock },
                  { key: "dailySalesSummary" as const, label: "Daily sales summary", desc: "End-of-day sales report via email", icon: Receipt },
                  { key: "newStaffLogin" as const, label: "New staff login alerts", desc: "Alert when staff logs into the system", icon: Users },
                ].map(n => (
                  <div key={n.key} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <n.icon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{n.label}</p>
                        <p className="text-xs text-muted-foreground">{n.desc}</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications[n.key]}
                      onCheckedChange={() => {
                        updateNotifications({ [n.key]: !notifications[n.key] });
                        toast({ title: `${n.label} ${notifications[n.key] ? "disabled" : "enabled"}` });
                      }}
                    />
                  </div>
                ))}
                <div className="border-t pt-3 mt-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">NOTIFICATION CHANNELS</p>
                  {[
                    { key: "sms_gateway", label: "SMS Gateway (Twilio/AfricasTalking)" },
                    { key: "email_notifications", label: "Email Notifications" },
                    { key: "in_app_alerts", label: "In-App Alerts" },
                    { key: "push_notifications", label: "Push Notifications" },
                  ].map(c => (
                    <div key={c.key} className="flex items-center justify-between p-2 rounded border text-sm mb-1">
                      <span>{c.label}</span>
                      <Switch checked={!!settings[c.key]} onCheckedChange={v => updateSetting(c.key, v)} />
                    </div>
                  ))}
                  <Button size="sm" className="mt-2" disabled={savingSection === "Notification Channels"} onClick={() => saveSettings("Notification Channels", ["sms_gateway","email_notifications","in_app_alerts","push_notifications"])}>{savingSection === "Notification Channels" ? "Saving..." : "Save Channels"}</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "data" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Database className="h-4 w-4" />Data Management</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <Button size="sm" variant="outline" className="w-full justify-start" onClick={() => setShowImport(true)}><Upload className="h-4 w-4 mr-2" />Import Medicines (CSV)</Button>
                  <Button size="sm" variant="outline" className="w-full justify-start" onClick={handleExportAll}><Download className="h-4 w-4 mr-2" />Export All Data</Button>
                  <Button size="sm" variant="outline" className="w-full justify-start"><Shield className="h-4 w-4 mr-2" />Backup Database</Button>
                  <Button size="sm" variant="outline" className="w-full justify-start"><HardDrive className="h-4 w-4 mr-2" />Restore from Backup</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Server className="h-4 w-4" />System Info</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Version</span><Badge variant="secondary">v3.0.0</Badge></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Backend</span><Badge>Brightcare Cloud</Badge></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">AI Assistant</span><Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">Active</Badge></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Database</span><Badge variant="secondary">PostgreSQL</Badge></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Uptime</span><span className="text-xs">99.9%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Last Backup</span><span className="text-xs">Today, 6:00 AM</span></div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "security" && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Lock className="h-4 w-4" />Security Policies</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { key: "two_factor_auth", label: "Two-Factor Authentication", desc: "Require 2FA for all admin accounts" },
                    { key: "session_timeout", label: "Session Timeout", desc: "Auto-logout after 30 minutes of inactivity" },
                    { key: "password_complexity", label: "Password Complexity", desc: "Minimum 8 chars, uppercase, number, special char" },
                    { key: "login_rate_limiting", label: "Login Rate Limiting", desc: "Lock account after 5 failed attempts" },
                    { key: "audit_trail", label: "Audit Trail", desc: "Log all data access and modifications" },
                    { key: "data_encryption", label: "Data Encryption", desc: "Encrypt sensitive patient data at rest" },
                    { key: "ip_whitelisting", label: "IP Whitelisting", desc: "Restrict access to approved IP addresses" },
                    { key: "api_access_keys", label: "API Access Keys", desc: "Manage external API integrations" },
                  ].map(s => (
                    <div key={s.key} className="flex items-center justify-between p-3 rounded-lg border">
                      <div><p className="text-sm font-medium">{s.label}</p><p className="text-xs text-muted-foreground">{s.desc}</p></div>
                      <Switch checked={!!settings[s.key]} onCheckedChange={v => updateSetting(s.key, v)} />
                    </div>
                  ))}
                  <Button size="sm" disabled={savingSection === "Security Policies"} onClick={() => saveSettings("Security Policies", ["two_factor_auth","session_timeout","password_complexity","login_rate_limiting","audit_trail","data_encryption","ip_whitelisting","api_access_keys"])}>{savingSection === "Security Policies" ? "Saving..." : "Save"}</Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "branding" && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Eye className="h-4 w-4" />Branding & Customization</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><Label>Primary Color</Label><Input value={settings.primary_color} onChange={e => updateSetting("primary_color", e.target.value)} type="color" className="h-10" /></div>
                  <div><Label>Accent Color</Label><Input value={settings.accent_color} onChange={e => updateSetting("accent_color", e.target.value)} type="color" className="h-10" /></div>
                  <div><Label>Logo URL</Label><Input value={settings.logo_url || ""} onChange={e => updateSetting("logo_url", e.target.value)} placeholder="Upload or paste logo URL" /></div>
                  <div><Label>Favicon URL</Label><Input value={settings.favicon_url || ""} onChange={e => updateSetting("favicon_url", e.target.value)} placeholder="Upload or paste favicon URL" /></div>
                </div>
                <div><Label>Terms & Conditions</Label><Textarea value={settings.terms_conditions} onChange={e => updateSetting("terms_conditions", e.target.value)} rows={3} /></div>
                <div><Label>Privacy Policy</Label><Textarea value={settings.privacy_policy} onChange={e => updateSetting("privacy_policy", e.target.value)} rows={3} /></div>
                <div>
                  <Label>Language</Label>
                  <Select value={settings.language} onValueChange={v => updateSetting("language", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="sw">Kiswahili</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button size="sm" disabled={savingSection === "Branding"} onClick={() => saveSettings("Branding", ["primary_color","accent_color","logo_url","favicon_url","terms_conditions","privacy_policy","language"])}>{savingSection === "Branding" ? "Saving..." : "Save"}</Button>
              </CardContent>
            </Card>
          )}

          {activeSection === "system" && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">System Configuration</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "Module Toggles", desc: "Enable/disable system modules per deployment" },
                    { label: "Auto-Backup Schedule", desc: "Daily at 2:00 AM EAT" },
                    { label: "Data Retention Policy", desc: "Keep records for 7 years minimum" },
                    { label: "System Update Channel", desc: "Stable — automatic updates" },
                    { label: "Helpdesk Ticketing", desc: "Internal support ticket system" },
                    { label: "Mobile App Access", desc: "Enable mobile-responsive access" },
                    { label: "Patient Portal", desc: "Self-service portal for patients" },
                    { label: "Telemedicine", desc: "Video consultation capabilities" },
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between p-3 rounded-lg border">
                      <div><p className="text-sm font-medium">{s.label}</p><p className="text-xs text-muted-foreground">{s.desc}</p></div>
                      <Switch defaultChecked />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <CSVImportModal open={showImport} onClose={() => setShowImport(false)} />
    </AppLayout>
  );
}
