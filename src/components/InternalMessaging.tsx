import { useState, useEffect } from "react";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { MessageSquare, Send, X, Clock, Inbox } from "lucide-react";

const DEPARTMENTS = [
  "Reception", "Doctor Console", "Laboratory", "Pharmacy", "Billing",
  "Nursing", "Radiology", "ICU", "Operation Theatre", "Administration",
  "Records", "Emergency", "Outpatient", "Inpatient",
];

interface Message {
  id: string;
  sender_department: string;
  recipient_department: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
  expires_at: string;
}

interface Props {
  currentDepartment: string;
  open: boolean;
  onClose: () => void;
}

export function InternalMessaging({ currentDepartment, open, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [tab, setTab] = useState<"inbox" | "compose">("inbox");
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const fetchMessages = async () => {
    const now = new Date().toISOString();
    const { data } = await supabase
      .from("internal_messages")
      .select("*")
      .eq("recipient_department", currentDepartment)
      .gt("expires_at", now)
      .order("created_at", { ascending: false });
    setMessages((data || []) as Message[]);
  };

  useEffect(() => {
    if (open) fetchMessages();
  }, [open, currentDepartment]);

  const sendMessage = async () => {
    if (!recipient || !subject || !body) {
      toast({ title: "Fill all fields", variant: "destructive" });
      return;
    }
    await supabase.from("internal_messages").insert({
      sender_department: currentDepartment,
      recipient_department: recipient,
      subject,
      message: body,
      expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    } as any);
    
    // Also create a notification for the recipient department
    await supabase.from("notifications").insert({
      title: `Message from ${currentDepartment}`,
      message: `${subject}: ${body.slice(0, 100)}...`,
      module: "internal_messaging",
      expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    } as any);

    toast({ title: "Message sent", description: `Sent to ${recipient} department` });
    setRecipient("");
    setSubject("");
    setBody("");
    setTab("inbox");
    fetchMessages();
  };

  const markRead = async (id: string) => {
    await supabase.from("internal_messages").update({ is_read: true, read_at: new Date().toISOString() } as any).eq("id", id);
    setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Internal Messaging — {currentDepartment}
            {unreadCount > 0 && <Badge variant="destructive" className="text-[10px]">{unreadCount} new</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-1 border-b pb-2">
          <Button variant={tab === "inbox" ? "default" : "ghost"} size="sm" onClick={() => setTab("inbox")} className="gap-1 text-xs">
            <Inbox className="h-3.5 w-3.5" /> Inbox ({messages.length})
          </Button>
          <Button variant={tab === "compose" ? "default" : "ghost"} size="sm" onClick={() => setTab("compose")} className="gap-1 text-xs">
            <Send className="h-3.5 w-3.5" /> Compose
          </Button>
        </div>

        {tab === "inbox" ? (
          <ScrollArea className="flex-1 min-h-0">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Inbox className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No messages</p>
              </div>
            ) : messages.map(m => (
              <div key={m.id} onClick={() => markRead(m.id)}
                className={`p-3 border-b cursor-pointer hover:bg-muted/30 ${!m.is_read ? "bg-primary/5" : ""}`}>
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-[9px]">From: {m.sender_department}</Badge>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                <p className={`text-xs ${!m.is_read ? "font-bold" : "font-medium"}`}>{m.subject}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{m.message}</p>
                <p className="text-[9px] text-muted-foreground/60 mt-1">Expires: {new Date(m.expires_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            ))}
          </ScrollArea>
        ) : (
          <div className="space-y-3 flex-1">
            <div>
              <Label className="text-xs">To Department *</Label>
              <Select value={recipient} onValueChange={setRecipient}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.filter(d => d !== currentDepartment).map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Subject *</Label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g., Lab results ready" className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Message *</Label>
              <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Type your message..." rows={4} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setTab("inbox")}>Cancel</Button>
              <Button size="sm" onClick={sendMessage} className="gap-1"><Send className="h-3.5 w-3.5" /> Send</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
