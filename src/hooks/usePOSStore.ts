import { useState, useCallback, useMemo } from "react";
import { type Medicine, type CartItem, type Sale, type HeldSale } from "@/data/medicines";
import { supabase } from "@/integrations/supabase/client";

const RX_RECEIPT_PREFIX = "RX-";

const parseRxReceiptNumber = (receiptNo: string | null | undefined) => {
  if (!receiptNo?.startsWith(RX_RECEIPT_PREFIX)) return null;

  const parsed = Number.parseInt(receiptNo.slice(RX_RECEIPT_PREFIX.length), 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const getNextRxReceiptNo = async () => {
  const { data, error } = await supabase
    .from("pharmacy_sales")
    .select("receipt_no")
    .like("receipt_no", `${RX_RECEIPT_PREFIX}%`)
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) {
    console.error("Receipt lookup error:", error);
    return `${RX_RECEIPT_PREFIX}${Date.now()}`;
  }

  const maxReceiptNumber = (data ?? []).reduce((max, row: any) => {
    const parsed = parseRxReceiptNumber(row.receipt_no);
    return parsed !== null && parsed > max ? parsed : max;
  }, 1000);

  return `${RX_RECEIPT_PREFIX}${maxReceiptNumber + 1}`;
};

const isDuplicateReceiptError = (error: any) =>
  error?.code === "23505" || (typeof error?.message === "string" && error.message.toLowerCase().includes("duplicate"));

export function usePOSStore(taxRatePct: number = 16) {
  const taxRate = taxRatePct / 100;
  const [cart, setCart] = useState<CartItem[]>([]);
  const [heldSales, setHeldSales] = useState<HeldSale[]>(() => {
    try {
      const stored = localStorage.getItem("pos_held_sales");
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((h: any) => ({ ...h, heldAt: new Date(h.heldAt) }));
      }
    } catch {}
    return [];
  });
  const [currentCustomer, setCurrentCustomer] = useState<string>("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Persist held sales to localStorage
  const updateHeldSales = (updater: (prev: HeldSale[]) => HeldSale[]) => {
    setHeldSales(prev => {
      const next = updater(prev);
      try { localStorage.setItem("pos_held_sales", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const addToCart = useCallback((medicine: Medicine) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === medicine.id);
      if (existing) {
        if (existing.qty >= medicine.stock) return prev;
        return prev.map((c) =>
          c.id === medicine.id ? { ...c, qty: c.qty + 1, lineTotal: (c.qty + 1) * (c.price - c.discount) } : c,
        );
      }
      return [...prev, { ...medicine, qty: 1, discount: 0, lineTotal: medicine.price }];
    });
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    setCart((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, qty: Math.max(1, qty), lineTotal: Math.max(1, qty) * (c.price - c.discount) } : c,
      ),
    );
  }, []);

  const updateDiscount = useCallback((id: string, discount: number) => {
    setCart((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, discount: Math.max(0, discount), lineTotal: c.qty * (c.price - Math.max(0, discount)) }
          : c,
      ),
    );
  }, []);

  const updateNote = useCallback((id: string, note: string) => {
    setCart((prev) => prev.map((c) => (c.id === id ? { ...c, note } : c)));
  }, []);

  const updatePrice = useCallback((id: string, price: number) => {
    setCart((prev) => prev.map((c) => (c.id === id ? { ...c, price, lineTotal: c.qty * (price - c.discount) } : c)));
  }, []);

  const removeItem = useCallback((id: string) => {
    setCart((prev) => prev.filter((c) => c.id !== id));
    setSelectedItemId((prev) => (prev === id ? null : prev));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setCurrentCustomer("");
    setSelectedItemId(null);
  }, []);

  const holdSale = useCallback(
    (note?: string) => {
      if (cart.length === 0) return;
      updateHeldSales((prev) => [
        ...prev,
        {
          id: `HOLD-${Date.now()}`,
          items: [...cart],
          customer: currentCustomer || undefined,
          heldAt: new Date(),
          note,
        },
      ]);
      clearCart();
    },
    [cart, currentCustomer, clearCart],
  );

  const resumeSale = useCallback(
    (heldId: string) => {
      const held = heldSales.find((h) => h.id === heldId);
      if (!held) return;
      setCart(held.items);
      setCurrentCustomer(held.customer || "");
      updateHeldSales((prev) => prev.filter((h) => h.id !== heldId));
    },
    [heldSales],
  );

  const completeSale = useCallback(
    async (paymentMethod: string, amountPaid: number, hospitalId?: string | null, cashierId?: string | null, cashierName?: string | null): Promise<Sale | null> => {
      if (cart.length === 0) return null;

      const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
      const discount = cart.reduce((s, c) => s + c.discount * c.qty, 0);
      const taxable = subtotal - discount;
      const tax = Math.round(taxable * taxRate);
      const total = taxable + tax;

      if (!paymentMethod.startsWith("split:") && paymentMethod !== "credit" && paymentMethod !== "bill" && amountPaid < total) {
        return null;
      }

      let persistedSale: Sale | null = null;

      try {
        const salePayload = {
          subtotal,
          discount,
          tax,
          total,
          payment_method: paymentMethod,
          amount_paid: amountPaid,
          change_amount: Math.max(0, amountPaid - total),
          customer_name: currentCustomer || null,
          hospital_id: hospitalId || null,
          cashier_id: cashierId || null,
          status: "completed",
        };

        const insertSale = (receiptNo: string) =>
          supabase
            .from("pharmacy_sales")
            .insert({
              ...salePayload,
              receipt_no: receiptNo,
            } as any)
            .select()
            .single();

        let receiptNo = await getNextRxReceiptNo();
        let { data: saleRow, error: saleErr } = await insertSale(receiptNo);

        if (isDuplicateReceiptError(saleErr)) {
          receiptNo = `${RX_RECEIPT_PREFIX}${Date.now()}`;
          ({ data: saleRow, error: saleErr } = await insertSale(receiptNo));
        }

        if (saleErr || !saleRow) {
          console.error("Sale save error:", saleErr);
          return null;
        }

        persistedSale = {
          id: (saleRow as any).id ?? `SALE-${Date.now()}`,
          receiptNo,
          items: [...cart],
          subtotal,
          discount,
          tax,
          taxRate: taxRatePct,
          total,
          paymentMethod,
          amountPaid,
          change: Math.max(0, amountPaid - total),
          cashier: cashierName || "Cashier",
          customer: currentCustomer || undefined,
          timestamp: (saleRow as any).created_at ? new Date((saleRow as any).created_at) : new Date(),
          status: "completed",
        };

        const items = cart.map((c) => ({
          sale_id: (saleRow as any).id,
          medicine_id: c.id,
          medicine_name: c.name,
          quantity: c.qty,
          unit_price: c.price,
          discount: c.discount,
          total: c.qty * (c.price - c.discount),
          hospital_id: hospitalId || null,
        }));

        const { error: itemsErr } = await supabase.from("pharmacy_sale_items").insert(items as any);
        if (itemsErr) {
          console.error("Sale items save error:", itemsErr);
        }

        if (paymentMethod.includes("credit") && paymentMethod.startsWith("split:")) {
          const creditMatch = paymentMethod.match(/credit\((\d+)\)/);
          const creditAmount = creditMatch ? parseFloat(creditMatch[1]) : 0;
          const buyerMatch = paymentMethod.match(/credit_buyer:([^|]*)\|([^|]*)\|([^|]*)/);

          if (creditAmount > 0) {
            const { error: creditErr } = await supabase.from("credit_sales").insert({
              hospital_id: hospitalId || null,
              sale_id: (saleRow as any).id,
              buyer_name: buyerMatch ? buyerMatch[1] : (currentCustomer || "Walk-in"),
              buyer_phone: buyerMatch ? buyerMatch[2] : null,
              due_date: buyerMatch && buyerMatch[3] ? buyerMatch[3] : null,
              amount_credited: creditAmount,
              amount_paid: amountPaid - creditAmount,
              status: "pending",
            } as any);

            if (creditErr) {
              console.error("Credit sale save error:", creditErr);
            }
          }
        }

        const stockUpdates = cart.map(async (c) => {
          const { data: medData, error: readErr } = await supabase
            .from("medicines")
            .select("stock")
            .eq("id", c.id)
            .single();

          if (readErr) {
            console.error(`Stock read error for ${c.name}:`, readErr);
            return;
          }

          const currentStock = (medData as any)?.stock ?? 0;
          const newStock = Math.max(0, currentStock - c.qty);
          const { error: updateErr } = await supabase
            .from("medicines")
            .update({ stock: newStock } as any)
            .eq("id", c.id);

          if (updateErr) {
            console.error(`Stock update error for ${c.name}:`, updateErr);
          }
        });

        await Promise.all(stockUpdates);
      } catch (e) {
        console.error("Failed to persist sale:", e);
        if (!persistedSale) return null;
      }

      clearCart();
      return persistedSale;
    },
    [cart, currentCustomer, clearCart, taxRate, taxRatePct],
  );

  const subtotal = useMemo(() => cart.reduce((s, c) => s + c.price * c.qty, 0), [cart]);
  const totalDiscount = useMemo(() => cart.reduce((s, c) => s + c.discount * c.qty, 0), [cart]);
  const taxable = subtotal - totalDiscount;
  const tax = Math.round(taxable * taxRate);
  const total = taxable + tax;
  const itemCount = useMemo(() => cart.reduce((s, c) => s + c.qty, 0), [cart]);
  const totalQtySold = itemCount;

  return {
    cart,
    heldSales,
    currentCustomer,
    selectedItemId,
    setCurrentCustomer,
    setSelectedItemId,
    addToCart,
    updateQty,
    updateDiscount,
    updatePrice,
    updateNote,
    removeItem,
    clearCart,
    holdSale,
    resumeSale,
    completeSale,
    subtotal,
    totalDiscount,
    tax,
    total,
    itemCount,
    totalQtySold,
  };
}
