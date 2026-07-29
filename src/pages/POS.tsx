import { useState, useEffect, useRef } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useHospital } from "@/contexts/HospitalContext";
import { useAuth } from "@/contexts/AuthContext";
import { POSSearchBar } from "@/components/pos/POSSearchBar";
import { POSItemTable } from "@/components/pos/POSItemTable";
import { POSSideActions } from "@/components/pos/POSSideActions";
import { POSPaymentBar } from "@/components/pos/POSPaymentBar";
import { ReceiptModal } from "@/components/pos/ReceiptModal";
import { QuickPickModal } from "@/components/pos/QuickPickModal";
import { HeldReceiptsModal } from "@/components/pos/HeldReceiptsModal";
import { DiscountModal } from "@/components/pos/DiscountModal";
import { SplitPaymentModal } from "@/components/pos/SplitPaymentModal";
import { ReturnModal } from "@/components/pos/ReturnModal";
import { CreditSaleModal } from "@/components/pos/CreditSaleModal";
import { POSPrescriptionQueue, type POSPrescriptionDispenseBatch } from "@/components/pos/POSPrescriptionQueue";
import { POSSalesDrawer } from "@/components/pos/POSSalesDrawer";
import { POSLiveStats } from "@/components/pos/POSLiveStats";
import { AddEditMedicineModal } from "@/components/medicines/AddEditMedicineModal";
import { WalkinBillingModal } from "@/components/pos/WalkinBillingModal";
import { usePOSStore } from "@/hooks/usePOSStore";
import { usePOSPatientBilling } from "@/hooks/usePOSPatientBilling";
import { usePharmacy } from "@/contexts/PharmacyStore";
import { type Sale, type Medicine } from "@/data/medicines";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  UserCircle,
  Clock,
  ChevronDown,
  Home,
  Zap,
  Percent,
  RotateCcw,
  Split,
  CreditCard,
  Plus,
  Receipt,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// Track which prescription items are pending in the cart (not yet paid)
interface PendingRxItem {
  prescriptionId: string;
  prescriptionItemId: string;
  qty: number;
}

export default function POS() {
  const { can } = usePermissions();
  const { hospitalId, hospital } = useHospital();
  const { staff } = useAuth();
  const isAdmin = staff?.role === "admin";
  const store = usePOSStore(hospital?.tax_rate ?? 16);
  const patientBilling = usePOSPatientBilling(hospitalId);
  const pharmacy = usePharmacy();
  const navigate = useNavigate();
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [autoPrintReceipt, setAutoPrintReceipt] = useState(false);
  const [showQuickPick, setShowQuickPick] = useState(false);
  const [showHeldReceipts, setShowHeldReceipts] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showSplitPayment, setShowSplitPayment] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [showCredit, setShowCredit] = useState(false);
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [showIWantTo, setShowIWantTo] = useState(false);
  const [showSalesDrawer, setShowSalesDrawer] = useState(false);
  const [showRxPanel, setShowRxPanel] = useState(true);
  const [showWalkinBilling, setShowWalkinBilling] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Track prescription items added to cart, pending payment
  const [pendingRxItems, setPendingRxItems] = useState<PendingRxItem[]>([]);
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const rxQueueRef = useRef<{ refresh: () => void }>(null);

  // Finalize prescription dispensing after payment is confirmed
  const finalizePrescriptionDispense = async () => {
    if (pendingRxItems.length === 0) return;

    const byPrescription: Record<string, PendingRxItem[]> = {};
    for (const item of pendingRxItems) {
      if (!byPrescription[item.prescriptionId]) byPrescription[item.prescriptionId] = [];
      byPrescription[item.prescriptionId].push(item);
    }

    for (const [prescriptionId, items] of Object.entries(byPrescription)) {
      for (const item of items) {
        // Get current dispensed_qty and add to it
        const { data: current } = await supabase
          .from("prescription_items")
          .select("dispensed_qty, quantity")
          .eq("id", item.prescriptionItemId)
          .single();

        if (current) {
          const newDispensed = Math.min((current as any).quantity, ((current as any).dispensed_qty || 0) + item.qty);
          await supabase.from("prescription_items")
            .update({ dispensed_qty: newDispensed } as any)
            .eq("id", item.prescriptionItemId);
        }
      }

      // Check if all items in this prescription are fully dispensed
      const { data: allItems } = await supabase
        .from("prescription_items")
        .select("quantity, dispensed_qty")
        .eq("prescription_id", prescriptionId);

      if (allItems) {
        const allDone = (allItems as any[]).every((i: any) => (i.dispensed_qty || 0) >= i.quantity);
        if (allDone) {
          await supabase.from("prescriptions")
            .update({ status: "dispensed" } as any)
            .eq("id", prescriptionId);
        } else {
          await supabase.from("prescriptions")
            .update({ status: "partial" } as any)
            .eq("id", prescriptionId);
        }
      }
    }

    setPendingRxItems([]);
    setActivePatientId(null);
  };

  const handleCompleteSale = async (method: string, amount: number) => {
    const cashierName = staff ? `${staff.first_name} ${staff.last_name} (${staff.role})` : "Cashier";
    const sale = await store.completeSale(method, amount, hospitalId, staff?.id || null, cashierName);
    if (sale) {
      pharmacy.addSale(sale);
      setAutoPrintReceipt(false);
      setLastSale(sale);
      // Mark prescription items as dispensed NOW (after payment confirmed)
      await finalizePrescriptionDispense();

      // If "bill" method selected, create or update a bill record for the patient
      if (method === "bill" && patientBilling.linkedPatient) {
        try {
          const patientId = patientBilling.linkedPatient.patientId;
          const patientName = patientBilling.linkedPatient.patientName;

          // Check for an existing pending bill for this patient
          const { data: existingBills } = await supabase
            .from("bills")
            .select("id, bill_no, subtotal, tax, discount, total")
            .eq("patient_id", patientId)
            .eq("status", "pending")
            .eq("hospital_id", hospitalId as string)
            .order("created_at", { ascending: false })
            .limit(1);

          const billItems = sale.items.map((item: any) => ({
            description: `Medicine: ${item.name}`,
            item_type: "pharmacy",
            quantity: item.qty,
            unit_price: item.price,
            total: item.qty * (item.price - (item.discount || 0)),
            hospital_id: hospitalId,
          }));

          if (existingBills && existingBills.length > 0) {
            // Update existing pending bill — append items and add totals
            const existing = existingBills[0] as any;
            const newSubtotal = (existing.subtotal || 0) + sale.subtotal;
            const newTax = (existing.tax || 0) + sale.tax;
            const newDiscount = (existing.discount || 0) + sale.discount;
            const newTotal = (existing.total || 0) + sale.total;

            await supabase.from("bills").update({
              subtotal: newSubtotal,
              tax: newTax,
              discount: newDiscount,
              total: newTotal,
              notes: `Updated with pharmacy dispensation - Receipt ${sale.receiptNo}`,
            } as any).eq("id", existing.id);

            // Add items to existing bill
            const itemsWithBillId = billItems.map((i: any) => ({ ...i, bill_id: existing.id }));
            await supabase.from("bill_items").insert(itemsWithBillId as any);

            toast({
              title: "📋 Bill Updated",
              description: `KES ${sale.total.toLocaleString()} added to ${patientName}'s bill ${existing.bill_no}`,
            });
          } else {
            // Create new pending bill
            const billNo = `BILL-PH-${Date.now().toString().slice(-8)}`;
            const { data: billRow, error: billErr } = await supabase.from("bills").insert({
              bill_no: billNo,
              patient_id: patientId,
              hospital_id: hospitalId,
              status: "pending",
              subtotal: sale.subtotal,
              tax: sale.tax,
              discount: sale.discount,
              total: sale.total,
              amount_paid: 0,
              notes: `Pharmacy dispensation - Receipt ${sale.receiptNo}`,
            } as any).select().single();

            if (billErr) {
              console.error("Bill creation error:", billErr);
              toast({ title: "Bill Error", description: billErr.message, variant: "destructive" });
            } else if (billRow) {
              const itemsWithBillId = billItems.map((i: any) => ({ ...i, bill_id: (billRow as any).id }));
              await supabase.from("bill_items").insert(itemsWithBillId as any);
              toast({
                title: "📋 Bill Created",
                description: `Bill ${billNo} for ${patientName} — KES ${sale.total.toLocaleString()}`,
              });
            }
          }
        } catch (e: any) {
          console.error("Bill creation/update failed:", e);
          toast({ title: "Bill Error", description: e.message, variant: "destructive" });
        }
      }

      if (patientBilling.linkedPatient) {
        patientBilling.refreshBilling();
      }
    }
  };

  const handleSaveAndPrint = async (method: string, amount: number) => {
    const cashierName = staff ? `${staff.first_name} ${staff.last_name} (${staff.role})` : "Cashier";
    const sale = await store.completeSale(method, amount, hospitalId, staff?.id || null, cashierName);
    if (sale) {
      pharmacy.addSale(sale);
      setAutoPrintReceipt(true);
      setLastSale(sale);
      await finalizePrescriptionDispense();
    }
  };

  const handleFulfillBatch = (batch: POSPrescriptionDispenseBatch): boolean => {
    // Block multi-patient
    if (activePatientId && activePatientId !== batch.patientId) {
      toast({
        title: "One patient at a time",
        description: "Complete or clear the current patient's cart before dispensing for another.",
        variant: "destructive",
      });
      return false;
    }

    // Also block if cart has walkin items and we're trying to add prescription items
    if (store.cart.length > 0 && !activePatientId && store.cart.some(c => !c.sourceType || c.sourceType === "walkin")) {
      // Cart has walkin items - allow mixing? For now block if patient is different concept
      // Actually allow - just set patient
    }

    // Add each item to cart
    for (const item of batch.items) {
      const medWithMeta: Medicine & { prescriptionItemId?: string; prescriptionId?: string; sourcePatientId?: string; sourceType?: string } = {
        ...item.medicine,
        prescriptionItemId: item.prescriptionItemId,
        prescriptionId: batch.prescriptionId,
        sourcePatientId: batch.patientId,
        sourceType: "prescription",
      };

      // Use a unique cart ID for prescription items
      for (let i = 0; i < item.qty; i++) {
        store.addToCart(medWithMeta as Medicine);
      }
    }

    // Track pending rx items
    setPendingRxItems(prev => [
      ...prev,
      ...batch.items.map(i => ({
        prescriptionId: batch.prescriptionId,
        prescriptionItemId: i.prescriptionItemId,
        qty: i.qty,
      })),
    ]);

    // Set active patient and auto-link
    setActivePatientId(batch.patientId);
    if (!patientBilling.linkedPatient) {
      patientBilling.linkPatient(batch.patientId);
      store.setCurrentCustomer(batch.patientName);
    }

    return true;
  };

  const handleClearCart = () => {
    store.clearCart();
    patientBilling.clearPatient();
    setPendingRxItems([]);
    setActivePatientId(null);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowIWantTo(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F2") { e.preventDefault(); setShowQuickPick(true); }
      if (e.key === "F3") { e.preventDefault(); setShowHeldReceipts(true); }
      if (e.key === "F4") { e.preventDefault(); setShowDiscount(true); }
      if (e.key === "F5") { e.preventDefault(); setShowReturn(true); }
      if (e.key === "F6") { e.preventDefault(); setShowSplitPayment(true); }
      if (e.key === "F7") { e.preventDefault(); setShowCredit(true); }
      if (e.key === "F8") { e.preventDefault(); setShowSalesDrawer(true); }
      if (e.key === "F9") { e.preventDefault(); setShowRxPanel(p => !p); }
      if (e.key === "Escape") { store.setSelectedItemId(null); setShowIWantTo(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [store]);

  const iWantToActions = [
    { label: "Quick Pick Items", icon: Zap, shortcut: "F2", action: () => setShowQuickPick(true) },
    { label: "Add New Medicine", icon: Plus, action: () => setShowAddMedicine(true) },
    { label: "Give Discount", icon: Percent, shortcut: "F4", action: () => setShowDiscount(true), disabled: store.cart.length === 0 },
    { label: "Accept Return", icon: RotateCcw, shortcut: "F5", action: () => setShowReturn(true) },
    { label: "Split Payment", icon: Split, shortcut: "F6", action: () => setShowSplitPayment(true), disabled: store.cart.length === 0 },
    { label: "Credit Sale", icon: CreditCard, shortcut: "F7", action: () => setShowCredit(true), disabled: store.cart.length === 0 },
    { label: "View Held Sales", icon: Clock, shortcut: "F3", action: () => setShowHeldReceipts(true) },
    { label: "Today's Sales", icon: Receipt, shortcut: "F8", action: () => setShowSalesDrawer(true) },
    { label: showRxPanel ? "Hide Rx Queue" : "Show Rx Queue", icon: FileText, shortcut: "F9", action: () => setShowRxPanel(p => !p) },
    { label: "Process Patient Payment", icon: Wallet, action: () => navigate("/billing") },
    { label: "Go to Dashboard", icon: Home, action: () => navigate("/dashboard") },
  ];

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <div className="h-10 bg-[hsl(var(--pos-header))] flex items-center px-4 gap-4 shrink-0">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-[hsl(var(--pos-header-foreground))] hover:opacity-80">
          <Home className="h-4 w-4" />
          <span className="text-sm font-semibold">Brightcare</span>
        </button>
        <span className="text-[hsl(var(--pos-header-foreground))]/50">|</span>
        <span className="text-sm font-bold text-[hsl(var(--pos-header-foreground))]">Pharmacy POS</span>

        <div className="ml-auto flex items-center gap-4">
          <POSLiveStats hospitalId={hospitalId} />
          <span className="text-xs text-[hsl(var(--pos-header-foreground))]/70">
            {new Date().toLocaleString("en-US", { hour: "2-digit", minute: "2-digit", weekday: "short", month: "short", day: "numeric" })}
          </span>
          <div className="flex gap-2 text-[10px] text-[hsl(var(--pos-header-foreground))]/60">
            <span className="kbd">F2</span> Pick
            <span className="kbd">F4</span> Disc
            <span className="kbd">F5</span> Ret
            <span className="kbd">F6</span> Split
            <span className="kbd">F8</span> Sales
            <span className="kbd">F9</span> Rx
          </div>
          {store.heldSales.length > 0 && (
            <button onClick={() => setShowHeldReceipts(true)} className="flex items-center gap-1 text-xs text-warning font-semibold animate-pulse">
              <Clock className="h-3.5 w-3.5" />
              {store.heldSales.length} Held
            </button>
          )}
        </div>
      </div>

      {/* Search bar row */}
      <div className="flex items-center gap-3 px-4 py-2 bg-card border-b shrink-0">
        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setShowIWantTo(!showIWantTo)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-success text-success-foreground text-sm font-semibold hover:brightness-110 transition-all">
            <span>🔧</span> I Want to...
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showIWantTo ? "rotate-180" : ""}`} />
          </button>
          {showIWantTo && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-card border rounded-lg shadow-xl z-50 py-1">
              {iWantToActions.map(a => (
                <button key={a.label} onClick={() => { a.action(); setShowIWantTo(false); }} disabled={a.disabled}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <a.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1">{a.label}</span>
                  {a.shortcut && <span className="text-[10px] text-muted-foreground kbd">{a.shortcut}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        <POSSearchBar onAdd={store.addToCart} hospitalId={hospitalId} />
        <div className="flex items-center gap-2 border-2 border-border rounded-lg bg-card px-3 w-72">
          <UserCircle className="h-4 w-4 text-muted-foreground shrink-0" />
          <input value={store.currentCustomer} onChange={e => store.setCurrentCustomer(e.target.value)}
            placeholder="Customer name or phone" className="flex-1 bg-transparent text-sm outline-none py-2.5 placeholder:text-muted-foreground" />
        </div>
        <button onClick={() => setShowRxPanel(p => !p)} className="p-2 rounded-lg hover:bg-muted transition-colors" title={showRxPanel ? "Hide Rx Queue" : "Show Rx Queue"}>
          {showRxPanel ? <PanelLeftClose className="h-4 w-4 text-muted-foreground" /> : <PanelLeftOpen className="h-4 w-4 text-muted-foreground" />}
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {showRxPanel && (
          <div className="w-56 border-r bg-card flex flex-col min-h-0 shrink-0 overflow-y-auto">
            <POSPrescriptionQueue onFulfillBatch={handleFulfillBatch} hospitalId={hospitalId} activePatientId={activePatientId} />
          </div>
        )}
        <div className="p-2 shrink-0 overflow-y-auto">
          <POSSideActions cartLength={store.cart.length} onQuickPick={() => setShowQuickPick(true)} onGiveDiscount={() => setShowDiscount(true)}
            onAcceptReturn={() => setShowReturn(true)} onAddNewItem={() => setShowAddMedicine(true)}
            onSplitPayment={() => setShowSplitPayment(true)} onCreditSale={() => setShowCredit(true)} />
        </div>
        <div className="flex-1 flex flex-col min-h-0 min-w-0 p-2 pl-0">
          <POSItemTable cart={store.cart} selectedItemId={store.selectedItemId} onSelectItem={store.setSelectedItemId}
            onUpdateQty={store.updateQty} onUpdateDiscount={store.updateDiscount} onUpdatePrice={store.updatePrice}
            onUpdateNote={store.updateNote} onRemoveItem={store.removeItem} isAdmin={isAdmin} />
        </div>
      </div>

      {patientBilling.linkedPatient && (
        <div className="shrink-0 flex items-center gap-3 px-6 py-1.5 bg-primary/5 border-t text-xs">
          <span className="font-bold text-primary">👤 Patient: {patientBilling.linkedPatient.patientName}</span>
          <span className="text-muted-foreground">|</span>
          <span>Cumulative Bill: <strong className="text-destructive">KES {patientBilling.linkedPatient.cumulativeTotal.toLocaleString()}</strong></span>
          <span className="text-muted-foreground">({patientBilling.linkedPatient.pendingBills} pending bill{patientBilling.linkedPatient.pendingBills !== 1 ? "s" : ""})</span>
          <button onClick={() => { patientBilling.clearPatient(); setActivePatientId(null); }} className="ml-auto text-[10px] text-muted-foreground hover:text-destructive">✕ Unlink</button>
        </div>
      )}

      <POSPaymentBar total={store.total} itemCount={store.itemCount} totalQtySold={store.totalQtySold}
        subtotal={store.subtotal} tax={store.tax} totalDiscount={store.totalDiscount} cartLength={store.cart.length}
        currentCustomer={store.currentCustomer} onSetCustomer={store.setCurrentCustomer}
        onCompleteSale={handleCompleteSale} onHoldSale={store.holdSale} onClearCart={handleClearCart}
        onSaveAndPrint={handleSaveAndPrint} linkedPatient={patientBilling.linkedPatient}
        onWalkinBillRequest={() => setShowWalkinBilling(true)} />

      {lastSale && (
        <ReceiptModal sale={lastSale} onClose={() => { setLastSale(null); setAutoPrintReceipt(false); }} autoPrint={autoPrintReceipt} />
      )}
      <QuickPickModal open={showQuickPick} onClose={() => setShowQuickPick(false)} onAdd={store.addToCart} hospitalId={hospitalId} />
      <HeldReceiptsModal open={showHeldReceipts} onClose={() => setShowHeldReceipts(false)} heldSales={store.heldSales} onResume={store.resumeSale} />
      <DiscountModal open={showDiscount} onClose={() => setShowDiscount(false)} cart={store.cart} onApplyLineDiscount={store.updateDiscount} subtotal={store.subtotal} />
      <SplitPaymentModal open={showSplitPayment} onClose={() => setShowSplitPayment(false)} total={store.total} onComplete={handleCompleteSale} />
      <ReturnModal open={showReturn} onClose={() => setShowReturn(false)} />
      <CreditSaleModal open={showCredit} onClose={() => setShowCredit(false)} total={store.total} onComplete={handleCompleteSale} />
      <POSSalesDrawer open={showSalesDrawer} onClose={() => setShowSalesDrawer(false)} />
      {showAddMedicine && <AddEditMedicineModal open={showAddMedicine} onClose={() => setShowAddMedicine(false)} />}
      <WalkinBillingModal
        open={showWalkinBilling}
        onClose={() => setShowWalkinBilling(false)}
        total={store.total}
        hospitalId={hospitalId}
        onBillCreated={async (patientId, patientName) => {
          // Link the walk-in patient and trigger billing
          await patientBilling.linkPatient(patientId);
          store.setCurrentCustomer(patientName);

          try {
            // Check for existing pending bill for this walk-in patient
            const { data: existingBills } = await supabase
              .from("bills")
              .select("id, bill_no, subtotal, tax, discount, total")
              .eq("patient_id", patientId)
              .eq("status", "pending")
              .eq("hospital_id", hospitalId as string)
              .order("created_at", { ascending: false })
              .limit(1);

            const billItems = store.cart.map(item => ({
              description: `Medicine: ${item.name}`,
              item_type: "pharmacy",
              quantity: item.qty,
              unit_price: item.price,
              total: item.qty * (item.price - (item.discount || 0)),
              hospital_id: hospitalId,
            }));

            if (existingBills && existingBills.length > 0) {
              // Update existing pending bill
              const existing = existingBills[0] as any;
              const newSubtotal = (existing.subtotal || 0) + store.subtotal;
              const newTax = (existing.tax || 0) + store.tax;
              const newDiscount = (existing.discount || 0) + store.totalDiscount;
              const newTotal = (existing.total || 0) + store.total;

              await supabase.from("bills").update({
                subtotal: newSubtotal,
                tax: newTax,
                discount: newDiscount,
                total: newTotal,
                notes: "Walk-in patient billing from POS (updated)",
              } as any).eq("id", existing.id);

              const itemsWithBillId = billItems.map((i: any) => ({ ...i, bill_id: existing.id }));
              await supabase.from("bill_items").insert(itemsWithBillId as any);

              toast({
                title: "📋 Bill Updated",
                description: `KES ${store.total.toLocaleString()} added to ${patientName}'s bill ${existing.bill_no}. Process payment in Billing.`,
              });
            } else {
              // Create new pending bill
              const billNo = `BILL-WK-${Date.now().toString().slice(-8)}`;
              const { data: billRow, error } = await supabase.from("bills").insert({
                bill_no: billNo,
                patient_id: patientId,
                hospital_id: hospitalId,
                status: "pending",
                subtotal: store.subtotal,
                tax: store.tax,
                discount: store.totalDiscount,
                total: store.total,
                amount_paid: 0,
                notes: "Walk-in patient billing from POS",
              } as any).select().single();

              if (error || !billRow) {
                toast({ title: "Bill Error", description: error?.message || "Could not create bill.", variant: "destructive" });
                return;
              }

              const itemsWithBillId = billItems.map((i: any) => ({ ...i, bill_id: (billRow as any).id }));
              await supabase.from("bill_items").insert(itemsWithBillId as any);

              toast({
                title: "📋 Walk-in Bill Created",
                description: `Bill ${billNo} for ${patientName} — KES ${store.total.toLocaleString()}. Process payment in Billing.`,
              });
            }

            // Complete as "bill" but skip duplicate bill creation via a special flag
            const cashierName = staff ? `${staff.first_name} ${staff.last_name} (${staff.role})` : "Cashier";
            const sale = await store.completeSale("bill", store.total, hospitalId, staff?.id || null, cashierName);
            if (sale) {
              pharmacy.addSale(sale);
              setLastSale(sale);
              await finalizePrescriptionDispense();
              patientBilling.refreshBilling();
            }
          } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
          }
        }}
      />
    </div>
  );
}
