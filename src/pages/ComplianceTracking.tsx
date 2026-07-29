import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shield, CheckCircle2, AlertTriangle } from "lucide-react";

const COMPLIANCE_ITEMS = [
  { area: "Medical Waste Disposal", score: 95, status: "compliant" },
  { area: "Fire Safety Equipment", score: 88, status: "compliant" },
  { area: "Staff Licensing", score: 100, status: "compliant" },
  { area: "Patient Data Privacy", score: 92, status: "compliant" },
  { area: "Infection Control", score: 78, status: "attention" },
  { area: "Drug Storage Standards", score: 85, status: "compliant" },
  { area: "Emergency Protocols", score: 90, status: "compliant" },
  { area: "Equipment Calibration", score: 65, status: "non-compliant" },
];

export default function ComplianceTracking() {
  const avgScore = Math.round(COMPLIANCE_ITEMS.reduce((s, c) => s + c.score, 0) / COMPLIANCE_ITEMS.length);
  return (
    <AppLayout title="Compliance & Accreditation">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Overall Score</p><p className="text-2xl font-black">{avgScore}%</p><Progress value={avgScore} className="mt-2 h-2" /></CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3"><CheckCircle2 className="h-8 w-8 text-success" /><div><p className="text-2xl font-black">{COMPLIANCE_ITEMS.filter(c => c.status === "compliant").length}</p><p className="text-xs text-muted-foreground">Compliant</p></div></CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3"><AlertTriangle className="h-8 w-8 text-destructive" /><div><p className="text-2xl font-black">{COMPLIANCE_ITEMS.filter(c => c.status !== "compliant").length}</p><p className="text-xs text-muted-foreground">Needs Attention</p></div></CardContent></Card>
        </div>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Compliance Checklist</CardTitle></CardHeader><CardContent>
          <div className="space-y-3">
            {COMPLIANCE_ITEMS.map(c => (
              <div key={c.area} className="flex items-center gap-4">
                {c.status === "compliant" ? <CheckCircle2 className="h-5 w-5 text-success shrink-0" /> : <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />}
                <span className="text-sm w-48">{c.area}</span>
                <Progress value={c.score} className="flex-1 h-3" />
                <Badge variant={c.score >= 80 ? "default" : c.score >= 60 ? "secondary" : "destructive"}>{c.score}%</Badge>
              </div>
            ))}
          </div>
        </CardContent></Card>
      </div>
    </AppLayout>
  );
}
