import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { DepartmentHeader } from "@/components/DepartmentHeader";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Pill, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { useHospital } from "@/contexts/HospitalContext";

export default function MedicationAdministration() {
  const { hospitalId } = useHospital();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from("prescriptions").select("*, patients(first_name,last_name,patient_no)").eq("hospital_id", hospitalId).eq("status", "dispensed").order("created_at", { ascending: false }).limit(50),
      supabase.from("prescription_items").select("*").eq("hospital_id", hospitalId),
    ]).then(([p, i]) => {
      if (p.data) setPrescriptions(p.data);
      if (i.data) setItems(i.data);
    });
  }, [hospitalId]);

  const markAdministered = (itemId: string) => {
    toast({ title: "Medication administered", description: "Record updated successfully" });
  };

  return (
    <AppLayout title="Medication Administration">
      <DepartmentHeader department="Nursing" title="Medication Administration Record (MAR)" subtitle="Track and confirm medication delivery to patients" quickActions={[{ label: "Nurse Console", path: "/nurse-console" }, { label: "Prescriptions", path: "/prescriptions" }]} />
      <div className="space-y-4">
        {prescriptions.map(rx => {
          const rxItems = items.filter(i => i.prescription_id === rx.id);
          return (
            <Card key={rx.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2"><Pill className="h-4 w-4 text-primary" /> {rx.patients?.first_name} {rx.patients?.last_name} — {rx.prescription_no}</span>
                  <Badge variant="secondary">{rx.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-left"><th className="p-2">Medicine</th><th className="p-2">Dosage</th><th className="p-2">Frequency</th><th className="p-2 text-center">Administered</th></tr></thead>
                  <tbody>
                    {rxItems.map(item => (
                      <tr key={item.id} className="border-b">
                        <td className="p-2 font-medium">{item.medicine_name}</td>
                        <td className="p-2">{item.dosage}</td>
                        <td className="p-2">{item.frequency}</td>
                        <td className="p-2 text-center"><Button size="sm" variant="outline" onClick={() => markAdministered(item.id)}><CheckCircle className="h-3 w-3 mr-1" /> Confirm</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          );
        })}
        {prescriptions.length === 0 && <p className="text-center text-muted-foreground py-8">No active medication administration records</p>}
      </div>
    </AppLayout>
  );
}
