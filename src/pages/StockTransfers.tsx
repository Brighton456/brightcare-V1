import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useHospital } from "@/contexts/HospitalContext";
import { ArrowRightLeft, Plus, Send, CheckCircle2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Transfer {
  id: string;
  transfer_no: string;
  status: string;
  notes: string | null;
  created_at: string;
  source_branch_id: string;
  destination_branch_id: string;
}

export default function StockTransfers() {
  const { hospitalId } = useHospital();
  const { toast } = useToast();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hospitalId) return;
    fetchTransfers();
  }, [hospitalId]);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("stock_transfers")
        .select("id, transfer_no, status, notes, created_at, source_branch_id, destination_branch_id")
        .eq("hospital_id", hospitalId)
        .order("created_at", { ascending: false });

      setTransfers((data || []) as any);
    } catch (err) {
      console.error("Error fetching transfers:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Inter-Branch Stock Transfers</h2>
          <p className="text-xs text-muted-foreground">
            Audit-tracked movements between main store and branch clinics
          </p>
        </div>
      </div>

      <Card className="rounded-lg border shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 text-xs">
                <TableHead>Transfer #</TableHead>
                <TableHead>Requested Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-xs text-muted-foreground">
                    Loading stock transfers...
                  </TableCell>
                </TableRow>
              ) : transfers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-xs text-muted-foreground">
                    No inter-branch transfers recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                transfers.map((t) => (
                  <TableRow key={t.id} className="text-xs hover:bg-muted/20">
                    <TableCell className="font-mono font-bold">{t.transfer_no}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] uppercase font-mono">
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{t.notes || "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
