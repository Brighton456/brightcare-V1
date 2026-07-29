import { AppLayout } from "@/components/AppLayout";
import { DepartmentHeader } from "@/components/DepartmentHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, Activity, CheckCircle, ThermometerSun, Droplet } from "lucide-react";

const protocols = [
  { title: "Hand Hygiene Compliance", status: "active", compliance: 94, icon: Droplet },
  { title: "Isolation Precautions", status: "active", compliance: 88, icon: Shield },
  { title: "Surgical Site Infection Prevention", status: "active", compliance: 96, icon: Activity },
  { title: "Catheter-Associated UTI Prevention", status: "review", compliance: 82, icon: AlertTriangle },
  { title: "Ventilator-Associated Pneumonia Bundle", status: "active", compliance: 91, icon: ThermometerSun },
  { title: "Central Line Bundle", status: "active", compliance: 93, icon: CheckCircle },
];

export default function InfectionControl() {
  return (
    <AppLayout title="Infection Control">
      <DepartmentHeader department="Administration" title="Infection Control & Prevention" subtitle="Monitor infection protocols, compliance rates, and outbreak tracking" quickActions={[{ label: "Quality Assurance", path: "/quality-assurance" }, { label: "Compliance", path: "/compliance" }]} />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {protocols.map(p => (
          <Card key={p.title}>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><p.icon className="h-4 w-4 text-primary" />{p.title}</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <Badge variant={p.status === "active" ? "default" : "secondary"}>{p.status}</Badge>
                <span className={`text-lg font-bold ${p.compliance >= 90 ? "text-green-600" : p.compliance >= 80 ? "text-amber-600" : "text-red-600"}`}>{p.compliance}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2"><div className={`h-2 rounded-full ${p.compliance >= 90 ? "bg-green-500" : p.compliance >= 80 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${p.compliance}%` }} /></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
