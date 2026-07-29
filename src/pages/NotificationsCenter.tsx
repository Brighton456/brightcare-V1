import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { toast } from "@/hooks/use-toast";
import { Bell, CheckCircle, Trash2, Eye, Clock } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useHospital } from "@/contexts/HospitalContext";

export default function NotificationsCenter() {
  const { hospitalId } = useHospital();
  const { staff } = useAuth();
  const isAdmin = ["hospital_admin", "super_admin", "platform_admin"].includes(staff?.role || "");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchNotifications = async () => {
    const { data } = await supabase.from("notifications").select("*, sender:sender_staff_id(first_name,last_name)").eq("hospital_id", hospitalId)
      .order("created_at", { ascending: false }).limit(100);
    if (data) setNotifications(data as any[]);
  };

  useEffect(() => { fetchNotifications(); }, [hospitalId]);

  // Auto-delete expired read notifications
  useEffect(() => {
    const cleanup = async () => {
      const now = new Date().toISOString();
      await supabase.from("notifications").delete()
        .eq("is_read", true)
        .lt("expires_at", now);
    };
    cleanup();
  }, [hospitalId]);

  const markRead = async (id: string) => {
    const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(); // 3 hours
    await supabase.from("notifications").update({
      is_read: true, read_at: new Date().toISOString(), expires_at: expiresAt,
    } as any).eq("id", id);
    toast({ title: "Marked as read" });
    fetchNotifications();
  };

  const markAllRead = async () => {
    const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
    await supabase.from("notifications").update({
      is_read: true, read_at: new Date().toISOString(), expires_at: expiresAt,
    } as any).eq("is_read", false);
    toast({ title: "All marked as read" });
    fetchNotifications();
  };

  const deleteNotification = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    fetchNotifications();
  };

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  return (
    <AppLayout title="Notifications">
      <div className="space-y-4 max-w-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">{unreadCount} unread</span>
          </div>
          {unreadCount > 0 && (
            <Button size="sm" variant="outline" onClick={markAllRead}>
              <CheckCircle className="h-3 w-3 mr-1" /> Mark All Read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No notifications</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {notifications.map((n: any) => (
              <Card key={n.id} className={!n.is_read ? "border-primary/30 bg-primary/5" : ""}>
                <CardContent className="p-3 flex items-start gap-3">
                  <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${!n.is_read ? "bg-primary" : "bg-muted"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{n.title}</p>
                      {n.module && <Badge variant="secondary" className="text-[10px]">{n.module}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(n.created_at).toLocaleString()}
                      {n.sender && <span>• From: {n.sender.first_name} {n.sender.last_name}</span>}
                      {n.is_read && n.expires_at && (
                        <span className="text-warning">• Expires: {new Date(n.expires_at).toLocaleTimeString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!n.is_read && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => markRead(n.id)}>
                        <Eye className="h-3 w-3" />
                      </Button>
                    )}
                    {isAdmin && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setDeleteId(n.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <DeleteConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteNotification(deleteId);
            setDeleteId(null);
          }
        }}
        itemName="this notification"
      />
    </AppLayout>
  );
}
