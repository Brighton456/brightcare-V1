import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useState, useEffect } from "react";
import { Save, FlaskConical, CheckCircle, Clock, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHospital } from "@/contexts/HospitalContext";

export default function LabResultsEntry() {
  const { hospitalId } = useHospital();
  const [pendingTests, setPendingTests] = useState<any[]>([]);
  const [completedTests, setCompletedTests] = useState<any[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [result, setResult] = useState("");
  const [normalRange, setNormalRange] = useState("");
  const [abnormal, setAbnormal] = useState(false);
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const fetchTests = async () => {
    const [pRes, cRes] = await Promise.all([
      supabase.from("lab_tests").select("*, patients(first_name,last_name,patient_no)").eq("hospital_id", hospitalId).in("status", ["in_progress", "sample_collected"]).order("requested_at"),
      supabase.from("lab_tests").select("*, patients(first_name,last_name,patient_no)").eq("hospital_id", hospitalId).eq("status", "completed").order("completed_at", { ascending: false }).limit(50),
    ]);
    setPendingTests(pRes.data || []);
    setCompletedTests(cRes.data || []);
  };
  useEffect(() => { fetchTests(); }, [hospitalId]);

  const saveResult = async () => {
    if (!editId || !result) { toast({ title: "Enter results first", variant: "destructive" }); return; }
    const test = pendingTests.find(t => t.id === editId);
    
    // Save result and mark complete
    await supabase.from("lab_tests").update({ 
      results: result, normal_range: normalRange, is_abnormal: abnormal, 
      notes, status: "completed", completed_at: new Date().toISOString() 
    } as any).eq("id", editId);
    
    // Notify the requesting doctor
    if (test?.requested_by) {
      const patientName = `${test.patients?.first_name || ""} ${test.patients?.last_name || ""}`.trim();
      await supabase.from("notifications").insert({
        hospital_id: hospitalId,
        recipient_staff_id: test.requested_by,
        title: `Lab Result Ready: ${test.test_name}`,
        message: `${test.test_name} results for ${patientName} (${test.test_no}) are now available.${abnormal ? " ⚠️ ABNORMAL results flagged." : ""} Please review and write prescription if needed.`,
        module: "laboratory",
        reference_id: test.id,
      });
    }

    // Also send inter-departmental message to doctor's department
    if (test?.requested_by) {
      const { data: doctorData } = await supabase.from("staff").select("departments(name)").eq("id", test.requested_by).single();
      const doctorDept = (doctorData as any)?.departments?.name || "Medical";
      await supabase.from("internal_messages").insert({
        hospital_id: hospitalId,
        sender_department: "Laboratory",
        recipient_department: doctorDept,
        subject: `Lab Result: ${test.test_name}`,
        message: `Results for ${test.patients?.first_name} ${test.patients?.last_name} (${test.test_no}) - ${test.test_name}: ${result}${abnormal ? " [ABNORMAL]" : ""}. Please review and prescribe accordingly.`,
      });
    }

    toast({ 
      title: "✅ Result saved & doctor notified", 
      description: "The requesting doctor has been notified to review results and write a prescription." 
    });
    setEditId(null); setResult(""); setNormalRange(""); setAbnormal(false); setNotes("");
    fetchTests();
  };

  const selectTest = (t: any) => {
    setEditId(t.id);
    setResult(t.results || "");
    setNormalRange(t.normal_range || "");
    setAbnormal(t.is_abnormal || false);
    setNotes(t.notes || "");
  };

  return (
    <AppLayout title="Enter Lab Results">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending" className="gap-1"><Clock className="h-3.5 w-3.5" /> Pending ({pendingTests.length})</TabsTrigger>
              <TabsTrigger value="completed" className="gap-1"><CheckCircle className="h-3.5 w-3.5" /> Completed ({completedTests.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="pending">
              <Card><CardContent className="pt-4">
                <Table><TableHeader><TableRow><TableHead>Test</TableHead><TableHead>Patient</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {pendingTests.map(t => (
                      <TableRow key={t.id} className={editId === t.id ? "bg-muted" : ""}>
                        <TableCell>
                          <p className="font-medium text-sm">{t.test_name}</p>
                          <p className="text-xs text-muted-foreground">{t.test_no} · {t.test_category}</p>
                        </TableCell>
                        <TableCell className="text-sm">{t.patients?.first_name} {t.patients?.last_name}</TableCell>
                        <TableCell><Button size="sm" variant={editId === t.id ? "default" : "outline"} onClick={() => selectTest(t)}>Enter Result</Button></TableCell>
                      </TableRow>
                    ))}
                    {pendingTests.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No pending tests</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent></Card>
            </TabsContent>
            <TabsContent value="completed">
              <Card><CardContent className="pt-4">
                <Table><TableHeader><TableRow><TableHead>Test</TableHead><TableHead>Patient</TableHead><TableHead>Result</TableHead><TableHead>Flag</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {completedTests.map(t => (
                      <TableRow key={t.id}>
                        <TableCell className="text-sm font-medium">{t.test_name}</TableCell>
                        <TableCell className="text-sm">{t.patients?.first_name} {t.patients?.last_name}</TableCell>
                        <TableCell className="text-xs max-w-32 truncate">{t.results}</TableCell>
                        <TableCell>{t.is_abnormal && <Badge variant="destructive">Abnormal</Badge>}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent></Card>
            </TabsContent>
          </Tabs>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><FlaskConical className="h-5 w-5" />{editId ? "Enter Results" : "Select a test"}</CardTitle></CardHeader>
          <CardContent>
            {editId ? (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-muted/50 border text-sm">
                  <p className="font-semibold">{pendingTests.find(t => t.id === editId)?.test_name}</p>
                  <p className="text-xs text-muted-foreground">Patient: {pendingTests.find(t => t.id === editId)?.patients?.first_name} {pendingTests.find(t => t.id === editId)?.patients?.last_name}</p>
                </div>
                <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 text-xs text-primary flex items-start gap-2">
                  <Bell className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>When you save results, the requesting doctor will be automatically notified to review and write a prescription.</span>
                </div>
                <div><Label>Result *</Label><Textarea value={result} onChange={e => setResult(e.target.value)} placeholder="Enter test results..." rows={4} /></div>
                <div><Label>Normal Range</Label><Input value={normalRange} onChange={e => setNormalRange(e.target.value)} placeholder="e.g. 70-100 mg/dL" /></div>
                <div className="flex items-center gap-2"><Checkbox checked={abnormal} onCheckedChange={v => setAbnormal(!!v)} /><Label>Flag as Abnormal</Label></div>
                <div><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Additional observations or recommendations..." /></div>
                <Button onClick={saveResult} className="w-full"><Save className="h-4 w-4 mr-2" />Save & Notify Doctor</Button>
              </div>
            ) : <p className="text-center text-muted-foreground py-12">Select a test from the left panel to enter results</p>}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
