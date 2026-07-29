import { AppLayout } from "@/components/AppLayout";
import { DepartmentHeader } from "@/components/DepartmentHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileSignature, Plus, CheckCircle, Clock } from "lucide-react";

const consentTypes = [
  "General Treatment Consent", "Surgical Consent", "Anesthesia Consent", "Blood Transfusion Consent",
  "Research Participation", "Photography/Recording Consent", "Discharge Against Medical Advice",
  "Organ Donation Consent", "HIV/STI Testing Consent", "Telemedicine Consent",
];

export default function ConsentManagement() {
  return (
    <AppLayout title="Consent Management">
      <DepartmentHeader department="Administration" title="Consent Management" subtitle="Digital consent form tracking and management" quickActions={[{ label: "Patients", path: "/patients" }, { label: "Medical Records", path: "/medical-records" }]} />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {consentTypes.map(type => (
          <Card key={type}>
            <CardContent className="pt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSignature className="h-5 w-5 text-primary" />
                <div><p className="font-medium text-sm">{type}</p><p className="text-xs text-muted-foreground">Template available</p></div>
              </div>
              <Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" /> Use</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
