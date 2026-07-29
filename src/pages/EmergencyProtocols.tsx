import { AppLayout } from "@/components/AppLayout";
import { DepartmentHeader } from "@/components/DepartmentHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Siren, Heart, Brain, Flame, Zap, Droplet, Wind, AlertTriangle, Phone } from "lucide-react";

const protocols = [
  { title: "Code Blue — Cardiac Arrest", icon: Heart, color: "text-blue-600", steps: ["Call code team", "Begin CPR", "Attach AED", "Administer epinephrine", "Continuous monitoring"] },
  { title: "Code Red — Fire Emergency", icon: Flame, color: "text-red-600", steps: ["Activate alarm", "RACE protocol", "Evacuate patients", "Contain if safe", "Account for all"] },
  { title: "Code Stroke", icon: Brain, color: "text-purple-600", steps: ["Note time of onset", "CT scan STAT", "Notify neurologist", "Check eligibility for tPA", "Transfer to stroke unit"] },
  { title: "Anaphylaxis", icon: AlertTriangle, color: "text-amber-600", steps: ["Epinephrine IM", "Call for help", "High-flow oxygen", "IV access", "Monitor vitals"] },
  { title: "Mass Casualty", icon: Siren, color: "text-red-600", steps: ["Activate MCI plan", "Triage START", "Set up treatment areas", "Resource allocation", "Communication chain"] },
  { title: "Sepsis Protocol", icon: Droplet, color: "text-orange-600", steps: ["Blood cultures", "Broad-spectrum ABx", "Lactate level", "Fluid resuscitation", "Vasopressors if needed"] },
];

export default function EmergencyProtocols() {
  return (
    <AppLayout title="Emergency Protocols">
      <DepartmentHeader department="Emergency" title="Emergency Response Protocols" subtitle="Quick reference for critical emergency procedures" quickActions={[{ label: "Emergency Dept", path: "/emergency" }, { label: "ICU", path: "/icu" }]} />
      <div className="grid md:grid-cols-2 gap-4">
        {protocols.map(p => (
          <Card key={p.title}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-3"><p.icon className={`h-5 w-5 ${p.color}`} /><p className="font-bold text-sm">{p.title}</p></div>
              <ol className="space-y-1.5">{p.steps.map((s, i) => (
                <li key={i} className="flex items-center gap-2 text-sm"><Badge variant="outline" className="h-5 w-5 p-0 flex items-center justify-center text-xs shrink-0">{i + 1}</Badge>{s}</li>
              ))}</ol>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
