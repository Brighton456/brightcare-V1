import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { DepartmentHeader } from "@/components/DepartmentHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Clock, User, ArrowRight } from "lucide-react";

interface Note { id: string; from: string; to: string; content: string; time: string; priority: string; }

export default function HandoverBoard() {
  const [notes, setNotes] = useState<Note[]>([
    { id: "1", from: "Morning Shift", to: "Afternoon Shift", content: "Patient in Bed 3A requires vitals every 2 hours. IV antibiotics due at 14:00.", time: new Date().toLocaleTimeString(), priority: "high" },
    { id: "2", from: "Morning Shift", to: "Afternoon Shift", content: "New admission expected from Emergency around 15:00. Prepare isolation room.", time: new Date().toLocaleTimeString(), priority: "medium" },
  ]);
  const [newNote, setNewNote] = useState("");

  const addNote = () => {
    if (!newNote.trim()) return;
    setNotes(prev => [{ id: Date.now().toString(), from: "Current Shift", to: "Next Shift", content: newNote, time: new Date().toLocaleTimeString(), priority: "normal" }, ...prev]);
    setNewNote(""); toast({ title: "Handover note added" });
  };

  return (
    <AppLayout title="Handover Board">
      <DepartmentHeader department="Nursing" title="Shift Handover Board" subtitle="Digital handover notes between shifts" quickActions={[{ label: "Nurse Console", path: "/nurse-console" }, { label: "Ward Rounds", path: "/ward-rounds" }]} />
      <Card className="mb-6">
        <CardContent className="pt-4">
          <Textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add a handover note for the next shift..." rows={3} />
          <Button className="mt-3" onClick={addNote}><Plus className="h-4 w-4 mr-1" /> Add Note</Button>
        </CardContent>
      </Card>
      <div className="space-y-3">
        {notes.map(n => (
          <Card key={n.id}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><User className="h-3 w-3" />{n.from}<ArrowRight className="h-3 w-3" />{n.to}</div>
                <div className="flex items-center gap-2"><Clock className="h-3 w-3 text-muted-foreground" /><span className="text-xs">{n.time}</span>
                  <Badge variant={n.priority === "high" ? "destructive" : n.priority === "medium" ? "secondary" : "outline"} className="text-xs">{n.priority}</Badge>
                </div>
              </div>
              <p className="text-sm">{n.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
