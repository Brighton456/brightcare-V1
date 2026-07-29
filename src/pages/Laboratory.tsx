import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { usePermissions } from "@/hooks/usePermissions";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useHospital } from "@/contexts/HospitalContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import {
  FlaskConical, Clock, CheckCircle, AlertTriangle, Search,
  FileText, TestTube, Activity,
} from "lucide-react";

interface LabTest {
  id: string;
  test_no: string;
  test_name: string;
  test_category: string | null;
  status: string;
  results: string | null;
  normal_range: string | null;
  is_abnormal: boolean;
  fee: number;
  notes: string | null;
  requested_at: string;
  completed_at: string | null;
  patient_id: string;
  patients?: { first_name: string; last_name: string; patient_no: string };
}

export default function Laboratory() {
  const { can, loading: permsLoading } = usePermissions();
  const [tests, setTests] = useState<LabTest[]>([]);
  const [search, setSearch] = useState("");
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [resultForm, setResultForm] = useState({ results: "", normal_range: "", is_abnormal: false, notes: "" });
  const [loading, setLoading] = useState(true);

  const { hospitalId, hospital } = useHospital();
  const taxRate = (hospital?.tax_rate ?? 16) / 100;

  const fetchTests = async () => {
    if (!hospitalId) return;
    const { data } = await supabase.from("lab_tests").select("*, patients(first_name,last_name,patient_no)").eq("hospital_id", hospitalId).order("requested_at", { ascending: false }).limit(100);
    if (data) setTests(data as unknown as LabTest[]);
    setLoading(false);
  };

  useEffect(() => { fetchTests(); }, [hospitalId]);

  const updateTest = async (id: string, updates: any) => {
    const { error } = await supabase.from("lab_tests").update(updates as any).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Test Updated" });
    fetchTests();
  };

  const submitResults = async () => {
    if (!selectedTest) return;
    await updateTest(selectedTest.id, {
      results: resultForm.results,
      normal_range: resultForm.normal_range || null,
      is_abnormal: resultForm.is_abnormal,
      notes: resultForm.notes || null,
      status: "completed",
      completed_at: new Date().toISOString(),
    });

    // Auto-link lab fee to billing — create or update bill for this patient
    if (selectedTest.fee && selectedTest.fee > 0) {
      const { data: existingBill } = await supabase.from("bills")
        .select("id, subtotal, total, tax")
        .eq("patient_id", selectedTest.patient_id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (existingBill) {
        const newSubtotal = (existingBill as any).subtotal + selectedTest.fee;
        const newTax = Math.round(newSubtotal * taxRate * 100) / 100;
        await supabase.from("bills").update({ subtotal: newSubtotal, tax: newTax, total: newSubtotal + newTax } as any).eq("id", (existingBill as any).id);
        await supabase.from("bill_items").insert({ bill_id: (existingBill as any).id, item_type: "lab_test", description: selectedTest.test_name, quantity: 1, unit_price: selectedTest.fee, total: selectedTest.fee , hospital_id: hospitalId } as any);
      } else {
        const tax = Math.round(selectedTest.fee * taxRate * 100) / 100;
        const { data: bill } = await supabase.from("bills").insert({
          patient_id: selectedTest.patient_id,
          bill_no: `BILL-${Date.now().toString().slice(-6)}`,
          subtotal: selectedTest.fee, tax, discount: 0, total: selectedTest.fee + tax,
              hospital_id: hospitalId,
    } as any).select().single();
        if (bill) {
          await supabase.from("bill_items").insert({ bill_id: (bill as any).id, item_type: "lab_test", description: selectedTest.test_name, quantity: 1, unit_price: selectedTest.fee, total: selectedTest.fee , hospital_id: hospitalId } as any);
        }
      }
    }

    // Auto-deduct consumables if this test has a linked service bundle
    try {
      const { data: bundle } = await supabase.from("lab_service_bundles")
        .select("id")
        .eq("hospital_id", hospitalId)
        .ilike("service_name", selectedTest.test_name)
        .eq("is_active", true)
        .limit(1)
        .single();

      if (bundle) {
        const { data: bundleConsumables } = await supabase.from("lab_service_consumables")
          .select("consumable_id, quantity_required")
          .eq("service_bundle_id", (bundle as any).id);

        if (bundleConsumables && bundleConsumables.length > 0) {
          const deductions = (bundleConsumables as any[]).map(async (bc) => {
            if (!bc.consumable_id) return;
            const { data: con } = await supabase.from("lab_consumables").select("stock").eq("id", bc.consumable_id).single();
            if (con) {
              const newStock = Math.max(0, ((con as any).stock || 0) - bc.quantity_required);
              await supabase.from("lab_consumables").update({ stock: newStock } as any).eq("id", bc.consumable_id);
            }
          });
          await Promise.all(deductions);
        }
      }
    } catch (e) {
      console.error("Consumable deduction error:", e);
    }

    toast({ title: "Results submitted", description: "Patient record updated, doctor notified, billing linked, and consumables deducted." });
    setSelectedTest(null);
  };

  const openResult = (t: LabTest) => {
    setSelectedTest(t);
    setResultForm({
      results: t.results || "",
      normal_range: t.normal_range || "",
      is_abnormal: t.is_abnormal,
      notes: t.notes || "",
    });
  };

  const requested = tests.filter(t => t.status === "requested");
  const inProgress = tests.filter(t => ["sample_collected", "in_progress"].includes(t.status));
  const completed = tests.filter(t => t.status === "completed");

  const filtered = tests.filter(t => {
    const q = search.toLowerCase();
    return t.test_name.toLowerCase().includes(q) || t.test_no.toLowerCase().includes(q) ||
      (t.patients?.first_name || "").toLowerCase().includes(q) || (t.patients?.last_name || "").toLowerCase().includes(q);
  });

  const statusColors: Record<string, string> = {
    requested: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    sample_collected: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    in_progress: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  };

  return (
    <AppLayout title="Laboratory">
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Pending", value: requested.length, icon: Clock, color: "text-amber-600" },
            { label: "In Progress", value: inProgress.length, icon: Activity, color: "text-blue-600" },
            { label: "Completed", value: completed.length, icon: CheckCircle, color: "text-emerald-600" },
            { label: "Abnormal", value: tests.filter(t => t.is_abnormal).length, icon: AlertTriangle, color: "text-destructive" },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-3 p-3 rounded-xl border bg-card">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div><p className="text-lg font-bold">{s.value}</p><p className="text-[11px] text-muted-foreground">{s.label}</p></div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tests..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        {/* Test List */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold">Test</th>
                  <th className="text-left p-3 font-semibold">Patient</th>
                  <th className="text-left p-3 font-semibold hidden md:table-cell">Category</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold hidden lg:table-cell">Date</th>
                  <th className="text-right p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : (search ? filtered : tests).length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No lab tests found</td></tr>
                ) : (search ? filtered : tests).map(t => (
                  <tr key={t.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <TestTube className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-semibold">{t.test_name}</p>
                          <p className="text-xs text-muted-foreground">{t.test_no}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-xs">{t.patients?.first_name} {t.patients?.last_name}</td>
                    <td className="p-3 text-xs hidden md:table-cell">{t.test_category || "—"}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[t.status] || ""}`}>{t.status.replace("_", " ")}</span>
                    </td>
                    <td className="p-3 text-xs hidden lg:table-cell">{new Date(t.requested_at).toLocaleDateString()}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {t.status !== "completed" && (
                          <>
                            {t.status === "requested" && can("start_lab_test") && (
                              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateTest(t.id, { status: "sample_collected" })}>Collect Sample</Button>
                            )}
                            {can("enter_lab_results") && (
                              <Button size="sm" className="text-xs h-7" onClick={() => openResult(t)}>Enter Results</Button>
                            )}
                          </>
                        )}
                        {t.status === "completed" && can("view_lab_results") && (
                          <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => openResult(t)}>View</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Result Entry Dialog */}
      <Dialog open={!!selectedTest} onOpenChange={() => setSelectedTest(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" /> {selectedTest?.status === "completed" ? "Test Results" : "Enter Results"} — {selectedTest?.test_no}
            </DialogTitle>
          </DialogHeader>
          {selectedTest && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 border text-sm">
                <p className="font-semibold">{selectedTest.test_name}</p>
                <p className="text-xs text-muted-foreground">Patient: {selectedTest.patients?.first_name} {selectedTest.patients?.last_name} ({selectedTest.patients?.patient_no})</p>
              </div>
              <div><Label>Results *</Label><Textarea value={resultForm.results} onChange={e => setResultForm(f => ({ ...f, results: e.target.value }))} placeholder="Enter test results..." rows={4} /></div>
              <div><Label>Normal Range</Label><Input value={resultForm.normal_range} onChange={e => setResultForm(f => ({ ...f, normal_range: e.target.value }))} placeholder="e.g. 4.0 - 10.0 x10^9/L" /></div>
              <div className="flex items-center gap-2">
                <Switch checked={resultForm.is_abnormal} onCheckedChange={v => setResultForm(f => ({ ...f, is_abnormal: v }))} />
                <Label>Mark as Abnormal</Label>
              </div>
              <div><Label>Notes</Label><Textarea value={resultForm.notes} onChange={e => setResultForm(f => ({ ...f, notes: e.target.value }))} /></div>
              {selectedTest.status !== "completed" && (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedTest(null)}>Cancel</Button>
                  <Button onClick={submitResults}>Submit Results</Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
