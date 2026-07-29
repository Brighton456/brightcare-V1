import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useHospital } from "@/contexts/HospitalContext";
import { useState, useEffect } from "react";
import { Plus, Trash2, Save, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BillItem { description: string; item_type: string; quantity: number; unit_price: number; total: number; }

export default function CreateBill() {
  const { hospitalId, hospital } = useHospital();
  const taxRate = (hospital?.tax_rate ?? 16) / 100;
  const [patients, setPatients] = useState<any[]>([]);
  const [patientId, setPatientId] = useState("");
  const [items, setItems] = useState<BillItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const { toast } = useToast();

  useEffect(() => { if (hospitalId) supabase.from("patients").select("id,first_name,last_name,patient_no").eq("hospital_id", hospitalId).eq("is_active", true).then(({ data }) => setPatients(data || [])); }, [hospitalId]);

  const addItem = () => setItems([...items, { description: "", item_type: "service", quantity: 1, unit_price: 0, total: 0 }]);
  const updateItem = (i: number, field: string, value: any) => {
    const updated = [...items];
    (updated[i] as any)[field] = value;
    updated[i].total = updated[i].quantity * updated[i].unit_price;
    setItems(updated);
  };
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  const total = subtotal + tax - discount;

  const saveBill = async () => {
    if (!patientId || items.length === 0) { toast({ title: "Add patient and items", variant: "destructive" }); return; }
    const billNo = `BILL-${Date.now().toString(36).toUpperCase()}`;
    const { data: bill, error } = await supabase.from("bills").insert({ bill_no: billNo, patient_id: patientId, subtotal, tax, discount, total, status: "pending" , hospital_id: hospitalId }).select().single();
    if (error || !bill) { toast({ title: "Error creating bill", variant: "destructive" }); return; }
    await supabase.from("bill_items").insert(items.map(i => ({ bill_id: bill.id, ...i, hospital_id: hospitalId })));
    toast({ title: `Bill ${billNo} created` });
    setItems([]); setPatientId(""); setDiscount(0);
  };

  return (
    <AppLayout title="Create Bill">
      <div className="max-w-4xl space-y-6">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" />New Hospital Bill</CardTitle></CardHeader><CardContent className="space-y-4">
          <div><Label>Patient</Label><Select value={patientId} onValueChange={setPatientId}><SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger><SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.patient_no})</SelectItem>)}</SelectContent></Select></div>
          <div className="flex justify-between items-center"><Label className="text-lg font-bold">Bill Items</Label><Button size="sm" onClick={addItem}><Plus className="h-3 w-3 mr-1" />Add Item</Button></div>
          <Table><TableHeader><TableRow><TableHead>Description</TableHead><TableHead>Type</TableHead><TableHead>Qty</TableHead><TableHead>Unit Price</TableHead><TableHead>Total</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>{items.map((item, i) => (
              <TableRow key={i}>
                <TableCell><Input value={item.description} onChange={e => updateItem(i, "description", e.target.value)} placeholder="Service/item description" /></TableCell>
                <TableCell><Select value={item.item_type} onValueChange={v => updateItem(i, "item_type", v)}><SelectTrigger className="w-28"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="service">Service</SelectItem><SelectItem value="consultation">Consultation</SelectItem><SelectItem value="lab">Lab Test</SelectItem><SelectItem value="medicine">Medicine</SelectItem><SelectItem value="procedure">Procedure</SelectItem><SelectItem value="bed">Bed Charge</SelectItem></SelectContent></Select></TableCell>
                <TableCell><Input type="number" className="w-16" value={item.quantity} onChange={e => updateItem(i, "quantity", +e.target.value)} /></TableCell>
                <TableCell><Input type="number" className="w-24" value={item.unit_price} onChange={e => updateItem(i, "unit_price", +e.target.value)} /></TableCell>
                <TableCell className="font-bold">KES {item.total.toLocaleString()}</TableCell>
                <TableCell><Button size="icon" variant="ghost" onClick={() => removeItem(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
              </TableRow>
            ))}</TableBody></Table>
          <div className="flex justify-end"><div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>KES {subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Tax (16%)</span><span>KES {tax.toLocaleString()}</span></div>
            <div className="flex justify-between items-center"><span>Discount</span><Input type="number" className="w-24 h-7 text-sm" value={discount} onChange={e => setDiscount(+e.target.value)} /></div>
            <div className="flex justify-between font-black text-lg border-t pt-2"><span>Total</span><span>KES {total.toLocaleString()}</span></div>
          </div></div>
          <Button onClick={saveBill} className="w-full"><Save className="h-4 w-4 mr-2" />Create Bill</Button>
        </CardContent></Card>
      </div>
    </AppLayout>
  );
}
