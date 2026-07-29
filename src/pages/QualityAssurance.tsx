import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Shield, Award, TrendingUp } from "lucide-react";

const KPIs = [
  { name: "Patient Satisfaction", target: 90, actual: 87 },
  { name: "Readmission Rate", target: 5, actual: 3 },
  { name: "Infection Rate", target: 2, actual: 1.5 },
  { name: "Average Wait Time (min)", target: 15, actual: 22 },
  { name: "Medication Error Rate", target: 0, actual: 0.1 },
  { name: "Bed Occupancy Rate", target: 85, actual: 72 },
  { name: "Staff-Patient Ratio", target: 5, actual: 6 },
  { name: "Emergency Response Time (min)", target: 5, actual: 4 },
];

export default function QualityAssurance() {
  return (
    <AppLayout title="Quality Assurance">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="pt-4 flex items-center gap-3"><Award className="h-8 w-8 text-success" /><div><p className="text-2xl font-black">A</p><p className="text-xs text-muted-foreground">Accreditation Grade</p></div></CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3"><Shield className="h-8 w-8 text-primary" /><div><p className="text-2xl font-black">{KPIs.length}</p><p className="text-xs text-muted-foreground">KPIs Tracked</p></div></CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3"><TrendingUp className="h-8 w-8 text-warning" /><div><p className="text-2xl font-black">{KPIs.filter(k => k.name.includes("Rate") ? k.actual <= k.target : k.actual >= k.target).length}/{KPIs.length}</p><p className="text-xs text-muted-foreground">Targets Met</p></div></CardContent></Card>
        </div>
        <Card><CardHeader><CardTitle>Quality KPI Dashboard</CardTitle></CardHeader><CardContent>
          <div className="space-y-4">
            {KPIs.map(k => {
              const met = k.name.includes("Rate") || k.name.includes("Time") || k.name.includes("Error") ? k.actual <= k.target : k.actual >= k.target;
              return (
                <div key={k.name} className="flex items-center gap-4">
                  <span className="text-sm w-56">{k.name}</span>
                  <Progress value={Math.min(100, k.name.includes("Rate") || k.name.includes("Error") ? (1 - k.actual / Math.max(k.target, 1)) * 100 + 50 : (k.actual / Math.max(k.target, 1)) * 100)} className="flex-1 h-3" />
                  <span className="text-sm font-bold w-16">{k.actual}{k.name.includes("Rate") ? "%" : ""}</span>
                  <Badge variant={met ? "default" : "destructive"}>{met ? "Met" : "Below"}</Badge>
                </div>
              );
            })}
          </div>
        </CardContent></Card>
      </div>
    </AppLayout>
  );
}
