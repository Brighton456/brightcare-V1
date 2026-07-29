import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useState, useEffect } from "react";
import { Bed, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHospital } from "@/contexts/HospitalContext";

export default function BedAllocation() {
  const { hospitalId } = useHospital();
  const [wards, setWards] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      supabase.from("wards").select("*").eq("hospital_id", hospitalId).eq("is_active", true),
      supabase.from("beds").select("*").eq("hospital_id", hospitalId),
    ]).then(([w, b]) => { setWards(w.data || []); setBeds(b.data || []); });
  }, [hospitalId]);

  const statusColor: Record<string, string> = { available: "bg-success/20 text-success border-success", occupied: "bg-destructive/20 text-destructive border-destructive", maintenance: "bg-warning/20 text-warning border-warning" };

  return (
    <AppLayout title="Bed Allocation">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Beds</p><p className="text-2xl font-black">{beds.length}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Available</p><p className="text-2xl font-black text-success">{beds.filter(b => b.status === "available").length}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Occupied</p><p className="text-2xl font-black text-destructive">{beds.filter(b => b.status === "occupied").length}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Wards</p><p className="text-2xl font-black">{wards.length}</p></CardContent></Card>
        </div>
        {wards.map(ward => {
          const wardBeds = beds.filter(b => b.ward_id === ward.id);
          return (
            <Card key={ward.id}>
              <CardHeader><CardTitle className="flex items-center gap-2"><Bed className="h-5 w-5" />{ward.name} <Badge variant="secondary">{ward.ward_type}</Badge></CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {wardBeds.map(bed => (
                    <div key={bed.id} className={`border rounded-lg p-3 text-center text-xs font-bold cursor-pointer transition-colors ${statusColor[bed.status || "available"] || ""}`}>
                      <Bed className="h-4 w-4 mx-auto mb-1" />{bed.bed_number}
                      <p className="text-[10px] capitalize mt-0.5">{bed.status}</p>
                    </div>
                  ))}
                  {wardBeds.length === 0 && <p className="col-span-full text-sm text-muted-foreground">No beds configured</p>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppLayout>
  );
}
