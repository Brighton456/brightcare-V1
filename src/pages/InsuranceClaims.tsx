import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useState, useEffect } from "react";
import { Shield, Plus, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHospital } from "@/contexts/HospitalContext";

export default function InsuranceClaims() {
  const { hospitalId } = useHospital();
  const [bills, setBills] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase.from("bills").select("*, patients(first_name,last_name,insurance_provider,insurance_number)").eq("hospital_id", hospitalId).order("created_at", { ascending: false }).limit(100).then(({ data }) => setBills(data || []));
  }, [hospitalId]);

  const insuranceBills = bills.filter(b => b.patients?.insurance_provider);

  return (
    <AppLayout title="Insurance Claims">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Claims</p><p className="text-2xl font-black">{insuranceBills.length}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Pending</p><p className="text-2xl font-black text-warning">{insuranceBills.filter(b => b.status === "pending").length}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Approved</p><p className="text-2xl font-black text-success">{insuranceBills.filter(b => b.status === "paid").length}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Value</p><p className="text-2xl font-black">KES {insuranceBills.reduce((s, b) => s + (b.total || 0), 0).toLocaleString()}</p></CardContent></Card>
        </div>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Insurance Claims</CardTitle></CardHeader><CardContent>
          <Table><TableHeader><TableRow><TableHead>Bill#</TableHead><TableHead>Patient</TableHead><TableHead>Provider</TableHead><TableHead>Policy#</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>{insuranceBills.map(b => (
              <TableRow key={b.id}><TableCell className="font-mono text-xs">{b.bill_no}</TableCell><TableCell>{b.patients?.first_name} {b.patients?.last_name}</TableCell><TableCell>{b.patients?.insurance_provider}</TableCell><TableCell className="font-mono text-xs">{b.patients?.insurance_number || "—"}</TableCell><TableCell className="font-bold">KES {(b.total || 0).toLocaleString()}</TableCell><TableCell><Badge variant={b.status === "paid" ? "default" : "secondary"}>{b.status}</Badge></TableCell></TableRow>
            ))}{insuranceBills.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No insurance claims found</TableCell></TableRow>}</TableBody></Table>
        </CardContent></Card>
      </div>
    </AppLayout>
  );
}
