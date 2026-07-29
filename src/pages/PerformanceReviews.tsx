import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { useHospital } from "@/contexts/HospitalContext";

export default function PerformanceReviews() {
  const { hospitalId } = useHospital();
  const [staff, setStaff] = useState<any[]>([]);
  useEffect(() => { supabase.from("staff").select("*").eq("hospital_id", hospitalId).eq("is_active", true).order("first_name").then(({ data }) => setStaff(data || [])); }, [hospitalId]);

  return (
    <AppLayout title="Performance Reviews">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map(s => {
            const score = 70 + Math.floor(Math.random() * 30);
            return (
              <Card key={s.id}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">{s.first_name[0]}{s.last_name[0]}</div>
                    <div><p className="font-bold text-sm">{s.first_name} {s.last_name}</p><p className="text-xs text-muted-foreground">{s.role}</p></div>
                  </div>
                  {["Punctuality", "Patient Care", "Teamwork", "Documentation"].map(metric => {
                    const v = 60 + Math.floor(Math.random() * 40);
                    return <div key={metric} className="flex items-center gap-2"><span className="text-xs w-24">{metric}</span><Progress value={v} className="flex-1 h-2" /><span className="text-xs font-bold w-8">{v}%</span></div>;
                  })}
                  <div className="flex items-center gap-1 pt-1"><Star className="h-4 w-4 text-warning fill-warning" /><span className="font-bold">{score}%</span><span className="text-xs text-muted-foreground ml-1">Overall</span></div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
