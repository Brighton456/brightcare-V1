import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useState, useEffect } from "react";
import { AlertTriangle, DollarSign } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useHospital } from "@/contexts/HospitalContext";

export default function OutstandingBalances() {
  const { hospitalId } = useHospital();
  const isAdmin = useIsAdmin();
  const [bills, setBills] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("bills").select("*, patients(first_name,last_name,phone,patient_no)").eq("hospital_id", hospitalId).eq("status", "pending").order("created_at", { ascending: true }).then(({ data }) => setBills(data || []));
  }, [hospitalId]);
  const totalOutstanding = bills.reduce((s, b) => s + ((b.total || 0) - (b.amount_paid || 0)), 0);

  return (
    <AppLayout title="Outstanding Balances">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="pt-4 flex items-center gap-3"><AlertTriangle className="h-8 w-8 text-destructive" /><div><p className="text-2xl font-black">{bills.length}</p><p className="text-xs text-muted-foreground">Unpaid Bills</p></div></CardContent></Card>
          {isAdmin && <Card><CardContent className="pt-4 flex items-center gap-3"><DollarSign className="h-8 w-8 text-warning" /><div><p className="text-2xl font-black">KES {totalOutstanding.toLocaleString()}</p><p className="text-xs text-muted-foreground">Total Outstanding</p></div></CardContent></Card>}
        </div>
        <Card><CardHeader><CardTitle>Unpaid Bills</CardTitle></CardHeader><CardContent>
          <Table><TableHeader><TableRow><TableHead>Bill#</TableHead><TableHead>Patient</TableHead><TableHead>Contact</TableHead><TableHead>Bill Amount</TableHead><TableHead>Paid</TableHead><TableHead>Balance</TableHead><TableHead>Age</TableHead></TableRow></TableHeader>
            <TableBody>{bills.map(b => {
              const balance = (b.total || 0) - (b.amount_paid || 0);
              const days = Math.round((Date.now() - new Date(b.created_at).getTime()) / 86400000);
              return <TableRow key={b.id}><TableCell className="font-mono text-xs">{b.bill_no}</TableCell><TableCell>{b.patients?.first_name} {b.patients?.last_name}</TableCell><TableCell className="text-sm">{b.patients?.phone || "—"}</TableCell><TableCell>KES {(b.total || 0).toLocaleString()}</TableCell><TableCell>KES {(b.amount_paid || 0).toLocaleString()}</TableCell><TableCell className="font-bold text-destructive">KES {balance.toLocaleString()}</TableCell><TableCell><Badge variant={days > 30 ? "destructive" : days > 7 ? "secondary" : "outline"}>{days}d</Badge></TableCell></TableRow>;
            })}</TableBody></Table>
        </CardContent></Card>
      </div>
    </AppLayout>
  );
}
