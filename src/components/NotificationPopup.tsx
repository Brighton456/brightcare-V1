import { useState, useEffect } from "react";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { X, Bell, MessageSquare, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  title: string;
  message: string;
  module: string | null;
  is_read: boolean;
  created_at: string;
  expires_at: string | null;
}

export function NotificationPopup() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [newPopup, setNewPopup] = useState<Notification | null>(null);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    // Filter out expired
    const now = new Date();
    const valid = (data || []).filter((n: any) => !n.expires_at || new Date(n.expires_at) > now) as Notification[];
    setNotifications(valid);
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    // Subscribe to realtime
    const channel = supabase
      .channel("notifications-popup")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
        const n = payload.new as Notification;
        setNotifications(prev => [n, ...prev]);
        setNewPopup(n);
        // Auto-dismiss popup after 8 seconds
        setTimeout(() => setNewPopup(prev => prev?.id === n.id ? null : prev), 8000);
      })
      .subscribe();

    // Auto-delete expired notifications every 5 minutes
    const cleanup = setInterval(async () => {
      await supabase.from("notifications").delete().lt("expires_at", new Date().toISOString());
    }, 300000);

    return () => { channel.unsubscribe(); clearInterval(interval); clearInterval(cleanup); };
  }, []);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() } as any).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    for (const n of unread) {
      await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() } as any).eq("id", n.id);
    }
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const moduleIcon = (mod: string | null) => {
    if (mod?.includes("lab")) return <AlertTriangle className="h-4 w-4 text-warning" />;
    if (mod?.includes("billing") || mod?.includes("payment")) return <CheckCircle className="h-4 w-4 text-success" />;
    return <MessageSquare className="h-4 w-4 text-primary" />;
  };

  return (
    <>
      {/* Floating popup for new notifications */}
      {newPopup && (
        <div className="fixed top-4 right-4 z-[100] w-80 bg-card border-2 border-primary/30 rounded-xl shadow-2xl animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="p-4">
            <div className="flex items-start gap-3">
              {moduleIcon(newPopup.module)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{newPopup.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{newPopup.message}</p>
                {newPopup.module && <Badge variant="outline" className="text-[9px] mt-1">{newPopup.module}</Badge>}
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => { setNewPopup(null); markRead(newPopup.id); }}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bell button */}
      <button onClick={() => setShowPanel(!showPanel)} className="relative p-2 rounded-lg hover:bg-muted transition-colors">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-destructive text-[10px] font-bold flex items-center justify-center text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Side panel */}
      {showPanel && (
        <div className="fixed right-0 top-0 bottom-0 w-[360px] bg-card border-l shadow-2xl z-[90] flex flex-col animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-sm">Notifications</h3>
              {unreadCount > 0 && <Badge variant="destructive" className="text-[10px]">{unreadCount}</Badge>}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && <Button variant="ghost" size="sm" className="text-xs" onClick={markAllRead}>Mark all read</Button>}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPanel(false)}><X className="h-4 w-4" /></Button>
            </div>
          </div>
          <ScrollArea className="flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : notifications.map(n => (
              <div key={n.id} onClick={() => markRead(n.id)}
                className={`p-3 border-b cursor-pointer hover:bg-muted/30 transition-colors ${!n.is_read ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}>
                <div className="flex items-start gap-2.5">
                  {moduleIcon(n.module)}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs ${!n.is_read ? "font-bold" : "font-medium"}`}>{n.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{n.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {n.module && <Badge variant="outline" className="text-[9px]">{n.module}</Badge>}
                      <span className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                  {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />}
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>
      )}
    </>
  );
}
