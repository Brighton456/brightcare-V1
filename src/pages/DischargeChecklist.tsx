import { AppLayout } from "@/components/AppLayout";
import { DepartmentHeader } from "@/components/DepartmentHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const CHECKLIST = [
  { id: "vitals", label: "Final vitals recorded and within normal range" },
  { id: "meds", label: "Discharge medications prescribed and dispensed" },
  { id: "instructions", label: "Discharge instructions given and acknowledged" },
  { id: "followup", label: "Follow-up appointment scheduled" },
  { id: "billing", label: "All bills settled or payment plan arranged" },
  { id: "transport", label: "Transport arranged for patient" },
  { id: "records", label: "Medical records updated and discharge summary completed" },
  { id: "belongings", label: "Patient belongings returned" },
  { id: "referral", label: "Referral letters provided if applicable" },
  { id: "diet", label: "Dietary instructions provided" },
  { id: "wound", label: "Wound care instructions given if applicable" },
  { id: "equipment", label: "Medical equipment returned or arranged for home use" },
];

export default function DischargeChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const completed = Object.values(checked).filter(Boolean).length;

  return (
    <AppLayout title="Discharge Checklist">
      <DepartmentHeader department="Inpatient & Ward" title="Discharge Checklist" subtitle="Standardized discharge process compliance" quickActions={[{ label: "Discharge Workflow", path: "/discharge" }, { label: "Billing", path: "/billing" }]} />
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="font-medium">Discharge Readiness</p>
            <Badge variant={completed === CHECKLIST.length ? "default" : "secondary"}>{completed}/{CHECKLIST.length} complete</Badge>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mb-6"><div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${(completed / CHECKLIST.length) * 100}%` }} /></div>
          <div className="space-y-3">
            {CHECKLIST.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50">
                <Checkbox checked={!!checked[item.id]} onCheckedChange={v => setChecked(prev => ({ ...prev, [item.id]: !!v }))} />
                <span className={`text-sm ${checked[item.id] ? "line-through text-muted-foreground" : ""}`}>{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
