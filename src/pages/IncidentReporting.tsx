import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Plus, Save } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function IncidentReporting() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", category: "clinical", severity: "low", description: "", location: "" });
  const { toast } = useToast();

  const submit = () => {
    setIncidents([{ ...form, id: Date.now(), date: new Date().toISOString(), status: "open" }, ...incidents]);
    toast({ title: "Incident reported" });
    setShowForm(false);
    setForm({ title: "", category: "clinical", severity: "low", description: "", location: "" });
  };

  return (
    <AppLayout title="Incident Reporting">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="grid grid-cols-3 gap-4">
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Open</p><p className="text-2xl font-black text-warning">{incidents.filter(i => i.status === "open").length}</p></CardContent></Card>
          </div>
          <Button onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 mr-2" />Report Incident</Button>
        </div>
        {showForm && <Card><CardHeader><CardTitle>New Incident Report</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Location</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Ward, department, room..." /></div>
            <div><Label>Category</Label><Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="clinical">Clinical</SelectItem><SelectItem value="safety">Safety</SelectItem><SelectItem value="equipment">Equipment</SelectItem><SelectItem value="security">Security</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
            <div><Label>Severity</Label><Select value={form.severity} onValueChange={v => setForm({ ...form, severity: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="critical">Critical</SelectItem></SelectContent></Select></div>
          </div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} /></div>
          <Button onClick={submit}><Save className="h-4 w-4 mr-2" />Submit Report</Button>
        </CardContent></Card>}
        <div className="space-y-3">{incidents.map(i => (
          <Card key={i.id}><CardContent className="pt-4 flex items-start gap-3"><AlertTriangle className={`h-5 w-5 shrink-0 ${i.severity === "critical" ? "text-destructive" : "text-warning"}`} /><div className="flex-1"><div className="flex items-center gap-2"><p className="font-bold">{i.title}</p><Badge variant={i.severity === "critical" ? "destructive" : "secondary"}>{i.severity}</Badge><Badge variant="outline">{i.category}</Badge></div><p className="text-sm text-muted-foreground mt-1">{i.description}</p><p className="text-xs text-muted-foreground mt-1">Location: {i.location} • {new Date(i.date).toLocaleString()}</p></div></CardContent></Card>
        ))}</div>
      </div>
    </AppLayout>
  );
}
