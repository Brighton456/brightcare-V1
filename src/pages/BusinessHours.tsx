import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { toast } from "@/hooks/use-toast";
import { Clock, Calendar, Plus, Trash2, Save } from "lucide-react";
import { useHospital } from "@/contexts/HospitalContext";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function BusinessHours() {
  const { hospitalId } = useHospital();
  const [hours, setHours] = useState<any[]>([]);
  const [inactiveDays, setInactiveDays] = useState<any[]>([]);
  const [showAddInactive, setShowAddInactive] = useState(false);
  const [inactiveForm, setInactiveForm] = useState({ date: "", reason: "" });

  const fetchData = async () => {
    const [hRes, iRes] = await Promise.all([
      supabase.from("business_hours").select("*").eq("hospital_id", hospitalId).order("day_of_week"),
      supabase.from("inactive_days").select("*").eq("hospital_id", hospitalId).order("date", { ascending: false }).limit(50),
    ]);
    if (hRes.data) setHours(hRes.data as any[]);
    if (iRes.data) setInactiveDays(iRes.data as any[]);
  };

  useEffect(() => { fetchData(); }, [hospitalId]);

  const updateHour = (dayOfWeek: number, field: string, value: any) => {
    setHours(prev => prev.map((h: any) => h.day_of_week === dayOfWeek ? { ...h, [field]: value } : h));
  };

  const saveHours = async () => {
    for (const h of hours) {
      await supabase.from("business_hours").update({
        is_active: h.is_active,
        open_time: h.open_time,
        close_time: h.close_time,
      } as any).eq("day_of_week", h.day_of_week);
    }
    toast({ title: "Business Hours Saved" });
  };

  const addInactiveDay = async () => {
    if (!inactiveForm.date) return;
    await supabase.from("inactive_days").insert({ date: inactiveForm.date, reason: inactiveForm.reason || null , hospital_id: hospitalId } as any);
    toast({ title: "Inactive Day Added" });
    setShowAddInactive(false);
    setInactiveForm({ date: "", reason: "" });
    fetchData();
  };

  const removeInactiveDay = async (id: string) => {
    await supabase.from("inactive_days").delete().eq("id", id);
    toast({ title: "Inactive Day Removed" });
    fetchData();
  };

  return (
    <AppLayout title="Business Hours">
      <div className="space-y-4 max-w-3xl">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" />Weekly Schedule</CardTitle>
              <Button size="sm" onClick={saveHours}><Save className="h-3 w-3 mr-1" /> Save</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {hours.map((h: any) => (
              <div key={h.day_of_week} className={`flex items-center gap-4 p-3 rounded-lg border ${!h.is_active ? "opacity-50 bg-muted/30" : ""}`}>
                <Switch checked={h.is_active} onCheckedChange={v => updateHour(h.day_of_week, "is_active", v)} />
                <span className="w-24 text-sm font-semibold">{DAYS[h.day_of_week]}</span>
                {h.is_active ? (
                  <div className="flex items-center gap-2">
                    <Input type="time" value={h.open_time} onChange={e => updateHour(h.day_of_week, "open_time", e.target.value)} className="w-32 h-8 text-xs" />
                    <span className="text-xs text-muted-foreground">to</span>
                    <Input type="time" value={h.close_time} onChange={e => updateHour(h.day_of_week, "close_time", e.target.value)} className="w-32 h-8 text-xs" />
                  </div>
                ) : (
                  <Badge variant="secondary" className="text-[10px]">Closed</Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4" />Inactive / Holiday Days</CardTitle>
              <Button size="sm" onClick={() => setShowAddInactive(true)}><Plus className="h-3 w-3 mr-1" /> Add</Button>
            </div>
          </CardHeader>
          <CardContent>
            {inactiveDays.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No inactive days marked</p>
            ) : (
              <div className="space-y-2">
                {inactiveDays.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between p-2 rounded border">
                    <div>
                      <p className="text-sm font-semibold">{new Date(d.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
                      {d.reason && <p className="text-xs text-muted-foreground">{d.reason}</p>}
                    </div>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeInactiveDay(d.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showAddInactive} onOpenChange={setShowAddInactive}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Inactive Day</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Date</Label><Input type="date" value={inactiveForm.date} onChange={e => setInactiveForm(f => ({ ...f, date: e.target.value }))} /></div>
            <div><Label>Reason (optional)</Label><Textarea value={inactiveForm.reason} onChange={e => setInactiveForm(f => ({ ...f, reason: e.target.value }))} placeholder="e.g. Public Holiday" /></div>
            <Button onClick={addInactiveDay} className="w-full">Add Inactive Day</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
