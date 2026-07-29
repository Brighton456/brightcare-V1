import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useState, useEffect } from "react";
import { Utensils } from "lucide-react";
import { useHospital } from "@/contexts/HospitalContext";

const DIET_TEMPLATES: Record<string, { name: string; meals: string[] }> = {
  diabetes: { name: "Diabetic Diet", meals: ["Low-sugar cereal + milk", "Grilled chicken salad", "Steamed fish + brown rice", "Sugar-free snacks"] },
  cardiac: { name: "Cardiac Diet", meals: ["Oatmeal + fruit", "Lean soup + whole grain bread", "Grilled salmon + vegetables", "Nuts + yogurt"] },
  renal: { name: "Renal Diet", meals: ["Egg whites + toast", "Low-sodium chicken", "Rice + steamed vegetables", "Apple slices"] },
  general: { name: "General Diet", meals: ["Full breakfast", "Balanced lunch", "Light dinner", "Fruit snacks"] },
};

export default function DietPlans() {
  const { hospitalId } = useHospital();
  const [admissions, setAdmissions] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("admissions").select("*, patients(first_name,last_name)").eq("hospital_id", hospitalId).eq("status", "admitted").then(({ data }) => setAdmissions(data || []));
  }, [hospitalId]);

  const suggestDiet = (diagnosis: string | null) => {
    if (!diagnosis) return DIET_TEMPLATES.general;
    const d = diagnosis.toLowerCase();
    if (d.includes("diabet")) return DIET_TEMPLATES.diabetes;
    if (d.includes("cardiac") || d.includes("heart")) return DIET_TEMPLATES.cardiac;
    if (d.includes("renal") || d.includes("kidney")) return DIET_TEMPLATES.renal;
    return DIET_TEMPLATES.general;
  };

  return (
    <AppLayout title="Patient Diet Plans">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {admissions.map(a => {
            const diet = suggestDiet(a.diagnosis);
            return (
              <Card key={a.id}>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Utensils className="h-4 w-4" />{a.patients?.first_name} {a.patients?.last_name}</CardTitle></CardHeader>
                <CardContent>
                  <Badge variant="secondary" className="mb-2">{diet.name}</Badge>
                  <p className="text-xs text-muted-foreground mb-2">Diagnosis: {a.diagnosis || "N/A"}</p>
                  <div className="space-y-1">
                    {["Breakfast", "Lunch", "Dinner", "Snacks"].map((meal, i) => (
                      <div key={meal} className="flex gap-2 text-xs"><span className="font-medium w-16">{meal}:</span><span className="text-muted-foreground">{diet.meals[i]}</span></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {admissions.length === 0 && <Card className="col-span-full"><CardContent className="py-8 text-center text-muted-foreground">No admitted patients</CardContent></Card>}
        </div>
      </div>
    </AppLayout>
  );
}
