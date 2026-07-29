import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { type Medicine, type Sale, medicines as initialMedicines } from "@/data/medicines";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  balance: number; // credit balance owed
  totalSpent: number;
  visits: number;
  createdAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email?: string;
  phone?: string;
  address?: string;
  leadTimeDays: number;
  rating: number; // 1-5
  status: "active" | "inactive";
}

export interface StockAdjustment {
  id: string;
  medicineId: string;
  medicineName: string;
  type: "received" | "adjusted" | "returned" | "damaged" | "expired";
  quantityChange: number;
  previousStock: number;
  newStock: number;
  reason: string;
  batchNo?: string;
  performedBy: string;
  timestamp: Date;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  items: { medicineId: string; medicineName: string; quantity: number; unitCost: number }[];
  status: "draft" | "ordered" | "received" | "cancelled";
  totalCost: number;
  createdAt: Date;
  expectedDate?: string;
  receivedAt?: Date;
}

interface NotificationSettings {
  lowStockAlerts: boolean;
  expiryWarnings: boolean;
  dailySalesSummary: boolean;
  newStaffLogin: boolean;
}

interface PharmacyState {
  medicines: Medicine[];
  customers: Customer[];
  suppliers: Supplier[];
  salesHistory: Sale[];
  stockAdjustments: StockAdjustment[];
  purchaseOrders: PurchaseOrder[];
  notifications: NotificationSettings;

  // Medicine CRUD
  addMedicine: (med: Omit<Medicine, "id">) => void;
  updateMedicine: (id: string, updates: Partial<Medicine>) => void;
  deleteMedicine: (id: string) => void;

  // Stock operations
  adjustStock: (
    medicineId: string,
    change: number,
    type: StockAdjustment["type"],
    reason: string,
    batchNo?: string,
  ) => void;
  receiveStock: (
    items: { medicineId: string; quantity: number; batchNo?: string; expiryDate?: string; costPrice?: number }[],
  ) => void;

  // Customer CRUD
  addCustomer: (c: Omit<Customer, "id" | "totalSpent" | "visits" | "createdAt">) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  recordCustomerSale: (customerId: string, amount: number) => void;
  adjustCustomerBalance: (customerId: string, amount: number) => void;

  // Supplier CRUD
  addSupplier: (s: Omit<Supplier, "id">) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  // Sales
  addSale: (sale: Sale) => void;
  refundSale: (saleId: string) => void;

  // Purchase Orders
  createPurchaseOrder: (order: Omit<PurchaseOrder, "id" | "createdAt">) => void;
  updatePurchaseOrderStatus: (id: string, status: PurchaseOrder["status"]) => void;

  // Settings
  updateNotifications: (settings: Partial<NotificationSettings>) => void;
}

const PharmacyContext = createContext<PharmacyState | null>(null);

const initialCustomers: Customer[] = [
  {
    id: "C001",
    name: "Mary Wanjiku",
    phone: "+254 712 345 678",
    email: "mary@gmail.com",
    balance: 0,
    totalSpent: 15200,
    visits: 12,
    createdAt: new Date("2025-06-15"),
  },
  {
    id: "C002",
    name: "John Kamau",
    phone: "+254 723 456 789",
    balance: 850,
    totalSpent: 8900,
    visits: 7,
    createdAt: new Date("2025-08-20"),
  },
  {
    id: "C003",
    name: "Grace Muthoni",
    phone: "+254 734 567 890",
    email: "grace.m@yahoo.com",
    balance: 0,
    totalSpent: 22400,
    visits: 18,
    createdAt: new Date("2025-03-10"),
  },
  {
    id: "C004",
    name: "Peter Ochieng",
    phone: "+254 745 678 901",
    balance: 2100,
    totalSpent: 31500,
    visits: 24,
    createdAt: new Date("2025-01-05"),
  },
  {
    id: "C005",
    name: "Alice Njeri",
    phone: "+254 756 789 012",
    email: "alice.njeri@gmail.com",
    balance: 0,
    totalSpent: 6700,
    visits: 5,
    createdAt: new Date("2025-11-28"),
  },
  {
    id: "C006",
    name: "David Mutua",
    phone: "+254 767 890 123",
    balance: 450,
    totalSpent: 12300,
    visits: 9,
    createdAt: new Date("2025-07-12"),
  },
  {
    id: "C007",
    name: "Susan Wambui",
    phone: "+254 778 901 234",
    email: "susan.w@hotmail.com",
    balance: 0,
    totalSpent: 4500,
    visits: 3,
    createdAt: new Date("2026-01-15"),
  },
  {
    id: "C008",
    name: "James Otieno",
    phone: "+254 789 012 345",
    balance: 1200,
    totalSpent: 18700,
    visits: 14,
    createdAt: new Date("2025-04-22"),
  },
];

const initialSuppliers: Supplier[] = [
  {
    id: "S001",
    name: "Kenya Medical Supplies",
    contact: "James Mwangi",
    email: "orders@kms.co.ke",
    phone: "+254 20 271 0000",
    address: "Industrial Area, Nairobi",
    leadTimeDays: 3,
    rating: 5,
    status: "active",
  },
  {
    id: "S002",
    name: "Dawa Limited",
    contact: "Sarah Njuguna",
    email: "supply@dawa.co.ke",
    phone: "+254 20 550 8000",
    address: "Baba Dogo, Nairobi",
    leadTimeDays: 2,
    rating: 4,
    status: "active",
  },
  {
    id: "S003",
    name: "Cosmos Pharmaceutical",
    contact: "Peter Oloo",
    email: "info@cosmos.co.ke",
    phone: "+254 20 650 0000",
    address: "Athi River, Machakos",
    leadTimeDays: 4,
    rating: 4,
    status: "active",
  },
  {
    id: "S004",
    name: "Beta Healthcare",
    contact: "Anne Wanjiku",
    email: "orders@betahealthcare.com",
    phone: "+254 20 660 5000",
    address: "Kijabe Street, Nairobi",
    leadTimeDays: 5,
    rating: 3,
    status: "active",
  },
  {
    id: "S005",
    name: "Regal Pharmaceuticals",
    contact: "David Kimathi",
    email: "supply@regal.co.ke",
    phone: "+254 20 823 6000",
    address: "Likoni Road, Nairobi",
    leadTimeDays: 3,
    rating: 4,
    status: "inactive",
  },
];

let nextMedId = 25;
let nextCustId = 9;
let nextSuppId = 6;
let nextAdjId = 1;
let nextPoId = 1;

export function PharmacyProvider({ children }: { children: ReactNode }) {
  const [medicines, setMedicines] = useState<Medicine[]>(initialMedicines);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);
  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [notifications, setNotifications] = useState<NotificationSettings>({
    lowStockAlerts: true,
    expiryWarnings: true,
    dailySalesSummary: false,
    newStaffLogin: true,
  });

  const addMedicine = useCallback((med: Omit<Medicine, "id">) => {
    const id = `M${String(nextMedId++).padStart(3, "0")}`;
    setMedicines((prev) => [...prev, { ...med, id }]);
  }, []);

  const updateMedicine = useCallback((id: string, updates: Partial<Medicine>) => {
    setMedicines((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  }, []);

  const deleteMedicine = useCallback((id: string) => {
    setMedicines((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const adjustStock = useCallback(
    (medicineId: string, change: number, type: StockAdjustment["type"], reason: string, batchNo?: string) => {
      setMedicines((prev) => {
        const med = prev.find((m) => m.id === medicineId);
        if (!med) return prev;
        const newStock = Math.max(0, med.stock + change);
        const adj: StockAdjustment = {
          id: `ADJ-${String(nextAdjId++).padStart(4, "0")}`,
          medicineId,
          medicineName: med.name,
          type,
          quantityChange: change,
          previousStock: med.stock,
          newStock,
          reason,
          batchNo,
          performedBy: "Admin",
          timestamp: new Date(),
        };
        setStockAdjustments((p) => [adj, ...p]);
        return prev.map((m) => (m.id === medicineId ? { ...m, stock: newStock, ...(batchNo ? { batchNo } : {}) } : m));
      });
    },
    [],
  );

  const receiveStock = useCallback(
    (items: { medicineId: string; quantity: number; batchNo?: string; expiryDate?: string; costPrice?: number }[]) => {
      setMedicines((prev) => {
        const updated = [...prev];
        items.forEach((item) => {
          const idx = updated.findIndex((m) => m.id === item.medicineId);
          if (idx >= 0) {
            const med = updated[idx];
            const adj: StockAdjustment = {
              id: `ADJ-${String(nextAdjId++).padStart(4, "0")}`,
              medicineId: item.medicineId,
              medicineName: med.name,
              type: "received",
              quantityChange: item.quantity,
              previousStock: med.stock,
              newStock: med.stock + item.quantity,
              reason: "Stock received",
              batchNo: item.batchNo,
              performedBy: "Admin",
              timestamp: new Date(),
            };
            setStockAdjustments((p) => [adj, ...p]);
            updated[idx] = {
              ...med,
              stock: med.stock + item.quantity,
              ...(item.batchNo ? { batchNo: item.batchNo } : {}),
              ...(item.expiryDate ? { expiryDate: item.expiryDate } : {}),
              ...(item.costPrice ? { costPrice: item.costPrice } : {}),
            };
          }
        });
        return updated;
      });
    },
    [],
  );

  const addCustomer = useCallback((c: Omit<Customer, "id" | "totalSpent" | "visits" | "createdAt">) => {
    const id = `C${String(nextCustId++).padStart(3, "0")}`;
    setCustomers((prev) => [...prev, { ...c, id, totalSpent: 0, visits: 0, createdAt: new Date() }]);
  }, []);

  const updateCustomer = useCallback((id: string, updates: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, []);

  const deleteCustomer = useCallback((id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const recordCustomerSale = useCallback((customerId: string, amount: number) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, totalSpent: c.totalSpent + amount, visits: c.visits + 1 } : c)),
    );
  }, []);

  const adjustCustomerBalance = useCallback((customerId: string, amount: number) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, balance: Math.max(0, c.balance + amount) } : c)),
    );
  }, []);

  const addSupplier = useCallback((s: Omit<Supplier, "id">) => {
    const id = `S${String(nextSuppId++).padStart(3, "0")}`;
    setSuppliers((prev) => [...prev, { ...s, id }]);
  }, []);

  const updateSupplier = useCallback((id: string, updates: Partial<Supplier>) => {
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  }, []);

  const deleteSupplier = useCallback((id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const addSale = useCallback((sale: Sale) => {
    setSalesHistory((prev) => [sale, ...prev]);
    // Deduct stock
    setMedicines((prev) => {
      const updated = [...prev];
      sale.items.forEach((item) => {
        const idx = updated.findIndex((m) => m.id === item.id);
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], stock: Math.max(0, updated[idx].stock - item.qty) };
        }
      });
      return updated;
    });
  }, []);

  const refundSale = useCallback((saleId: string) => {
    setSalesHistory((prev) => {
      const sale = prev.find((s) => s.id === saleId);
      if (sale) {
        // Restore stock
        setMedicines((meds) => {
          const updated = [...meds];
          sale.items.forEach((item) => {
            const idx = updated.findIndex((m) => m.id === item.id);
            if (idx >= 0) {
              updated[idx] = { ...updated[idx], stock: updated[idx].stock + item.qty };
            }
          });
          return updated;
        });
      }
      return prev.map((s) => (s.id === saleId ? { ...s, status: "refunded" as const } : s));
    });
  }, []);

  const createPurchaseOrder = useCallback((order: Omit<PurchaseOrder, "id" | "createdAt">) => {
    const id = `PO-${String(nextPoId++).padStart(4, "0")}`;
    setPurchaseOrders((prev) => [...prev, { ...order, id, createdAt: new Date() }]);
  }, []);

  const updatePurchaseOrderStatus = useCallback((id: string, status: PurchaseOrder["status"]) => {
    setPurchaseOrders((prev) =>
      prev.map((po) =>
        po.id === id ? { ...po, status, ...(status === "received" ? { receivedAt: new Date() } : {}) } : po,
      ),
    );
  }, []);

  const updateNotifications = useCallback((settings: Partial<NotificationSettings>) => {
    setNotifications((prev) => ({ ...prev, ...settings }));
  }, []);

  return (
    <PharmacyContext.Provider
      value={{
        medicines,
        customers,
        suppliers,
        salesHistory,
        stockAdjustments,
        purchaseOrders,
        notifications,
        addMedicine,
        updateMedicine,
        deleteMedicine,
        adjustStock,
        receiveStock,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        recordCustomerSale,
        adjustCustomerBalance,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addSale,
        refundSale,
        createPurchaseOrder,
        updatePurchaseOrderStatus,
        updateNotifications,
      }}
    >
      {children}
    </PharmacyContext.Provider>
  );
}

export function usePharmacy() {
  const ctx = useContext(PharmacyContext);
  if (!ctx) throw new Error("usePharmacy must be used within PharmacyProvider");
  return ctx;
}
