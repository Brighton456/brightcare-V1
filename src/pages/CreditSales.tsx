import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useState, useEffect } from "react";
import { CreditCard, Phone, Calendar, CheckCircle2, AlertTriangle, Clock, DollarSign } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useToast } from "@/hooks/use-toast";
import { useHospital } from "@/contexts/HospitalContext";

export default function CreditSales() {
  const { hospitalId } = useHospital();
  const [credits, setCredits] = useState<any[]>([]);
  const { toast } = useToast();
  const isAdmin = useIsAdmin();

  const fetchCredits = async () => {
    if (!hospitalId) return;
    const { data } = await supabase
      .from("credit_sales")
      .select("*")
      .eq("hospital_id", hospitalId)
      .order("created_at", { ascending: false })
      .limit(200);
    setCredits((data || []) as any[]);
  };

  useEffect(() => { fetchCredits(); }, [hospitalId]);

  const markPaid = async (id: string) => {
    await supabase.from("credit_sales").update({ status: "paid", updated_at: new Date().toISOString() } as any).eq("id", id);
    toast({ title: "Credit marked as paid" });
    fetchCredits();
  };

  const pending = credits.filter(c => c.status === "pending");
  const overdue = pending.filter(c => c.due_date && new Date(c.due_date) < new Date());
  const totalOwed = pending.reduce((s, c) => s + (c.amount_credited || 0), 0);
  const totalPaid = credits.filter(c => c.status === "paid").reduce((s, c) => s + (c.amount_credited || 0), 0);

  const statusColor: Record<string, string> = {
    pending: "bg-warning/10 text-warning border-warning/30",
    paid: "bg-success/10 text-success border-success/30",
    overdue: "bg-destructive/10 text-destructive border-destructive/30",
  };

  return (
    <AppLayout title="Credit Sales Tracker">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center"><Clock className="h-5 w-5 text-warning" /></div><div><p className="text-2xl font-bold">{pending.length}</p><p className="text-xs text-muted-foreground">Pending Credits</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-destructive" /></div><div><p className="text-2xl font-bold">{overdue.length}</p><p className="text-xs text-muted-foreground">Overdue</p></div></CardContent></Card>
          {isAdmin && <Card><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><DollarSign className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">KES {totalOwed.toLocaleString()}</p><p className="text-xs text-muted-foreground">Total Owed</p></div></CardContent></Card>}
          {isAdmin && <Card><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center"><CheckCircle2 className="h-5 w-5 text-success" /></div><div><p className="text-2xl font-bold">KES {totalPaid.toLocaleString()}</p><p className="text-xs text-muted-foreground">Collected</p></div></CardContent></Card>}
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />All Credit Sales</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Credit Amount</TableHead>
                  <TableHead>Upfront Paid</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {credits.map(c => {
                  const isOverdue = c.status === "pending" && c.due_date && new Date(c.due_date) < new Date();
                  const displayStatus = isOverdue ? "overdue" : c.status;
                  return (
                    <TableRow key={c.id} className={isOverdue ? "bg-destructive/5" : ""}>
                      <TableCell className="font-semibold">{c.buyer_name}</TableCell>
                      <TableCell className="text-xs"><span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.buyer_phone || "—"}</span></TableCell>
                      <TableCell className="font-bold text-warning">KES {(c.amount_credited || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-xs">KES {(c.amount_paid || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{c.due_date ? <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(c.due_date).toLocaleDateString()}</span> : "—"}</TableCell>
                      <TableCell><Badge className={`text-[10px] border ${statusColor[displayStatus] || ""}`}>{displayStatus}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {c.status === "pending" && (
                          <Button size="sm" variant="outline" onClick={() => markPaid(c.id)} className="gap-1 text-xs">
                            <CheckCircle2 className="h-3 w-3" /> Mark Paid
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {credits.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No credit sales recorded</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
