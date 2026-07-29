import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Calculator, Calendar as CalIcon, Pill, Heart, Thermometer, Droplet, Brain, Scale, Timer, Stethoscope } from "lucide-react";

function BMICalculator() {
  const [w, setW] = useState(""); const [h, setH] = useState(""); const [bmi, setBmi] = useState<number | null>(null);
  const calc = () => { const wt = parseFloat(w); const ht = parseFloat(h) / 100; if (wt > 0 && ht > 0) setBmi(Math.round(wt / (ht * ht) * 10) / 10); };
  const cat = bmi ? (bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese") : "";
  const catColor = bmi ? (bmi < 18.5 ? "secondary" : bmi < 25 ? "default" : bmi < 30 ? "secondary" : "destructive") : "secondary";
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Weight (kg)</Label><Input type="number" value={w} onChange={e => setW(e.target.value)} placeholder="70" /></div>
        <div><Label>Height (cm)</Label><Input type="number" value={h} onChange={e => setH(e.target.value)} placeholder="175" /></div>
      </div>
      <Button onClick={calc} className="w-full">Calculate BMI</Button>
      {bmi && <div className="text-center p-4 bg-muted rounded-lg"><p className="text-3xl font-bold">{bmi}</p><Badge variant={catColor as any} className="mt-2">{cat}</Badge>
        <div className="mt-3 text-xs text-muted-foreground grid grid-cols-4 gap-1">
          <span className="bg-blue-100 dark:bg-blue-900 rounded p-1">&lt;18.5 Under</span>
          <span className="bg-green-100 dark:bg-green-900 rounded p-1">18.5-24.9 Normal</span>
          <span className="bg-yellow-100 dark:bg-yellow-900 rounded p-1">25-29.9 Over</span>
          <span className="bg-red-100 dark:bg-red-900 rounded p-1">≥30 Obese</span>
        </div>
      </div>}
    </div>
  );
}

function DoseCalculator() {
  const [weight, setWeight] = useState(""); const [dose, setDose] = useState(""); const [freq, setFreq] = useState("3");
  const totalDaily = parseFloat(weight || "0") * parseFloat(dose || "0");
  const perDose = totalDaily / parseFloat(freq || "1");
  return (
    <div className="space-y-4">
      <div><Label>Patient Weight (kg)</Label><Input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="70" /></div>
      <div><Label>Dose (mg/kg/day)</Label><Input type="number" value={dose} onChange={e => setDose(e.target.value)} placeholder="10" /></div>
      <div><Label>Frequency (times/day)</Label><Input type="number" value={freq} onChange={e => setFreq(e.target.value)} placeholder="3" /></div>
      {totalDaily > 0 && <div className="bg-muted rounded-lg p-4 text-center">
        <p className="text-sm text-muted-foreground">Total Daily Dose</p><p className="text-2xl font-bold">{totalDaily.toFixed(1)} mg</p>
        <p className="text-sm text-muted-foreground mt-2">Per Dose</p><p className="text-xl font-bold">{perDose.toFixed(1)} mg</p>
      </div>}
    </div>
  );
}

function GFRCalculator() {
  const [age, setAge] = useState(""); const [creatinine, setCreatinine] = useState(""); const [gender, setGender] = useState("male");
  const gfr = (() => {
    const a = parseFloat(age); const cr = parseFloat(creatinine);
    if (!a || !cr) return null;
    const k = gender === "female" ? 0.7 : 0.9;
    const alpha = gender === "female" ? -0.241 : -0.302;
    const mult = gender === "female" ? 1.012 : 1;
    return Math.round(142 * Math.pow(Math.min(cr / k, 1), alpha) * Math.pow(Math.max(cr / k, 1), -1.200) * Math.pow(0.9938, a) * mult);
  })();
  const stage = gfr ? (gfr >= 90 ? "G1 Normal" : gfr >= 60 ? "G2 Mild" : gfr >= 30 ? "G3 Moderate" : gfr >= 15 ? "G4 Severe" : "G5 Failure") : "";
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Age</Label><Input type="number" value={age} onChange={e => setAge(e.target.value)} /></div>
        <div><Label>Creatinine (mg/dL)</Label><Input type="number" step="0.1" value={creatinine} onChange={e => setCreatinine(e.target.value)} /></div>
      </div>
      <div className="flex gap-2">
        <Button variant={gender === "male" ? "default" : "outline"} onClick={() => setGender("male")} className="flex-1">Male</Button>
        <Button variant={gender === "female" ? "default" : "outline"} onClick={() => setGender("female")} className="flex-1">Female</Button>
      </div>
      {gfr && <div className="bg-muted rounded-lg p-4 text-center"><p className="text-3xl font-bold">{gfr} mL/min</p><Badge className="mt-2">{stage}</Badge></div>}
    </div>
  );
}

function IVDripRate() {
  const [volume, setVolume] = useState(""); const [time, setTime] = useState(""); const [dropFactor, setDropFactor] = useState("20");
  const rate = parseFloat(volume || "0") / parseFloat(time || "1");
  const dropsPerMin = (parseFloat(volume || "0") * parseFloat(dropFactor || "20")) / (parseFloat(time || "1") * 60);
  return (
    <div className="space-y-4">
      <div><Label>Volume (mL)</Label><Input type="number" value={volume} onChange={e => setVolume(e.target.value)} placeholder="1000" /></div>
      <div><Label>Time (hours)</Label><Input type="number" value={time} onChange={e => setTime(e.target.value)} placeholder="8" /></div>
      <div><Label>Drop Factor (gtts/mL)</Label><Input type="number" value={dropFactor} onChange={e => setDropFactor(e.target.value)} /></div>
      {parseFloat(volume) > 0 && parseFloat(time) > 0 && <div className="bg-muted rounded-lg p-4 text-center">
        <p className="text-sm text-muted-foreground">Flow Rate</p><p className="text-2xl font-bold">{rate.toFixed(1)} mL/hr</p>
        <p className="text-sm text-muted-foreground mt-2">Drip Rate</p><p className="text-xl font-bold">{dropsPerMin.toFixed(0)} gtts/min</p>
      </div>}
    </div>
  );
}

function DrugInteractionQuick() {
  const [drugs, setDrugs] = useState("");
  const knownInteractions: Record<string, string> = {
    "warfarin+aspirin": "⚠️ HIGH: Increased bleeding risk",
    "metformin+alcohol": "⚠️ MODERATE: Risk of lactic acidosis",
    "lisinopril+potassium": "⚠️ HIGH: Hyperkalemia risk",
    "simvastatin+grapefruit": "⚠️ MODERATE: Increased statin levels",
    "ciprofloxacin+antacids": "⚠️ MODERATE: Reduced absorption",
  };
  const checkInteractions = () => {
    const d = drugs.toLowerCase().split(",").map(s => s.trim()).filter(Boolean);
    const results: string[] = [];
    for (let i = 0; i < d.length; i++) for (let j = i + 1; j < d.length; j++) {
      const key = `${d[i]}+${d[j]}`; const rev = `${d[j]}+${d[i]}`;
      if (knownInteractions[key]) results.push(`${d[i]} + ${d[j]}: ${knownInteractions[key]}`);
      else if (knownInteractions[rev]) results.push(`${d[j]} + ${d[i]}: ${knownInteractions[rev]}`);
    }
    return results;
  };
  const results = drugs ? checkInteractions() : [];
  return (
    <div className="space-y-4">
      <div><Label>Enter drugs (comma-separated)</Label><Textarea value={drugs} onChange={e => setDrugs(e.target.value)} placeholder="warfarin, aspirin, metformin" rows={3} /></div>
      {results.length > 0 ? <div className="space-y-2">{results.map((r, i) => <div key={i} className="bg-destructive/10 border border-destructive/20 rounded p-3 text-sm">{r}</div>)}</div>
        : drugs.includes(",") && <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 rounded p-3 text-sm">✅ No known interactions found</div>}
    </div>
  );
}

function IdealBodyWeight() {
  const [h, setH] = useState(""); const [g, setG] = useState("male");
  const ht = parseFloat(h || "0"); const inches = ht / 2.54;
  const ibw = g === "male" ? 50 + 2.3 * (inches - 60) : 45.5 + 2.3 * (inches - 60);
  return (
    <div className="space-y-4">
      <div><Label>Height (cm)</Label><Input type="number" value={h} onChange={e => setH(e.target.value)} placeholder="175" /></div>
      <div className="flex gap-2">
        <Button variant={g === "male" ? "default" : "outline"} onClick={() => setG("male")} className="flex-1">Male</Button>
        <Button variant={g === "female" ? "default" : "outline"} onClick={() => setG("female")} className="flex-1">Female</Button>
      </div>
      {ht > 0 && <div className="bg-muted rounded-lg p-4 text-center"><p className="text-sm text-muted-foreground">Ideal Body Weight</p><p className="text-3xl font-bold">{ibw.toFixed(1)} kg</p></div>}
    </div>
  );
}

const TOOLS = [
  { id: "bmi", label: "BMI", icon: Scale, component: BMICalculator },
  { id: "dose", label: "Dose Calc", icon: Pill, component: DoseCalculator },
  { id: "gfr", label: "eGFR", icon: Droplet, component: GFRCalculator },
  { id: "iv", label: "IV Drip", icon: Timer, component: IVDripRate },
  { id: "drug", label: "Drug Interactions", icon: Brain, component: DrugInteractionQuick },
  { id: "ibw", label: "Ideal Weight", icon: Heart, component: IdealBodyWeight },
  { id: "calendar", label: "Calendar", icon: CalIcon, component: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return <div className="flex justify-center"><Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border pointer-events-auto" /></div>;
  }},
];

export default function ClinicalTools() {
  const [active, setActive] = useState("bmi");
  const ActiveComponent = TOOLS.find(t => t.id === active)?.component || BMICalculator;

  return (
    <AppLayout title="Clinical Tools">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold">Clinical Utility Tools</h1>
          <p className="text-sm text-muted-foreground">Quick medical calculators and reference tools</p>
        </div>

        <div className="grid md:grid-cols-[240px_1fr] gap-6">
          <div className="space-y-1">
            {TOOLS.map(t => (
              <Button key={t.id} variant={active === t.id ? "default" : "ghost"} className="w-full justify-start" onClick={() => setActive(t.id)}>
                <t.icon className="h-4 w-4 mr-2" /> {t.label}
              </Button>
            ))}
          </div>
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2">
              {(() => { const T = TOOLS.find(t => t.id === active); return T ? <><T.icon className="h-5 w-5" /> {T.label}</> : null; })()}
            </CardTitle></CardHeader>
            <CardContent><ActiveComponent /></CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
