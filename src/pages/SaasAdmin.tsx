import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Building2, DollarSign, Users, Activity, Search, Ban, CheckCircle, AlertTriangle, Key, Copy, ArrowLeft, Plus, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { generateLicenseKey } from "@/utils/licenseKeys";

interface HospitalRow {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  city: string | null;
  license_status: string;
  license_expires_at: string | null;
  trial_ends_at: string | null;
  is_active: boolean;
  created_at: string;
  license_packages?: { display_name: string; price_monthly: number } | null;
}

interface LicenseKeyRow {
  id: string;
  license_key: string;
  hospital_id: string | null;
  package_id: string | null;
  status: string;
  duration_months: number;
  activated_at: string | null;
  expires_at: string | null;
  created_at: string;
  notes: string | null;
  license_packages?: { display_name: string } | null;
  hospitals?: { name: string } | null;
}

const STATUS_BADGE: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  active: { variant: "default", label: "Active" },
  trial: { variant: "secondary", label: "Trial" },
  grace: { variant: "outline", label: "Grace Period" },
  suspended: { variant: "destructive", label: "Suspended" },
  expired: { variant: "destructive", label: "Expired" },
};

const KEY_STATUS_BADGE: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  unused: { variant: "outline", label: "Unused" },
  activated: { variant: "default", label: "Activated" },
  expired: { variant: "destructive", label: "Expired" },
  revoked: { variant: "destructive", label: "Revoked" },
};

export default function SaasAdmin() {
  const { staff } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"hospitals" | "keys">("hospitals");
  const [hospitals, setHospitals] = useState<HospitalRow[]>([]);
  const [licenseKeys, setLicenseKeys] = useState<LicenseKeyRow[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, trial: 0, revenue: 0 });

  // Generate key dialog
  const [showGenerate, setShowGenerate] = useState(false);
  const [genPackage, setGenPackage] = useState("");
  const [genDuration, setGenDuration] = useState("1");
  const [genCount, setGenCount] = useState("1");
  const [genNotes, setGenNotes] = useState("");
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);

  useEffect(() => {
    if (staff?.role !== "platform_admin") {
      navigate("/dashboard");
      return;
    }
    fetchAll();
  }, [staff]);

  const fetchAll = async () => {
    setLoading(true);
    const [hRes, kRes, pRes] = await Promise.all([
      supabase.from("hospitals").select("*, license_packages(display_name, price_monthly)").order("created_at", { ascending: false }),
      supabase.from("license_keys").select("*, license_packages(display_name), hospitals(name)").order("created_at", { ascending: false }),
      supabase.from("license_packages").select("*").eq("is_active", true).order("sort_order"),
    ]);

    if (hRes.data) {
      setHospitals(hRes.data as any);
      const active = hRes.data.filter(h => h.license_status === "active").length;
      const trial = hRes.data.filter(h => h.license_status === "trial").length;
      const revenue = hRes.data.filter(h => h.license_status === "active").reduce((sum, h) => sum + ((h as any).license_packages?.price_monthly || 0), 0);
      setStats({ total: hRes.data.length, active, trial, revenue });
    }
    if (kRes.data) setLicenseKeys(kRes.data as any);
    if (pRes.data) setPackages(pRes.data as any);
    setLoading(false);
  };

  const toggleSuspend = async (hospital: HospitalRow) => {
    const newStatus = hospital.license_status === "suspended" ? "active" : "suspended";
    await supabase.from("hospitals").update({ license_status: newStatus, is_active: newStatus !== "suspended" } as any).eq("id", hospital.id);
    await supabase.from("license_audit_log").insert({
      hospital_id: hospital.id,
      action: newStatus === "suspended" ? "SUSPENDED" : "REACTIVATED",
      details: `Hospital ${newStatus === "suspended" ? "suspended" : "reactivated"} by platform admin.`,
      performed_by: staff?.id,
    });
    toast({ title: newStatus === "suspended" ? "Hospital Suspended" : "Hospital Reactivated" });
    fetchAll();
  };

  const handleGenerateKeys = async () => {
    if (!genPackage) { toast({ title: "Select a package", variant: "destructive" }); return; }
    const count = Math.min(parseInt(genCount) || 1, 50);
    const duration = parseInt(genDuration) || 1;
    const keys: string[] = [];

    for (let i = 0; i < count; i++) {
      const key = generateLicenseKey();
      keys.push(key);
      await supabase.from("license_keys").insert({
        license_key: key,
        package_id: genPackage,
        duration_months: duration,
        generated_by: staff?.id,
        notes: genNotes || null,
        status: "unused",
      } as any);
    }

    setGeneratedKeys(keys);
    toast({ title: `✅ ${count} license key(s) generated` });
    fetchAll();
  };

  const copyKeys = () => {
    navigator.clipboard.writeText(generatedKeys.join("\n"));
    toast({ title: "Copied to clipboard" });
  };

  const revokeKey = async (id: string) => {
    await supabase.from("license_keys").update({ status: "revoked" } as any).eq("id", id);
    toast({ title: "License key revoked" });
    fetchAll();
  };

  const filtered = hospitals.filter(h =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.email?.toLowerCase().includes(search.toLowerCase()) ||
    h.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}><ArrowLeft className="h-4 w-4" /></Button>
            <div>
              <h1 className="font-bold text-xl">Brightcare SaaS Admin</h1>
              <p className="text-xs text-muted-foreground">Platform oversight, licensing & hospital management</p>
            </div>
          </div>
          <Badge variant="outline" className="gap-1"><Activity className="h-3 w-3" /> Platform Admin</Badge>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Building2, color: "text-blue-600 bg-blue-500/10", value: stats.total, label: "Total Hospitals" },
            { icon: CheckCircle, color: "text-emerald-600 bg-emerald-500/10", value: stats.active, label: "Active Licenses" },
            { icon: AlertTriangle, color: "text-amber-600 bg-amber-500/10", value: stats.trial, label: "On Trial" },
            { icon: DollarSign, color: "text-purple-600 bg-purple-500/10", value: `$${stats.revenue.toFixed(2)}`, label: "Monthly Revenue" },
          ].map((s, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg ${s.color} flex items-center justify-center`}><s.icon className="h-5 w-5" /></div>
                  <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <button onClick={() => setTab("hospitals")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "hospitals" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <Building2 className="h-4 w-4 inline mr-1.5" />Hospitals
          </button>
          <button onClick={() => setTab("keys")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "keys" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <Key className="h-4 w-4 inline mr-1.5" />License Keys
          </button>
        </div>

        {tab === "hospitals" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle>All Hospitals</CardTitle><CardDescription>{filtered.length} hospital(s)</CardDescription></div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Search hospitals..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hospital</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(h => {
                    const statusInfo = STATUS_BADGE[h.license_status] || { variant: "outline" as const, label: h.license_status };
                    return (
                      <TableRow key={h.id}>
                        <TableCell><p className="font-medium">{h.name}</p><p className="text-xs text-muted-foreground">{h.email}</p></TableCell>
                        <TableCell className="text-sm">{(h as any).license_packages?.display_name || "—"}</TableCell>
                        <TableCell><Badge variant={statusInfo.variant}>{statusInfo.label}</Badge></TableCell>
                        <TableCell className="text-sm">{h.city || "—"}</TableCell>
                        <TableCell className="text-sm">{h.created_at ? format(new Date(h.created_at), "MMM d, yyyy") : "—"}</TableCell>
                        <TableCell>
                          <Button size="sm" variant={h.license_status === "suspended" ? "default" : "destructive"} className="gap-1" onClick={() => toggleSuspend(h)}>
                            {h.license_status === "suspended" ? <><CheckCircle className="h-3 w-3" /> Activate</> : <><Ban className="h-3 w-3" /> Suspend</>}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No hospitals found.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {tab === "keys" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">License Keys</h3>
                <p className="text-xs text-muted-foreground">Generate, distribute, and manage activation codes</p>
              </div>
              <Button onClick={() => { setShowGenerate(true); setGeneratedKeys([]); }} className="gap-1.5">
                <Plus className="h-4 w-4" /> Generate Keys
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>License Key</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Hospital</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {licenseKeys.map(k => {
                      const sInfo = KEY_STATUS_BADGE[k.status] || { variant: "outline" as const, label: k.status };
                      return (
                        <TableRow key={k.id}>
                          <TableCell><code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{k.license_key}</code></TableCell>
                          <TableCell className="text-sm">{(k as any).license_packages?.display_name || "—"}</TableCell>
                          <TableCell className="text-sm">{k.duration_months} month(s)</TableCell>
                          <TableCell><Badge variant={sInfo.variant}>{sInfo.label}</Badge></TableCell>
                          <TableCell className="text-sm">{(k as any).hospitals?.name || "—"}</TableCell>
                          <TableCell className="text-sm">{k.created_at ? format(new Date(k.created_at), "MMM d, yyyy") : "—"}</TableCell>
                          <TableCell>
                            {k.status === "unused" && (
                              <Button size="sm" variant="destructive" className="gap-1 h-7 text-xs" onClick={() => revokeKey(k.id)}>Revoke</Button>
                            )}
                            {k.status === "activated" && (
                              <span className="text-xs text-muted-foreground">In use</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {licenseKeys.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No license keys generated yet.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Generate Keys Dialog */}
      <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Key className="h-5 w-5" /> Generate License Keys</DialogTitle></DialogHeader>

          {generatedKeys.length === 0 ? (
            <div className="space-y-4">
              <div>
                <Label>Package *</Label>
                <Select value={genPackage} onValueChange={setGenPackage}>
                  <SelectTrigger><SelectValue placeholder="Select package" /></SelectTrigger>
                  <SelectContent>
                    {packages.map(p => <SelectItem key={p.id} value={p.id}>{p.display_name} — ${p.price_monthly}/mo</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Duration (months)</Label>
                  <Select value={genDuration} onValueChange={setGenDuration}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 3, 6, 12].map(m => <SelectItem key={m} value={String(m)}>{m} month{m > 1 ? "s" : ""}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Number of keys</Label>
                  <Input type="number" value={genCount} onChange={e => setGenCount(e.target.value)} min={1} max={50} />
                </div>
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Input value={genNotes} onChange={e => setGenNotes(e.target.value)} placeholder="e.g. For City Hospital pilot" />
              </div>
              <Button className="w-full gap-2" onClick={handleGenerateKeys}>
                <Key className="h-4 w-4" /> Generate
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">✅ {generatedKeys.length} key(s) generated. Share these with hospitals for activation.</p>
              <div className="bg-muted rounded-lg p-3 max-h-48 overflow-auto space-y-1">
                {generatedKeys.map((k, i) => (
                  <code key={i} className="block text-sm font-mono">{k}</code>
                ))}
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 gap-1" onClick={copyKeys}><Copy className="h-4 w-4" /> Copy All</Button>
                <Button variant="outline" className="flex-1" onClick={() => { setShowGenerate(false); setGeneratedKeys([]); }}>Done</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
