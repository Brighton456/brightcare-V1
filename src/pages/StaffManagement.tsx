import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useHospital } from "@/contexts/HospitalContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Users, UserPlus, Search, Edit, Shield, Trash2, KeyRound, RotateCcw } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const ROLES = [
  { value: "super_admin", label: "Super Admin" },
  { value: "hospital_admin", label: "Hospital Admin" },
  { value: "doctor", label: "Doctor" },
  { value: "nurse", label: "Nurse" },
  { value: "receptionist", label: "Receptionist" },
  { value: "pharmacist", label: "Pharmacist" },
  { value: "cashier", label: "Cashier" },
  { value: "lab_technician", label: "Lab Technician" },
  { value: "accountant", label: "Accountant" },
  { value: "records_officer", label: "Records Officer" },
];

interface Staff {
  id: string;
  staff_no: string;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  department_id: string | null;
  specialization: string | null;
  phone: string | null;
  email: string | null;
  license_number: string | null;
  is_active: boolean;
  created_at: string;
  departments?: { name: string } | null;
}

export default function StaffManagement() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [resetTarget, setResetTarget] = useState<{ id: string; name: string } | null>(null);
  const [showResetAll, setShowResetAll] = useState(false);
  const [resetting, setResetting] = useState(false);
  const isAdmin = useIsAdmin();
  const [form, setForm] = useState({ first_name: "", last_name: "", username: "", role: "doctor", department_id: "", specialization: "", phone: "", email: "", license_number: "" });

  const { hospitalId } = useHospital();

  const fetchData = async () => {
    if (!hospitalId) return;
    const [sRes, dRes] = await Promise.all([
      supabase.from("staff").select("*, departments(name)").eq("hospital_id", hospitalId).eq("is_hidden", false).order("created_at", { ascending: false }),
      supabase.from("departments").select("id,name").eq("hospital_id", hospitalId).eq("is_active", true),
    ]);
    if (sRes.data) setStaff(sRes.data as unknown as Staff[]);
    if (dRes.data) setDepartments(dRes.data as any[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [hospitalId]);

  const handleSave = async () => {
    if (!form.first_name || !form.last_name) { toast({ title: "Error", description: "Name required", variant: "destructive" }); return; }
    const autoUsername = form.username || `${form.first_name}.${form.last_name}`.toLowerCase().replace(/\s+/g, '');
    const payload = {
      first_name: form.first_name, last_name: form.last_name, role: form.role,
      username: autoUsername,
      department_id: form.department_id || null, specialization: form.specialization || null,
      phone: form.phone || null, email: form.email || null, license_number: form.license_number || null,
    };
    if (editingId) {
      const { error } = await supabase.from("staff").update(payload as any).eq("id", editingId);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Staff Updated" });
    } else {
      // New staff: default password is "changeme"
      const initialPassword = "changeme";
      const { data: pwHash } = await supabase.rpc("hash_password", { raw_password: initialPassword });
      const { error } = await supabase.from("staff").insert({
        ...payload,
        staff_no: `STF-${Date.now().toString().slice(-6)}`,
        password_hash: pwHash,
        plain_password: initialPassword,
        must_change_password: true,
        hospital_id: hospitalId,
      } as any);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      // Show the generated password in a persistent toast - admin must share it
      toast({
        title: "✅ Staff Account Created",
        description: `Username: ${autoUsername} | Initial Password: ${initialPassword} — Share this securely. They'll be asked to change it on first login.`,
        duration: 30000,
      });
    }
    setShowAdd(false); setEditingId(null);
    setForm({ first_name: "", last_name: "", username: "", role: "doctor", department_id: "", specialization: "", phone: "", email: "", license_number: "" });
    fetchData();
  };

  const resetPassword = async (staffId: string) => {
    setResetting(true);
    try {
      const defaultPw = "changeme";
      const { data: pwHash } = await supabase.rpc("hash_password", { raw_password: defaultPw });
      const { error } = await supabase.from("staff").update({ password_hash: pwHash, plain_password: defaultPw, must_change_password: true } as any).eq("id", staffId);
      if (error) throw error;
      toast({ title: "✅ Password Reset", description: `Password reset to "${defaultPw}". Staff will be prompted to change it on next login.`, duration: 10000 });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setResetting(false);
    setResetTarget(null);
  };

  const resetAllPasswords = async () => {
    setResetting(true);
    try {
      const defaultPw = "changeme";
      const { data: pwHash } = await supabase.rpc("hash_password", { raw_password: defaultPw });
      const activeStaff = staff.filter(s => s.is_active);
      for (const s of activeStaff) {
        await supabase.from("staff").update({ password_hash: pwHash, plain_password: defaultPw, must_change_password: true } as any).eq("id", s.id);
      }
      toast({ title: "✅ All Passwords Reset", description: `${activeStaff.length} staff password(s) reset to "${defaultPw}".`, duration: 15000 });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setResetting(false);
    setShowResetAll(false);
  };

  const openEdit = (s: Staff) => {
    setEditingId(s.id);
    setForm({ first_name: s.first_name, last_name: s.last_name, username: s.username || "", role: s.role, department_id: s.department_id || "", specialization: s.specialization || "", phone: s.phone || "", email: s.email || "", license_number: s.license_number || "" });
    setShowAdd(true);
  };

  const roleColors: Record<string, string> = {
    super_admin: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    hospital_admin: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    doctor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    nurse: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
    pharmacist: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    cashier: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    lab_technician: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  };

  const filtered = staff.filter(s => {
    const q = search.toLowerCase();
    return s.first_name.toLowerCase().includes(q) || s.last_name.toLowerCase().includes(q) || s.staff_no.toLowerCase().includes(q) || s.role.includes(q);
  });

  return (
    <AppLayout title="Staff Management">
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-xl border bg-card"><Users className="h-5 w-5 text-primary" /><div><p className="text-lg font-bold">{staff.length}</p><p className="text-[11px] text-muted-foreground">Total Staff</p></div></div>
          <div className="flex items-center gap-3 p-3 rounded-xl border bg-card"><Shield className="h-5 w-5 text-blue-600" /><div><p className="text-lg font-bold">{staff.filter(s => s.role === "doctor").length}</p><p className="text-[11px] text-muted-foreground">Doctors</p></div></div>
          <div className="flex items-center gap-3 p-3 rounded-xl border bg-card"><Users className="h-5 w-5 text-pink-600" /><div><p className="text-lg font-bold">{staff.filter(s => s.role === "nurse").length}</p><p className="text-[11px] text-muted-foreground">Nurses</p></div></div>
          <div className="flex items-center gap-3 p-3 rounded-xl border bg-card"><Users className="h-5 w-5 text-emerald-600" /><div><p className="text-lg font-bold">{staff.filter(s => s.is_active).length}</p><p className="text-[11px] text-muted-foreground">Active</p></div></div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => setShowResetAll(true)} className="gap-2 text-amber-600 border-amber-300 hover:bg-amber-50">
                <RotateCcw className="h-4 w-4" /> Reset All Passwords
              </Button>
            )}
            <Button onClick={() => { setForm({ first_name: "", last_name: "", username: "", role: "doctor", department_id: "", specialization: "", phone: "", email: "", license_number: "" }); setEditingId(null); setShowAdd(true); }} className="gap-2"><UserPlus className="h-4 w-4" /> Add Staff</Button>
          </div>
        </div>

        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-semibold">Staff</th>
                <th className="text-left p-3 font-semibold">Role</th>
                <th className="text-left p-3 font-semibold hidden md:table-cell">Department</th>
                <th className="text-left p-3 font-semibold hidden lg:table-cell">Contact</th>
                <th className="text-left p-3 font-semibold">Status</th>
                <th className="text-right p-3 font-semibold">Actions</th>
              </tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No staff found</td></tr>
                ) : filtered.map(s => (
                  <tr key={s.id} className="border-b hover:bg-muted/30 transition-colors">
                     <td className="p-3">
                       <p className="font-semibold text-sm">{s.first_name} {s.last_name}</p>
                       <p className="text-xs text-muted-foreground">@{s.username} · {s.staff_no}</p>
                     </td>
                    <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[s.role] || "bg-gray-100 text-gray-800"}`}>{ROLES.find(r => r.value === s.role)?.label || s.role}</span></td>
                    <td className="p-3 text-xs hidden md:table-cell">{s.departments?.name || "—"}</td>
                    <td className="p-3 text-xs hidden lg:table-cell">{s.phone || s.email || "—"}</td>
                    <td className="p-3"><Badge variant={s.is_active ? "default" : "secondary"} className="text-xs">{s.is_active ? "Active" : "Inactive"}</Badge></td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}><Edit className="h-3.5 w-3.5" /></Button>
                        {isAdmin && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Reset Password" onClick={() => setResetTarget({ id: s.id, name: `${s.first_name} ${s.last_name}` })}>
                            <KeyRound className="h-3.5 w-3.5 text-amber-600" />
                          </Button>
                        )}
                        {isAdmin && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteTarget({ id: s.id, name: `${s.first_name} ${s.last_name}` })}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Edit Staff" : "Add Staff Member"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>First Name *</Label><Input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} /></div>
            <div><Label>Last Name *</Label><Input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} /></div>
            <div className="col-span-2">
              <Label>Username</Label>
              <Input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder={form.first_name && form.last_name ? `${form.first_name}.${form.last_name}`.toLowerCase() : "Auto-generated from name"} />
              <p className="text-[10px] text-muted-foreground mt-0.5">Used for login. Leave blank to auto-generate.{!editingId && " A random password will be generated."}</p>
            </div>
            <div>
              <Label>Role *</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Department</Label>
              <Select value={form.department_id} onValueChange={v => setForm(f => ({ ...f, department_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Specialization</Label><Input value={form.specialization} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))} /></div>
            <div><Label>License Number</Label><Input value={form.license_number} onChange={e => setForm(f => ({ ...f, license_number: e.target.value }))} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingId ? "Update" : "Add Staff"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await supabase.from("staff").update({ is_active: false } as any).eq("id", deleteTarget.id);
          toast({ title: "Staff deactivated" });
          setDeleteTarget(null);
          fetchData();
        }}
        itemName={deleteTarget?.name || ""}
      />

      {/* Single staff password reset */}
      <AlertDialog open={!!resetTarget} onOpenChange={() => setResetTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password for {resetTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset their password to <strong>"changeme"</strong>. They will be required to change it on next login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={resetting} onClick={() => resetTarget && resetPassword(resetTarget.id)} className="bg-amber-600 hover:bg-amber-700">
              {resetting ? "Resetting..." : "Reset Password"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk reset all passwords */}
      <AlertDialog open={showResetAll} onOpenChange={setShowResetAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset ALL Staff Passwords?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset passwords for <strong>{staff.filter(s => s.is_active).length} active staff</strong> members to <strong>"changeme"</strong>. All staff will be required to change their password on next login. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={resetting} onClick={resetAllPasswords} className="bg-destructive hover:bg-destructive/90">
              {resetting ? "Resetting..." : "Reset All Passwords"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
