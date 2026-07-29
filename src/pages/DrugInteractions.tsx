import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Search, Shield, Info } from "lucide-react";
import { useState } from "react";

const KNOWN_INTERACTIONS = [
  { drug1: "Warfarin", drug2: "Aspirin", severity: "high", description: "Increased bleeding risk. Monitor INR closely." },
  { drug1: "Metformin", drug2: "Contrast Dye", severity: "high", description: "Risk of lactic acidosis. Discontinue 48h before." },
  { drug1: "ACE Inhibitors", drug2: "Potassium Supplements", severity: "moderate", description: "Risk of hyperkalemia. Monitor serum potassium." },
  { drug1: "SSRIs", drug2: "MAOIs", severity: "critical", description: "Risk of serotonin syndrome. Contraindicated." },
  { drug1: "Ciprofloxacin", drug2: "Theophylline", severity: "high", description: "Increased theophylline levels. Dose adjustment needed." },
  { drug1: "Simvastatin", drug2: "Erythromycin", severity: "high", description: "Increased risk of rhabdomyolysis. Avoid combination." },
  { drug1: "Digoxin", drug2: "Amiodarone", severity: "moderate", description: "Increased digoxin levels. Reduce digoxin dose by 50%." },
  { drug1: "Methotrexate", drug2: "NSAIDs", severity: "high", description: "Reduced methotrexate clearance. Monitor toxicity." },
];

export default function DrugInteractions() {
  const [search, setSearch] = useState("");
  const filtered = KNOWN_INTERACTIONS.filter(i => !search || `${i.drug1} ${i.drug2}`.toLowerCase().includes(search.toLowerCase()));
  const sevColor: Record<string, string> = { critical: "destructive", high: "destructive", moderate: "secondary", low: "outline" };

  return (
    <AppLayout title="Drug Interaction Alerts">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search drugs..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} /></div>
        </div>
        <div className="grid gap-3">
          {filtered.map((interaction, i) => (
            <Card key={i}>
              <CardContent className="pt-4 flex items-start gap-4">
                <AlertTriangle className={`h-6 w-6 shrink-0 ${interaction.severity === "critical" ? "text-destructive" : interaction.severity === "high" ? "text-destructive" : "text-warning"}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold">{interaction.drug1}</span><span className="text-muted-foreground">+</span><span className="font-bold">{interaction.drug2}</span>
                    <Badge variant={sevColor[interaction.severity] as any}>{interaction.severity.toUpperCase()}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{interaction.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
