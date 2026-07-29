import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const DEPARTMENTS = [
  "Reception", "Doctor & Consultation", "Laboratory", "Pharmacy", "Billing",
  "Inpatient & Ward", "Nursing", "Emergency", "Radiology", "Blood Bank",
  "Operation Theatre", "Nutrition", "Physiotherapy", "Administration", "ICU",
];

interface QuickAction { label: string; path: string; icon?: React.ReactNode; }

interface Props {
  department: string;
  title: string;
  subtitle?: string;
  quickActions?: QuickAction[];
}

export function DepartmentHeader({ department, title, subtitle, quickActions }: Props) {
  const [msgOpen, setMsgOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();

  const sendMessage = async () => {
    if (!recipient || !subject || !message) { toast({ title: "All fields required", variant: "destructive" }); return; }
    setSending(true);
    const { error } = await supabase.from("internal_messages").insert({
      sender_department: department, recipient_department: recipient, subject, message,
    });
    setSending(false);
    if (error) { toast({ title: "Failed to send", variant: "destructive" }); return; }
    toast({ title: "Message sent", description: `To ${recipient}` });
    setMsgOpen(false); setRecipient(""); setSubject(""); setMessage("");
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {quickActions?.map(a => (
            <Button key={a.path} size="sm" variant="outline" onClick={() => navigate(a.path)}>
              {a.icon} {a.label} <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          ))}
          <Button size="sm" variant="secondary" onClick={() => setMsgOpen(true)}>
            <MessageSquare className="h-4 w-4 mr-1" /> Message Dept
          </Button>
        </div>
      </div>

      <Dialog open={msgOpen} onOpenChange={setMsgOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send Internal Message</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>From</Label><Input value={department} disabled /></div>
            <div>
              <Label>To Department</Label>
              <Select value={recipient} onValueChange={setRecipient}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>{DEPARTMENTS.filter(d => d !== department).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Subject</Label><Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Message subject" /></div>
            <div><Label>Message</Label><Textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} placeholder="Type your message..." /></div>
            <Button onClick={sendMessage} disabled={sending} className="w-full"><Send className="h-4 w-4 mr-2" /> Send Message</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
