import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useState, useEffect } from "react";
import { LogOut, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHospital } from "@/contexts/HospitalContext";

export default function DischargeWorkflow() {
  const { hospitalId, hospital } = useHospital();
  const taxRate = (hospital?.tax_rate ?? 16) / 100;
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const fetch = async () => {
    const { data } = await supabase.from("admissions").select("*, patients(first_name,last_name,patient_no), staff(first_name,last_name), beds(bed_number, daily_rate)").eq("hospital_id", hospitalId).eq("status", "admitted");
    setAdmissions(data || []);
  };
  useEffect(() => { fetch(); }, [hospitalId]);

  const discharge = async (id: string) => {
    const admission = admissions.find(a => a.id === id);
    
    // Discharge the patient
    await supabase.from("admissions").update({ status: "discharged", discharged_at: new Date().toISOString(), discharge_summary: summaries[id] || "" }).eq("id", id);
    
    // Release the bed
    if (admission?.bed_id) {
      await supabase.from("beds").update({ status: "available" } as any).eq("id", admission.bed_id);
    }

    // Auto-generate final consolidated bill for inpatient charges
    if (admission?.patient_id) {
      const admittedDate = new Date(admission.admitted_at || admission.created_at);
      const days = Math.max(1, Math.ceil((Date.now() - admittedDate.getTime()) / (1000 * 60 * 60 * 24)));
      const bedRate = admission.beds?.daily_rate || 2000;
      const bedTotal = days * bedRate;
      
      const { data: bill } = await supabase.from("bills").insert({
        patient_id: admission.patient_id,
        bill_no: `BILL-${Date.now().toString().slice(-6)}`,
        subtotal: bedTotal,
        tax: Math.round(bedTotal * taxRate * 100) / 100,
        discount: 0,
        total: Math.round(bedTotal * (1 + taxRate) * 100) / 100,
        notes: `Inpatient discharge — ${admission.admission_no} — ${days} day(s) bed charges`,
            hospital_id: hospitalId,
    } as any).select().single();
      
      if (bill) {
        await supabase.from("bill_items").insert({
          bill_id: (bill as any).id,
          item_type: "inpatient",
          description: `Bed charges (${days} days × KES ${bedRate})`,
          quantity: days,
          unit_price: bedRate,
          total: bedTotal,
              hospital_id: hospitalId,
    } as any);
      }
    }
    
    toast({ title: "Patient discharged", description: "Bed released, final bill generated with inpatient charges." }); fetch();
  };

  return (
    <AppLayout title="Discharge Workflow">
      <div className="space-y-6">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><LogOut className="h-5 w-5" />Patients Ready for Discharge</CardTitle></CardHeader><CardContent>
          <Table><TableHeader><TableRow><TableHead>Patient</TableHead><TableHead>Admission#</TableHead><TableHead>Bed</TableHead><TableHead>Doctor</TableHead><TableHead>Discharge Summary</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
            <TableBody>{admissions.map(a => (
              <TableRow key={a.id}><TableCell className="font-medium">{a.patients?.first_name} {a.patients?.last_name}</TableCell><TableCell className="font-mono text-xs">{a.admission_no}</TableCell><TableCell>{a.beds?.bed_number || "—"}</TableCell><TableCell>Dr. {a.staff?.first_name || "—"}</TableCell><TableCell><Textarea value={summaries[a.id] || ""} onChange={e => setSummaries({ ...summaries, [a.id]: e.target.value })} placeholder="Enter discharge summary..." rows={2} className="text-xs" /></TableCell><TableCell><Button size="sm" onClick={() => discharge(a.id)}><CheckCircle2 className="h-3 w-3 mr-1" />Discharge</Button></TableCell></TableRow>
            ))}{admissions.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No patients to discharge</TableCell></TableRow>}</TableBody></Table>
        </CardContent></Card>
      </div>
    </AppLayout>
  );
}
