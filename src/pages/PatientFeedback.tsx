import { AppLayout } from "@/components/AppLayout";
import { DepartmentHeader } from "@/components/DepartmentHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare, TrendingUp, Users } from "lucide-react";

export default function PatientFeedback() {
  return (
    <AppLayout title="Patient Feedback">
      <DepartmentHeader department="Administration" title="Patient Feedback & Satisfaction" subtitle="Collect and analyze patient experience data" quickActions={[{ label: "Quality Assurance", path: "/quality-assurance" }, { label: "Reports", path: "/reports" }]} />
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="pt-4"><Star className="h-6 w-6 text-amber-500 mb-1" /><p className="text-2xl font-bold">4.5/5</p><p className="text-xs text-muted-foreground">Avg Rating</p></CardContent></Card>
        <Card><CardContent className="pt-4"><MessageSquare className="h-6 w-6 text-primary mb-1" /><p className="text-2xl font-bold">0</p><p className="text-xs text-muted-foreground">Total Reviews</p></CardContent></Card>
        <Card><CardContent className="pt-4"><TrendingUp className="h-6 w-6 text-green-600 mb-1" /><p className="text-2xl font-bold">0%</p><p className="text-xs text-muted-foreground">Response Rate</p></CardContent></Card>
        <Card><CardContent className="pt-4"><Users className="h-6 w-6 text-chart-2 mb-1" /><p className="text-2xl font-bold">0</p><p className="text-xs text-muted-foreground">NPS Score</p></CardContent></Card>
      </div>
      <Card><CardContent className="pt-6 text-center text-muted-foreground py-12">
        <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
        <p>No feedback collected yet</p>
        <p className="text-xs mt-1">Patient satisfaction surveys will appear here</p>
      </CardContent></Card>
    </AppLayout>
  );
}
