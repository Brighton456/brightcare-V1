import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePharmacy, type Customer } from "@/contexts/PharmacyStore";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  customer?: Customer | null;
}

export function AddEditCustomerModal({ open, onClose, customer }: Props) {
  const { addCustomer, updateCustomer } = usePharmacy();
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", balance: 0 });

  useEffect(() => {
    if (customer) {
      setForm({ name: customer.name, phone: customer.phone, email: customer.email || "", address: customer.address || "", balance: customer.balance });
    } else {
      setForm({ name: "", phone: "", email: "", address: "", balance: 0 });
    }
  }, [customer, open]);

  const handleSave = () => {
    if (!form.name || !form.phone) {
      toast({ title: "Validation Error", description: "Name and phone are required.", variant: "destructive" });
      return;
    }
    if (customer) {
      updateCustomer(customer.id, form);
      toast({ title: "Customer Updated" });
    } else {
      addCustomer(form);
      toast({ title: "Customer Added", description: `${form.name} added to customer list.` });
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{customer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Full Name *</label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Phone Number *</label>
            <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+254 7XX XXX XXX" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Email</label>
            <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Address</label>
            <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          </div>
          {customer && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Credit Balance (KES)</label>
              <Input type="number" value={form.balance} onChange={e => setForm(f => ({ ...f, balance: parseFloat(e.target.value) || 0 }))} />
            </div>
          )}
          <div className="flex gap-2 pt-2 justify-end">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>{customer ? "Save Changes" : "Add Customer"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
