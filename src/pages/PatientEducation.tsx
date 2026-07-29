import { AppLayout } from "@/components/AppLayout";
import { DepartmentHeader } from "@/components/DepartmentHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Heart, Pill, Apple, Brain, Activity, Shield, Baby } from "lucide-react";

const CATEGORIES = [
  { title: "Heart Health", icon: Heart, color: "text-red-500", articles: ["Understanding Blood Pressure", "Managing Cholesterol", "Heart-Healthy Diet", "Exercise Guidelines for Cardiac Patients"] },
  { title: "Medication Guide", icon: Pill, color: "text-blue-500", articles: ["How to Take Medications Safely", "Understanding Drug Interactions", "Managing Side Effects", "Storing Medications Properly"] },
  { title: "Nutrition", icon: Apple, color: "text-green-500", articles: ["Diabetic Diet Planning", "Post-Surgery Nutrition", "Balanced Diet Basics", "Hydration Guidelines"] },
  { title: "Mental Health", icon: Brain, color: "text-purple-500", articles: ["Coping with Chronic Illness", "Stress Management Techniques", "Sleep Hygiene", "When to Seek Help"] },
  { title: "Preventive Care", icon: Shield, color: "text-amber-500", articles: ["Vaccination Schedules", "Cancer Screening Guidelines", "Regular Health Check-ups", "Infection Prevention"] },
  { title: "Maternal Health", icon: Baby, color: "text-pink-500", articles: ["Prenatal Care", "Breastfeeding Guide", "Postpartum Recovery", "Newborn Care Basics"] },
];

export default function PatientEducation() {
  return (
    <AppLayout title="Patient Education">
      <DepartmentHeader department="Administration" title="Patient Education Portal" subtitle="Health education resources for patients and families" />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATEGORIES.map(cat => (
          <Card key={cat.title}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><cat.icon className={`h-5 w-5 ${cat.color}`} />{cat.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {cat.articles.map(a => (
                  <li key={a} className="flex items-center gap-2 text-sm">
                    <BookOpen className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="hover:text-primary cursor-pointer">{a}</span>
                  </li>
                ))}
              </ul>
              <Badge variant="secondary" className="mt-3 text-xs">{cat.articles.length} articles</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
