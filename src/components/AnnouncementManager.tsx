import { useState, useEffect } from "react";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useHospital } from "@/contexts/HospitalContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Megaphone, Plus, Trash2, Eye, EyeOff, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Checkbox } from "@/components/ui/checkbox";

const ROLES = [
  "hospital_admin", "doctor", "nurse", "pharmacist", "cashier",
  "lab_technician", "receptionist", "accountant",
];

const COLORS = [
  { value: "amber", label: "🟡 Amber" },
  { value: "orange", label: "🟠 Orange" },
  { value: "green", label: "🟢 Green" },
  { value: "blue", label: "🔵 Blue" },
  { value: "red", label: "🔴 Red" },
  { value: "purple", label: "🟣 Purple" },
];

const ICONS = [
  { value: "megaphone", label: "📢 Megaphone" },
  { value: "bell", label: "🔔 Bell" },
  { value: "alert", label: "⚠️ Alert" },
  { value: "info", label: "ℹ️ Info" },
  { value: "sparkles", label: "✨ Sparkles" },
];

export function AnnouncementManager() {
  const { hospitalId } = useHospital();
  const { staff } = useAuth();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const isPlatformAdmin = staff?.role === "platform_admin";

  // Form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [color, setColor] = useState("amber");
  const [icon, setIcon] = useState("megaphone");
  const [priority, setPriority] = useState("normal");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [expiresIn, setExpiresIn] = useState("7");
  const [signoffName, setSignoffName] = useState("");
  const [signoffRole, setSignoffRole] = useState("");

  const fetchAnnouncements = async () => {
    let q = supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(50);
    if (!isPlatformAdmin && hospitalId) q = q.eq("hospital_id", hospitalId);
    const { data } = await q;
    setAnnouncements(data || []);
  };

  useEffect(() => { fetchAnnouncements(); }, [hospitalId]);

  const openNew = () => {
    resetForm();
    setEditTarget(null);
    // Pre-fill sign-off with current staff info
    setSignoffName(staff ? `${staff.first_name || ""} ${staff.last_name || ""}`.trim() : "");
    setSignoffRole(staff?.role ? staff.role.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : "");
    setShowForm(true);
  };

  const openEdit = (a: any) => {
    setEditTarget(a);
    setTitle(a.title);
    setMessage(a.message);
    setColor(a.background_color || "amber");
    setIcon(a.icon || "megaphone");
    setPriority(a.priority || "normal");
    setSelectedRoles(a.target_roles || []);
    setExpiresIn("7");
    setSignoffName(a.created_by_name || "");
    setSignoffRole(a.created_by_role || "");
    setShowForm(true);
  };

  const saveAnnouncement = async () => {
    if (!title.trim() || !message.trim()) {
      toast({ title: "Title and message are required", variant: "destructive" });
      return;
    }

    const payload: any = {
      title,
      message,
      background_color: color,
      icon,
      priority,
      target_roles: selectedRoles.length > 0 ? selectedRoles : ["all"],
      created_by_name: signoffName || null,
      created_by_role: signoffRole || null,
    };

    if (editTarget) {
      // Update
      const { error } = await supabase.from("announcements").update(payload).eq("id", editTarget.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Announcement updated! ✏️" });
    } else {
      // Create
      const expiresAt = expiresIn ? new Date(Date.now() + parseInt(expiresIn) * 86400000).toISOString() : null;
      payload.hospital_id = isPlatformAdmin ? null : hospitalId;
      payload.created_by = staff?.id || null;
      payload.expires_at = expiresAt;
      const { error } = await supabase.from("announcements").insert(payload);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Announcement published! 📢" });
    }

    setShowForm(false);
    resetForm();
    fetchAnnouncements();
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    await supabase.from("announcements").update({ is_active: !currentActive } as any).eq("id", id);
    fetchAnnouncements();
  };

  const deleteAnnouncement = async () => {
    if (!deleteTarget) return;
    await supabase.from("announcements").delete().eq("id", deleteTarget.id);
    setDeleteTarget(null);
    fetchAnnouncements();
    toast({ title: "Announcement deleted" });
  };

  const resetForm = () => {
    setTitle(""); setMessage(""); setColor("amber"); setIcon("megaphone");
    setPriority("normal"); setSelectedRoles([]); setExpiresIn("7");
    setSignoffName(""); setSignoffRole("");
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2"><Megaphone className="h-5 w-5" /> Announcements</span>
          <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" /> New Announcement</Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Signed By</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {announcements.map(a => (
              <TableRow key={a.id}>
                <TableCell className="font-semibold text-xs">{a.title}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-0.5">
                    {(a.target_roles || []).map((r: string) => (
                      <Badge key={r} variant="secondary" className="text-[9px]">{r}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell><span className="text-xs capitalize">{a.background_color}</span></TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {a.created_by_name ? `${a.created_by_name}` : "—"}
                  {a.created_by_role && <span className="block text-[10px] opacity-60">{a.created_by_role}</span>}
                </TableCell>
                <TableCell>
                  <Badge variant={a.is_active ? "default" : "secondary"}>
                    {a.is_active ? "Active" : "Hidden"}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(a)} title="Edit">
                      <Edit className="h-3.5 w-3.5 text-blue-500" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleActive(a.id, a.is_active)}>
                      {a.is_active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(a)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {announcements.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">No announcements yet</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* New / Edit Announcement Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" /> {editTarget ? "Edit Announcement" : "New Announcement"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. System Update Notice" />
            </div>
            <div>
              <Label>Message *</Label>
              <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Write your announcement..." rows={4} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Color</Label>
                <Select value={color} onValueChange={setColor}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{COLORS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Icon</Label>
                <Select value={icon} onValueChange={setIcon}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ICONS.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">🔴 Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {!editTarget && (
              <div>
                <Label>Expires In (days)</Label>
                <Input type="number" value={expiresIn} onChange={e => setExpiresIn(e.target.value)} placeholder="7" />
              </div>
            )}

            {/* Sign-off Section */}
            <div className="rounded-lg border border-dashed border-muted-foreground/30 p-3 space-y-2 bg-muted/30">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">✍️ Sign-off (shown at bottom of announcement)</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Your Name</Label>
                  <Input value={signoffName} onChange={e => setSignoffName(e.target.value)} placeholder="e.g. Dr. John Doe" className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Your Role / Title</Label>
                  <Input value={signoffRole} onChange={e => setSignoffRole(e.target.value)} placeholder="e.g. Platform Admin" className="h-8 text-sm" />
                </div>
              </div>
              {(signoffName || signoffRole) && (
                <div className="mt-2 text-xs italic opacity-70 border-t border-muted-foreground/20 pt-2">
                  Preview: <span className="font-medium">Regards,</span><br />
                  {signoffRole && <span className="font-semibold">{signoffRole},</span>}
                  {signoffRole && <br />}
                  {signoffName && <span className="font-bold">{signoffName}</span>}
                </div>
              )}
            </div>

            <div>
              <Label className="mb-2 block">Show to Roles (leave empty for everyone)</Label>
              <div className="flex flex-wrap gap-2">
                {ROLES.map(role => (
                  <label key={role} className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <Checkbox checked={selectedRoles.includes(role)} onCheckedChange={() => toggleRole(role)} />
                    <span className="capitalize">{role.replace(/_/g, " ")}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={saveAnnouncement}>
                {editTarget ? "✏️ Update Announcement" : "📢 Publish Announcement"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteAnnouncement}
        title="Delete Announcement"
        itemName={deleteTarget?.title}
      />
    </Card>
  );
}
