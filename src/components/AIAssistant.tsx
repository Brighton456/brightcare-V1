import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useAuth } from "@/contexts/AuthContext";
import { useHospital } from "@/contexts/HospitalContext";
import {
  Bot, Send, X, ShoppingCart, Package, Users, BarChart3, Pill, Settings,
  Stethoscope, Heart, AlertTriangle, TrendingUp, ClipboardList, FlaskConical,
  CalendarDays, Receipt, Activity,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Role-specific quick prompts
const ROLE_PROMPTS: Record<string, { label: string; icon: any }[]> = {
  doctor: [
    { label: "Show today's appointments", icon: CalendarDays },
    { label: "Any pending lab results for my patients?", icon: FlaskConical },
    { label: "What prescriptions are awaiting dispensing?", icon: Pill },
    { label: "Patient care summary for today", icon: Heart },
    { label: "How to request a lab test?", icon: Stethoscope },
  ],
  nurse: [
    { label: "Current ward admissions", icon: Activity },
    { label: "Pending vitals to record", icon: Heart },
    { label: "Show today's discharge checklist", icon: ClipboardList },
    { label: "How to add nursing notes?", icon: ClipboardList },
  ],
  pharmacist: [
    { label: "What drugs are running low?", icon: Package },
    { label: "Show today's prescriptions to dispense", icon: Pill },
    { label: "Any medicines expiring soon?", icon: AlertTriangle },
    { label: "Today's pharmacy sales summary", icon: TrendingUp },
    { label: "How to process an M-Pesa payment?", icon: ShoppingCart },
  ],
  cashier: [
    { label: "Pending bills to collect", icon: Receipt },
    { label: "Today's revenue summary", icon: TrendingUp },
    { label: "How to process a split payment?", icon: ShoppingCart },
    { label: "Outstanding balances to follow up", icon: AlertTriangle },
  ],
  lab_technician: [
    { label: "Pending lab tests in queue", icon: FlaskConical },
    { label: "Lab consumables running low?", icon: Package },
    { label: "How to enter test results?", icon: ClipboardList },
    { label: "Today's completed tests", icon: Activity },
  ],
  accountant: [
    { label: "Today's financial summary", icon: TrendingUp },
    { label: "Pending insurance claims", icon: Receipt },
    { label: "Outstanding patient balances", icon: AlertTriangle },
    { label: "Revenue breakdown by payment method", icon: BarChart3 },
  ],
  receptionist: [
    { label: "How to register a new patient?", icon: Heart },
    { label: "Today's appointment schedule", icon: CalendarDays },
    { label: "How to book a consultation?", icon: Stethoscope },
    { label: "Current patient queue", icon: Users },
  ],
  default: [
    { label: "How to make a sale?", icon: ShoppingCart },
    { label: "Check low stock items", icon: Package },
    { label: "Today's summary", icon: BarChart3 },
    { label: "System features overview", icon: Settings },
    { label: "How to register a patient?", icon: Heart },
  ],
};

interface AIAssistantProps {
  open: boolean;
  onClose: () => void;
}

export function AIAssistant({ open, onClose }: AIAssistantProps) {
  const { staff } = useAuth();
  const { hospitalId } = useHospital();
  const role = staff?.role || "default";
  const staffName = staff ? `${staff.first_name} ${staff.last_name}` : "Staff";
  const prompts = ROLE_PROMPTS[role] || ROLE_PROMPTS.default;

  const [messages, setMessages] = useState<Message[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset and greet on open
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      if (messages.length === 0) {
        setMessages([{
          id: "welcome",
          role: "assistant",
          content: `👋 **Hello ${staff?.first_name || "there"}!**\n\nI'm **Brightcare AI**, your intelligent assistant. I have access to live system data and can help you with anything related to your ${role.replace(/_/g, " ")} workflow.\n\nTry asking me:\n- Questions about patients, stock, or billing\n- Step-by-step guides for any operation\n- Alerts and insights across departments\n\nWhat can I help you with?`,
          timestamp: new Date(),
        }]);
      }
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isTyping) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: msg, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const history = messages.filter(m => m.id !== "welcome").map(m => ({ role: m.role, content: m.content }));
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          message: msg,
          history,
          staff_role: staff?.role,
          staff_name: staffName,
          staff_id: staff?.id,
          hospital_id: hospitalId,
        },
      });

      if (error) throw error;
      
      const reply = data?.reply || "I'm sorry, I couldn't process that. Please try again.";
      if (data?.alerts?.length) setAlerts(data.alerts);

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: reply,
        timestamp: new Date(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm having a temporary connection issue. Here are quick navigation tips:\n\n- **POS** → Pharmacy POS (F2 for Quick Pick)\n- **Patients** → Patient Registration\n- **Reports** → Reports Center\n- **Lab** → Laboratory module\n\nPlease try again in a moment!",
        timestamp: new Date(),
      }]);
    }
    setIsTyping(false);
  };

  if (!open) return null;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[400px] bg-card border-l shadow-2xl z-50 flex flex-col animate-slide-in">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-primary text-primary-foreground">
        <div className="h-10 w-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
          <Bot className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-sm">Brightcare AI</h3>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs opacity-80">{staff?.first_name} • {role.replace(/_/g, " ")}</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Proactive alerts bar */}
      {alerts.length > 0 && (
        <div className="px-3 py-2 bg-accent/50 border-b max-h-24 overflow-y-auto">
          {alerts.slice(0, 3).map((a, i) => (
            <p key={i} className="text-[11px] text-accent-foreground leading-tight py-0.5">{a}</p>
          ))}
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted rounded-bl-md"
              }`}>
                <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                <p className={`text-[10px] mt-1.5 ${msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Role-specific quick prompts */}
      <div className="px-3 pb-2">
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
          {prompts.map(p => (
            <button key={p.label} onClick={() => handleSend(p.label)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted hover:bg-accent text-xs font-medium whitespace-nowrap shrink-0 transition-colors">
              <p.icon className="h-3 w-3 text-primary" />
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 pt-2 border-t">
        <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2">
          <Input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
            placeholder="Ask anything about your workflow..."
            className="flex-1 rounded-xl" />
          <Button type="submit" size="icon" className="rounded-xl shrink-0" disabled={!input.trim() || isTyping}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="text-[10px] text-center text-muted-foreground mt-2">
          Powered by <span className="font-semibold text-primary">Brightcare AI</span> • All interactions logged
        </p>
      </div>
    </div>
  );
}
