import { useState, useEffect } from "react";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { type Medicine } from "@/data/medicines";
import { FileText, ChevronRight, User, Clock, CheckCircle2, Package, Stethoscope, Search, X, CheckCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { safeQuery } from "@/lib/connectivityGuard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PrescriptionItem {
  id: string;
  medicine_name: string;
  medicine_id: string | null;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  dispensed_qty: number;
  instructions: string | null;
  item_type?: string;
  service_bundle_id?: string | null;
  unit_price?: number;
}

interface PrescriptionRow {
  id: string;
  prescription_no: string;
  status: string;
  notes: string | null;
  created_at: string;
  patient_id: string;
  doctor_id: string;
}

export interface POSPrescriptionDispenseBatch {
  prescriptionId: string;
  patientId: string;
  patientName: string;
  items: { prescriptionItemId: string; medicine: Medicine; qty: number }[];
}

interface Props {
  onFulfillBatch: (batch: POSPrescriptionDispenseBatch) => boolean;
  hospitalId?: string | null;
  activePatientId?: string | null;
}

export function POSPrescriptionQueue({ onFulfillBatch, hospitalId, activePatientId }: Props) {
  const [prescriptions, setPrescriptions] = useState<PrescriptionRow[]>([]);
  const [selectedRx, setSelectedRx] = useState<string | null>(null);
  const [rxItems, setRxItems] = useState<PrescriptionItem[]>([]);
  const [patients, setPatients] = useState<Record<string, string>>({});
  const [doctors, setDoctors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Medicine picker state for unresolved items (supports queue for batch dispensing)
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerResults, setPickerResults] = useState<any[]>([]);
  const [pickerItem, setPickerItem] = useState<PrescriptionItem | null>(null);
  const [pickerRx, setPickerRx] = useState<PrescriptionRow | null>(null);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerQueue, setPickerQueue] = useState<PrescriptionItem[]>([]);
  const [pickerBatchRx, setPickerBatchRx] = useState<PrescriptionRow | null>(null);
  const [markDispensedRx, setMarkDispensedRx] = useState<PrescriptionRow | null>(null);

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    setLoading(true);
    const { data } = await safeQuery<PrescriptionRow[]>("prescriptions", async () => {
      let qb = supabase.from("prescriptions").select("*")
        .in("status", ["pending", "partial", "sent_to_pharmacy", "queued"]);
      if (hospitalId) qb = qb.eq("hospital_id", hospitalId);
      return await qb.order("created_at", { ascending: false }).limit(20);
    });
    if (data) {
      const validRxIds: string[] = [];
      const allRxIds = data.map((r: any) => r.id);
      
      if (allRxIds.length > 0) {
        let itemsQuery: any = supabase.from("prescription_items").select("prescription_id, quantity, dispensed_qty").in("prescription_id", allRxIds);
        if (hospitalId) itemsQuery = itemsQuery.eq("hospital_id", hospitalId);
        const { data: allItems } = await safeQuery<any[]>("prescription_items", async () => await itemsQuery);
        
        if (allItems) {
          const grouped: Record<string, any[]> = {};
          allItems.forEach((i: any) => {
            if (!grouped[i.prescription_id]) grouped[i.prescription_id] = [];
            grouped[i.prescription_id].push(i);
          });
          
          for (const rxId of allRxIds) {
            const items = grouped[rxId] || [];
            const hasUndispensed = items.some((i: any) => (i.quantity - (i.dispensed_qty || 0)) > 0);
            if (hasUndispensed) validRxIds.push(rxId);
          }
        }
      }

      const filtered = (data as PrescriptionRow[]).filter(rx => validRxIds.includes(rx.id));
      setPrescriptions(filtered);
      
      const patientIds = [...new Set(filtered.map(p => p.patient_id))];
      const doctorIds = [...new Set(filtered.map(p => p.doctor_id))];
      if (patientIds.length > 0) {
        let ptsQuery: any = supabase.from("patients").select("id, first_name, last_name").in("id", patientIds);
        if (hospitalId) ptsQuery = ptsQuery.eq("hospital_id", hospitalId);
        const { data: pts } = await safeQuery<any[]>("patients", async () => await ptsQuery);
        if (pts) {
          const map: Record<string, string> = {};
          pts.forEach((p: any) => { map[p.id] = `${p.first_name} ${p.last_name}`; });
          setPatients(map);
        }
      }
      if (doctorIds.length > 0) {
        let docsQuery: any = supabase.from("staff").select("id, first_name, last_name").in("id", doctorIds);
        if (hospitalId) docsQuery = docsQuery.eq("hospital_id", hospitalId);
        const { data: docs } = await safeQuery<any[]>("staff", async () => await docsQuery);
        if (docs) {
          const map: Record<string, string> = {};
          docs.forEach((d: any) => { map[d.id] = `Dr. ${d.first_name} ${d.last_name}`; });
          setDoctors(map);
        }
      }
    }
    setLoading(false);
  };

  const loadRxItems = async (rxId: string) => {
    let query: any = supabase.from("prescription_items").select("*").eq("prescription_id", rxId);
    if (hospitalId) query = query.eq("hospital_id", hospitalId);
    const { data } = await safeQuery<PrescriptionItem[]>("prescription_items", async () => await query);
    if (data) setRxItems(data as PrescriptionItem[]);
  };

  const handleSelectRx = (rxId: string) => {
    if (selectedRx === rxId) { setSelectedRx(null); setRxItems([]); return; }
    setSelectedRx(rxId);
    loadRxItems(rxId);
  };

  /** Extract clean medicine name — strip "Name | Generic | Brand — Price" format */
  const cleanMedicineName = (raw: string): string => {
    // Handle "Name | Generic | Brand — KES xxx" or "Name | Generic | Brand"
    let name = raw.split("—")[0].trim(); // Remove price part
    name = name.split("|")[0].trim(); // Take only the first part (actual name)
    return name;
  };

  /** Resolve medicine: try by ID first, then exact name, then fuzzy name */
  const resolveMedicine = async (item: PrescriptionItem): Promise<Medicine | null> => {
    // 1. Try by medicine_id (exact match)
    if (item.medicine_id) {
      let q: any = supabase.from("medicines").select("*").eq("id", item.medicine_id).eq("is_active", true).limit(1);
      if (hospitalId) q = q.eq("hospital_id", hospitalId);
      const { data: meds } = await safeQuery<any[]>("medicines", async () => await q);
      if (meds && meds.length > 0) return toMedicine(meds[0]);
    }

    // Clean the name to remove detailed label formatting
    const searchName = cleanMedicineName(item.medicine_name);

    // 2. Try exact name match
    let q2: any = supabase.from("medicines").select("*").eq("name", searchName).eq("is_active", true).limit(1);
    if (hospitalId) q2 = q2.eq("hospital_id", hospitalId);
    const { data: exact } = await safeQuery<any[]>("medicines", async () => await q2);
    if (exact && exact.length > 0) return toMedicine(exact[0]);

    // 3. Try with original name too (in case it's already clean)
    if (searchName !== item.medicine_name) {
      let q2b: any = supabase.from("medicines").select("*").eq("name", item.medicine_name).eq("is_active", true).limit(1);
      if (hospitalId) q2b = q2b.eq("hospital_id", hospitalId);
      const { data: exact2 } = await safeQuery<any[]>("medicines", async () => await q2b);
      if (exact2 && exact2.length > 0) return toMedicine(exact2[0]);
    }

    // 4. Try fuzzy name match with cleaned name
    let q3: any = supabase.from("medicines").select("*").ilike("name", `%${searchName}%`).eq("is_active", true).limit(1);
    if (hospitalId) q3 = q3.eq("hospital_id", hospitalId);
    const { data: fuzzy } = await safeQuery<any[]>("medicines", async () => await q3);
    if (fuzzy && fuzzy.length > 0) return toMedicine(fuzzy[0]);

    return null;
  };

  const toMedicine = (m: any): Medicine => ({
    id: m.id, name: m.name, genericName: m.generic_name || "", brand: m.brand || "",
    category: m.category || "", price: m.price, costPrice: m.cost_price || 0,
    stock: m.stock || 0, batchNo: m.batch_no || "", expiryDate: m.expiry_date || "",
    requiresPrescription: m.requires_prescription || false, unit: m.unit || "tablet",
    reorderLevel: m.reorder_level || 10, supplier: m.supplier || "",
    barcode: m.barcode || "", shelfLocation: m.shelf_location || "",
  });

  // --- Medicine Picker for unresolved items ---
  const openMedicinePicker = (item: PrescriptionItem, rx: PrescriptionRow, queue: PrescriptionItem[] = []) => {
    setPickerItem(item);
    setPickerRx(rx);
    setPickerQueue(queue);
    setPickerBatchRx(rx);
    setPickerSearch(item.medicine_name);
    setPickerOpen(true);
    searchMedicines(item.medicine_name);
  };

  const searchMedicines = async (term: string) => {
    if (!term.trim()) { setPickerResults([]); return; }
    setPickerLoading(true);
    let q: any = supabase.from("medicines").select("*")
      .or(`name.ilike.%${term}%,generic_name.ilike.%${term}%,brand.ilike.%${term}%`)
      .eq("is_active", true).limit(15);
    if (hospitalId) q = q.eq("hospital_id", hospitalId);
    const { data } = await q;
    setPickerResults(data || []);
    setPickerLoading(false);
  };

  const selectPickerMedicine = (med: any) => {
    if (!pickerItem || !pickerRx) return;
    if (activePatientId && activePatientId !== pickerRx.patient_id) {
      toast({ title: "One patient at a time", description: "Complete or clear the current patient's cart first.", variant: "destructive" });
      return;
    }
    const qtyToDispense = pickerItem.quantity - (pickerItem.dispensed_qty || 0);
    if (qtyToDispense <= 0) return;
    const medicine = toMedicine(med);
    const success = onFulfillBatch({
      prescriptionId: pickerRx.id,
      patientId: pickerRx.patient_id,
      patientName: patients[pickerRx.patient_id] || "Patient",
      items: [{ prescriptionItemId: pickerItem.id, medicine, qty: qtyToDispense }],
    });
    if (success) {
      toast({ title: "Added to Cart", description: `${medicine.name} × ${qtyToDispense}` });
    }

    // Advance to next item in the queue
    if (pickerQueue.length > 0) {
      const [next, ...rest] = pickerQueue;
      setPickerItem(next);
      setPickerQueue(rest);
      setPickerSearch(next.medicine_name);
      searchMedicines(next.medicine_name);
    } else {
      setPickerOpen(false);
      setPickerItem(null);
      setPickerRx(null);
      setPickerBatchRx(null);
    }
  };

  const confirmMarkDispensed = async () => {
    if (!markDispensedRx) return;
    // Update all items to fully dispensed
    const { error: itemsErr } = await supabase
      .from("prescription_items")
      .update({ dispensed_qty: 9999 } as any)
      .eq("prescription_id", markDispensedRx.id);
    // Update prescription status
    const { error: rxErr } = await supabase
      .from("prescriptions")
      .update({ status: "dispensed" } as any)
      .eq("id", markDispensedRx.id);
    if (rxErr || itemsErr) {
      toast({ title: "Error marking as dispensed", variant: "destructive" });
    } else {
      toast({ title: "Prescription marked as dispensed ✓", description: `${markDispensedRx.prescription_no} has been marked as fully dispensed.` });
    }
    setMarkDispensedRx(null);
    setSelectedRx(null);
    setRxItems([]);
    loadPrescriptions();
  };

  const skipPickerItem = () => {
    if (pickerQueue.length > 0) {
      const [next, ...rest] = pickerQueue;
      setPickerItem(next);
      setPickerQueue(rest);
      setPickerSearch(next.medicine_name);
      searchMedicines(next.medicine_name);
    } else {
      setPickerOpen(false);
      setPickerItem(null);
      setPickerRx(null);
      setPickerBatchRx(null);
    }
  };

  const handleDispenseAll = async (rx: PrescriptionRow) => {
    if (activePatientId && activePatientId !== rx.patient_id) {
      toast({ title: "One patient at a time", description: "Complete or clear the current patient's cart before dispensing for another patient.", variant: "destructive" });
      return;
    }

    const undispensed = rxItems.filter(i => (i.quantity - (i.dispensed_qty || 0)) > 0);
    if (undispensed.length === 0) return;

    const batchItems: POSPrescriptionDispenseBatch["items"] = [];
    const notFound: PrescriptionItem[] = [];

    for (const item of undispensed) {
      const isService = item.item_type === 'service';
      if (isService) {
        batchItems.push({
          prescriptionItemId: item.id,
          medicine: {
            id: item.service_bundle_id || item.id,
            name: item.medicine_name,
            genericName: "Clinical Service", brand: "", category: "Service",
            price: item.unit_price || 0, costPrice: 0, stock: 999,
            batchNo: "", expiryDate: "", requiresPrescription: false,
            unit: "service", reorderLevel: 0,
          } as Medicine,
          qty: item.quantity - (item.dispensed_qty || 0),
        });
      } else {
        const med = await resolveMedicine(item);
        if (med) {
          batchItems.push({
            prescriptionItemId: item.id,
            medicine: med,
            qty: item.quantity - (item.dispensed_qty || 0),
          });
        } else {
          notFound.push(item);
        }
      }
    }

    if (notFound.length > 0) {
      // Open sequential picker for all unresolved items
      const [first, ...rest] = notFound;
      openMedicinePicker(first, rx, rest);
    }

    if (batchItems.length > 0) {
      const success = onFulfillBatch({
        prescriptionId: rx.id,
        patientId: rx.patient_id,
        patientName: patients[rx.patient_id] || "Patient",
        items: batchItems,
      });
      if (success) {
        toast({ title: "Added to Cart", description: `${batchItems.length} item(s) from Rx ${rx.prescription_no}` });
      }
    }
  };

  const handleDispenseSingle = async (item: PrescriptionItem) => {
    const rx = prescriptions.find(r => r.id === selectedRx);
    if (!rx) return;

    if (activePatientId && activePatientId !== rx.patient_id) {
      toast({ title: "One patient at a time", description: "Complete or clear the current patient's cart before dispensing for another patient.", variant: "destructive" });
      return;
    }

    const isService = item.item_type === 'service';
    const qtyToDispense = item.quantity - (item.dispensed_qty || 0);
    if (qtyToDispense <= 0) return;

    if (isService) {
      const itemMedicine = {
        id: item.service_bundle_id || item.id,
        name: item.medicine_name,
        genericName: "Clinical Service", brand: "", category: "Service",
        price: item.unit_price || 0, costPrice: 0, stock: 999,
        batchNo: "", expiryDate: "", requiresPrescription: false,
        unit: "service", reorderLevel: 0,
      } as Medicine;
      const success = onFulfillBatch({
        prescriptionId: rx.id,
        patientId: rx.patient_id,
        patientName: patients[rx.patient_id] || "Patient",
        items: [{ prescriptionItemId: item.id, medicine: itemMedicine, qty: qtyToDispense }],
      });
      if (success) toast({ title: "Added to Cart", description: `${itemMedicine.name} × ${qtyToDispense}` });
      return;
    }

    const med = await resolveMedicine(item);
    if (!med) {
      // Open the medicine picker instead of just showing an error
      openMedicinePicker(item, rx);
      return;
    }

    const success = onFulfillBatch({
      prescriptionId: rx.id,
      patientId: rx.patient_id,
      patientName: patients[rx.patient_id] || "Patient",
      items: [{ prescriptionItemId: item.id, medicine: med, qty: qtyToDispense }],
    });
    if (success) toast({ title: "Added to Cart", description: `${med.name} × ${qtyToDispense}` });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-primary/5">
        <FileText className="h-4 w-4 text-primary" />
        <span className="text-xs font-bold text-primary">PRESCRIPTION QUEUE</span>
        <span className="ml-auto text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-bold">
          {prescriptions.length}
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-4 text-center text-xs text-muted-foreground">Loading prescriptions...</div>
        ) : prescriptions.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-20" />
            <p className="text-xs">No pending prescriptions</p>
          </div>
        ) : (
          prescriptions.map(rx => (
            <div key={rx.id}>
              <button
                onClick={() => handleSelectRx(rx.id)}
                className={`w-full text-left px-3 py-2.5 border-b hover:bg-muted/50 transition-colors ${
                  selectedRx === rx.id ? "bg-primary/5 border-l-2 border-l-primary" : ""
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold text-primary">{rx.prescription_no}</span>
                  <span className={`text-[9px] px-1 rounded font-bold ${
                    rx.status === "pending" ? "bg-warning/10 text-warning" : "bg-info/10 text-info"
                  }`}>{rx.status}</span>
                  <ChevronRight className={`h-3 w-3 text-muted-foreground ml-auto transition-transform ${
                    selectedRx === rx.id ? "rotate-90" : ""
                  }`} />
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground truncate">{patients[rx.patient_id] || "Patient"}</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(rx.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-1">by {doctors[rx.doctor_id] || "Doctor"}</span>
                </div>
              </button>

              {selectedRx === rx.id && rxItems.length > 0 && (
                <div className="bg-muted/30 border-b">
                  {rxItems.filter(i => (i.quantity - (i.dispensed_qty || 0)) > 0).length > 1 && (
                    <button
                      onClick={() => handleDispenseAll(rx)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold bg-primary text-primary-foreground hover:brightness-110 transition-all border-b"
                    >
                      <Package className="h-3.5 w-3.5" /> Dispense All Items
                    </button>
                  )}
                  <button
                    onClick={() => setMarkDispensedRx(rx)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 hover:brightness-110 transition-all border-b"
                  >
                    <CheckCheck className="h-3 w-3" /> Mark as Dispensed (without billing)
                  </button>

                  {rxItems.filter(i => (i.quantity - (i.dispensed_qty || 0)) > 0).map(item => {
                    const remaining = item.quantity - (item.dispensed_qty || 0);
                    const isService = item.item_type === 'service';
                    return (
                      <div key={item.id} className={`px-3 py-2 border-b border-border/50 last:border-b-0 ${isService ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              {isService && <Stethoscope className="h-3 w-3 text-primary shrink-0" />}
                              <p className="text-xs font-semibold truncate">{item.medicine_name}</p>
                            </div>
                            {isService ? (
                              <p className="text-[10px] text-primary font-bold">Service · KES {item.unit_price || 0}</p>
                            ) : (
                              <p className="text-[10px] text-muted-foreground">{item.dosage} · {item.frequency} · {item.duration}</p>
                            )}
                            {item.instructions && !isService && (
                              <p className="text-[10px] text-info italic mt-0.5">{item.instructions}</p>
                            )}
                          </div>
                          <div className="text-right ml-2 shrink-0">
                            <span className="text-[10px] text-muted-foreground">
                              {item.dispensed_qty || 0}/{item.quantity}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDispenseSingle(item)}
                          className="mt-1.5 w-full flex items-center justify-center gap-1 py-1.5 rounded text-[10px] font-bold bg-success text-success-foreground hover:brightness-110 transition-all"
                        >
                          <CheckCircle2 className="h-3 w-3" /> {isService ? `Add Service` : `Dispense ${remaining} ${remaining > 1 ? "units" : "unit"}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <button onClick={loadPrescriptions}
        className="px-3 py-2 text-[10px] text-primary font-semibold border-t hover:bg-muted/50 transition-colors text-center">
        ↻ Refresh Queue
      </button>

      {/* Medicine Picker Dialog for unresolved items */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-md max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Search className="h-4 w-4" /> Match Medicine from Inventory
              {pickerQueue.length > 0 && (
                <span className="ml-auto text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-bold">
                  +{pickerQueue.length} more
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-xs font-semibold text-destructive">Prescribed item not auto-matched:</p>
              <p className="text-sm font-bold mt-0.5">{pickerItem?.medicine_name}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {pickerItem?.dosage} · {pickerItem?.frequency} · Qty: {(pickerItem?.quantity || 0) - (pickerItem?.dispensed_qty || 0)}
              </p>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={pickerSearch}
                onChange={e => { setPickerSearch(e.target.value); searchMedicines(e.target.value); }}
                placeholder="Search by name, generic, or brand..."
                className="pl-8 h-9 text-xs"
              />
            </div>

            <div className="space-y-1 max-h-[40vh] overflow-y-auto">
              {pickerLoading ? (
                <p className="text-xs text-center text-muted-foreground py-4">Searching...</p>
              ) : pickerResults.length === 0 ? (
                <p className="text-xs text-center text-muted-foreground py-4">No medicines found. Try a different search term.</p>
              ) : (
                pickerResults.map(med => (
                  <button
                    key={med.id}
                    onClick={() => selectPickerMedicine(med)}
                    className="w-full text-left p-2.5 rounded-lg border hover:bg-primary/5 hover:border-primary/30 transition-colors"
                  >
                    <p className="text-xs font-semibold">{med.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {med.generic_name && <span className="text-[10px] text-muted-foreground">Generic: {med.generic_name}</span>}
                      {med.brand && <span className="text-[10px] text-muted-foreground">Brand: {med.brand}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-bold text-primary">KES {med.price}</span>
                      <span className={`text-[10px] font-bold ${med.stock > 0 ? 'text-success' : 'text-destructive'}`}>
                        Stock: {med.stock}
                      </span>
                      {med.batch_no && <span className="text-[10px] text-muted-foreground">Batch: {med.batch_no}</span>}
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="flex gap-2">
              {pickerQueue.length > 0 && (
                <Button variant="secondary" size="sm" className="flex-1" onClick={skipPickerItem}>
                  Skip this item →
                </Button>
              )}
              <Button variant="outline" size="sm" className="flex-1" onClick={() => { setPickerOpen(false); setPickerQueue([]); setPickerItem(null); setPickerRx(null); setPickerBatchRx(null); }}>
                <X className="h-3.5 w-3.5 mr-1" /> {pickerQueue.length > 0 ? "Cancel All" : "Cancel"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mark as Dispensed Confirmation */}
      <AlertDialog open={!!markDispensedRx} onOpenChange={(v) => !v && setMarkDispensedRx(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCheck className="h-5 w-5 text-amber-600" /> Mark Prescription as Dispensed?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will mark <strong>{markDispensedRx?.prescription_no}</strong> for <strong>{markDispensedRx ? patients[markDispensedRx.patient_id] || "Patient" : ""}</strong> as fully dispensed without processing through the POS billing.
              <br /><br />
              <span className="text-amber-600 font-semibold">⚠️ No billing or stock deductions will be applied.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmMarkDispensed} className="bg-amber-600 hover:bg-amber-700 text-white">
              Yes, Mark as Dispensed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
