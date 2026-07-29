import { AppLayout } from "@/components/AppLayout";
import { DepartmentHeader } from "@/components/DepartmentHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, AlertTriangle } from "lucide-react";

export default function MortalityReview() {
  return (
    <AppLayout title="Mortality Review">
      <DepartmentHeader department="Administration" title="Mortality & Morbidity Review" subtitle="Systematic review of patient outcomes for continuous improvement" quickActions={[{ label: "Quality Assurance", path: "/quality-assurance" }, { label: "Incidents", path: "/incidents" }]} />
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="pt-4"><p className="text-2xl font-bold">0</p><p className="text-xs text-muted-foreground">Cases This Month</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-2xl font-bold">0</p><p className="text-xs text-muted-foreground">Pending Review</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-2xl font-bold">0</p><p className="text-xs text-muted-foreground">Action Items</p></CardContent></Card>
      </div>
      <Card><CardContent className="pt-6 text-center text-muted-foreground py-12">
        <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
        <p>No mortality/morbidity cases recorded this period</p>
        <p className="text-xs mt-1">Cases will appear here when documented through clinical workflow</p>
      </CardContent></Card>
    </AppLayout>
  );
}
