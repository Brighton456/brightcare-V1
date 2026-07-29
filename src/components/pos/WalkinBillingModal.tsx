import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { UserPlus, FileText, Phone, Mail, CreditCard, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  total: number;
  hospitalId?: string | null;
  onBillCreated: (patientId: string, patientName: string) => void;
}

export function WalkinBillingModal({ open, onClose, total, hospitalId, onBillCreated }: Props) {
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", idNumber: "", email: "" });
  const [saving, setSaving] = useState(false);

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async () => {
    if (!form.firstName.trim() || !form.phone.trim()) {
      toast({ title: "Required Fields", description: "First name and phone number are required.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      // Check if patient already exists by phone
      let patientId: string | null = null;
      let patientName = `${form.firstName} ${form.lastName}`.trim();

      const { data: existing } = await supabase
        .from("patients")
        .select("id, first_name, last_name")
        .eq("phone", form.phone)
        .eq("hospital_id", hospitalId || "")
        .maybeSingle();

      if (existing) {
        patientId = (existing as any).id;
        patientName = `${(existing as any).first_name} ${(existing as any).last_name}`;
        toast({ title: "Patient Found", description: `${patientName} already registered. Billing to existing record.` });
      } else {
        // Quick-register as walk-in patient
        const patientNo = `WLK-${Date.now().toString(36).toUpperCase()}`;
        const { data: newPatient, error } = await supabase.from("patients").insert({
          patient_no: patientNo,
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim() || "Walk-in",
          phone: form.phone.trim(),
          id_number: form.idNumber.trim() || null,
          email: form.email.trim() || null,
          hospital_id: hospitalId,
          notes: "Walk-in patient (quick registration from POS)",
          is_active: true,
        } as any).select().single();

        if (error || !newPatient) {
          toast({ title: "Registration Failed", description: error?.message || "Could not register walk-in patient.", variant: "destructive" });
          setSaving(false);
          return;
        }
        patientId = (newPatient as any).id;
      }

      if (patientId) {
        onBillCreated(patientId, patientName);
      }

      setForm({ firstName: "", lastName: "", phone: "", idNumber: "", email: "" });
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Walk-in Patient Billing
          </DialogTitle>
          <DialogDescription>
            Quick-capture patient details to create a bill. If the phone number matches an existing patient, we'll link automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Amount preview */}
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" /> Bill Amount
            </span>
            <span className="text-xl font-black text-primary">KES {total.toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">First Name *</Label>
              <Input value={form.firstName} onChange={e => update("firstName", e.target.value)} placeholder="John" autoFocus />
            </div>
            <div>
              <Label className="text-xs">Last Name</Label>
              <Input value={form.lastName} onChange={e => update("lastName", e.target.value)} placeholder="Doe" />
            </div>
          </div>

          <div>
            <Label className="text-xs flex items-center gap-1"><Phone className="h-3 w-3" /> Phone Number *</Label>
            <Input value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="+254 7XX XXX XXX" />
          </div>

          <div>
            <Label className="text-xs flex items-center gap-1"><CreditCard className="h-3 w-3" /> ID / Passport Number</Label>
            <Input value={form.idNumber} onChange={e => update("idNumber", e.target.value)} placeholder="Optional" />
          </div>

          <div>
            <Label className="text-xs flex items-center gap-1"><Mail className="h-3 w-3" /> Email</Label>
            <Input value={form.email} onChange={e => update("email", e.target.value)} placeholder="Optional" type="email" />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving} className="flex-1 gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              {saving ? "Creating..." : "Create Bill"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
