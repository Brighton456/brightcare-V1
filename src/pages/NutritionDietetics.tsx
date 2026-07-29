import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Utensils, Apple, Salad } from "lucide-react";

export default function NutritionDietetics() {
  return (
    <AppLayout title="Nutrition & Dietetics">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="pt-4 flex items-center gap-3"><Utensils className="h-8 w-8 text-primary" /><div><p className="text-2xl font-black">0</p><p className="text-xs text-muted-foreground">Active Diet Plans</p></div></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Meal Orders Today</p><p className="text-2xl font-black">0</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Special Diets</p><p className="text-2xl font-black">0</p></CardContent></Card>
        </div>
        <Card><CardHeader><CardTitle>Department Services</CardTitle></CardHeader><CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[{ icon: Apple, title: "Dietary Assessment", desc: "Comprehensive nutritional status evaluation" }, { icon: Salad, title: "Therapeutic Diets", desc: "Condition-specific meal planning" }, { icon: Utensils, title: "Meal Service", desc: "Hospital-wide meal preparation & delivery" }].map(s => (
              <Card key={s.title}><CardContent className="pt-4 text-center"><s.icon className="h-8 w-8 mx-auto mb-2 text-primary" /><p className="font-bold text-sm">{s.title}</p><p className="text-xs text-muted-foreground mt-1">{s.desc}</p></CardContent></Card>
            ))}
          </div>
        </CardContent></Card>
      </div>
    </AppLayout>
  );
}
