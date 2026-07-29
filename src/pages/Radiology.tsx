import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Image, FileImage, Monitor } from "lucide-react";

export default function Radiology() {
  return (
    <AppLayout title="Radiology & Imaging">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-4 flex items-center gap-3"><Image className="h-8 w-8 text-primary" /><div><p className="text-2xl font-black">0</p><p className="text-xs text-muted-foreground">Pending Scans</p></div></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Today's Scans</p><p className="text-2xl font-black">0</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Equipment Online</p><p className="text-2xl font-black text-success">3</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Reports Pending</p><p className="text-2xl font-black text-warning">0</p></CardContent></Card>
        </div>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Monitor className="h-5 w-5" />Imaging Queue</CardTitle></CardHeader><CardContent>
          <div className="text-center py-12 text-muted-foreground"><FileImage className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>No imaging requests. Doctors can request scans from the Doctor Console.</p></div>
        </CardContent></Card>
      </div>
    </AppLayout>
  );
}
