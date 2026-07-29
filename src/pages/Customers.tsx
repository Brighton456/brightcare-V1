import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePharmacy } from "@/contexts/PharmacyStore";
import { AddEditCustomerModal } from "@/components/customers/AddEditCustomerModal";
import { type Customer } from "@/contexts/PharmacyStore";
import { exportToCSV } from "@/utils/exportUtils";
import { toast } from "@/hooks/use-toast";
import {
  Search, Plus, Download, UserCircle, Phone, Mail, DollarSign, Edit2, Trash2, CreditCard,
} from "lucide-react";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { useAuth } from "@/contexts/AuthContext";

export default function Customers() {
  const { customers, deleteCustomer, adjustCustomerBalance } = usePharmacy();
  const { staff } = useAuth();
  const isAdmin = ["hospital_admin", "super_admin", "platform_admin"].includes(staff?.role || "");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.email || "").toLowerCase().includes(q);
  });

  const totalOwed = customers.reduce((s, c) => s + c.balance, 0);
  const activeCustomers = customers.filter(c => c.visits > 0).length;

  const handleExport = () => {
    exportToCSV(customers.map(c => ({
      Name: c.name, Phone: c.phone, Email: c.email || "", Balance: c.balance,
      "Total Spent": c.totalSpent, Visits: c.visits, "Created At": c.createdAt.toLocaleDateString(),
    })), "brightech-customers");
    toast({ title: "Exported", description: "Customer list exported as CSV." });
  };

  const handlePayment = () => {
    if (!paymentCustomer) return;
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) return;
    adjustCustomerBalance(paymentCustomer.id, -amount);
    toast({ title: "Payment Recorded", description: `KES ${amount.toLocaleString()} received from ${paymentCustomer.name}` });
    setPaymentCustomer(null);
    setPaymentAmount("");
  };

  return (
    <AppLayout title="Customer Management">
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><UserCircle className="h-5 w-5 text-primary" /></div>
              <div><p className="text-2xl font-bold">{customers.length}</p><p className="text-xs text-muted-foreground">Total Customers</p></div>
            </div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center"><DollarSign className="h-5 w-5 text-success" /></div>
              <div><p className="text-2xl font-bold">KES {customers.reduce((s, c) => s + c.totalSpent, 0).toLocaleString()}</p><p className="text-xs text-muted-foreground">Total Revenue</p></div>
            </div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center"><CreditCard className="h-5 w-5 text-destructive" /></div>
              <div><p className="text-2xl font-bold text-destructive">KES {totalOwed.toLocaleString()}</p><p className="text-xs text-muted-foreground">Total Credit Owed</p></div>
            </div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center"><UserCircle className="h-5 w-5 text-info" /></div>
              <div><p className="text-2xl font-bold">{activeCustomers}</p><p className="text-xs text-muted-foreground">Active Customers</p></div>
            </div>
          </CardContent></Card>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers..." className="pl-9" />
          </div>
          <Button size="sm" variant="outline" onClick={handleExport}><Download className="h-4 w-4 mr-1" />Export</Button>
          <Button size="sm" onClick={() => { setEditCustomer(null); setShowModal(true); }}><Plus className="h-4 w-4 mr-1" />Add Customer</Button>
        </div>

        <Card>
          <CardContent className="p-0 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Customer</th>
                  <th className="text-left p-3 font-medium">Phone</th>
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-right p-3 font-medium">Total Spent</th>
                  <th className="text-right p-3 font-medium">Credit Balance</th>
                  <th className="text-right p-3 font-medium">Visits</th>
                  <th className="text-center p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">{c.name}</td>
                    <td className="p-3 text-muted-foreground text-xs">{c.phone}</td>
                    <td className="p-3 text-muted-foreground text-xs">{c.email || "—"}</td>
                    <td className="p-3 text-right font-mono text-xs font-semibold">KES {c.totalSpent.toLocaleString()}</td>
                    <td className="p-3 text-right">
                      {c.balance > 0 ? (
                        <Badge variant="destructive" className="text-[10px]">KES {c.balance.toLocaleString()}</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">Clear</Badge>
                      )}
                    </td>
                    <td className="p-3 text-right text-xs">{c.visits}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => { setEditCustomer(c); setShowModal(true); }} className="p-1.5 rounded hover:bg-muted" title="Edit">
                          <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                        {c.balance > 0 && (
                          <button onClick={() => setPaymentCustomer(c)} className="p-1.5 rounded hover:bg-success/10" title="Receive Payment">
                            <DollarSign className="h-3.5 w-3.5 text-success" />
                          </button>
                        )}
                        {isAdmin && (
                          <button onClick={() => setDeleteTarget(c)}
                            className="p-1.5 rounded hover:bg-destructive/10" title="Delete">
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Payment dialog - inline */}
        {paymentCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50">
            <div className="bg-card rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
              <h3 className="font-bold mb-3">Receive Payment — {paymentCustomer.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">Outstanding: <strong className="text-destructive">KES {paymentCustomer.balance.toLocaleString()}</strong></p>
              <Input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="Amount received" autoFocus
                onKeyDown={e => e.key === "Enter" && handlePayment()} />
              <div className="flex gap-2 mt-3">
                <Button variant="outline" onClick={() => setPaymentCustomer(null)} className="flex-1">Cancel</Button>
                <Button onClick={handlePayment} className="flex-1">Record Payment</Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <AddEditCustomerModal open={showModal} onClose={() => { setShowModal(false); setEditCustomer(null); }} customer={editCustomer} />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteCustomer(deleteTarget.id);
            toast({ title: "Customer Deleted", description: `"${deleteTarget.name}" has been removed.` });
            setDeleteTarget(null);
          }
        }}
        itemName={deleteTarget?.name}
      />
    </AppLayout>
  );
}
