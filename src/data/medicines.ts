export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  brand: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  batchNo: string;
  expiryDate: string;
  requiresPrescription: boolean;
  unit: string;
  reorderLevel: number;
  supplier?: string;
  barcode?: string;
  shelfLocation?: string;
}

export const medicines: Medicine[] = [
  { id: "M001", name: "Paracetamol 500mg", genericName: "Acetaminophen", brand: "GSK", category: "Pain Relief", price: 50, costPrice: 30, stock: 500, batchNo: "B2024-001", expiryDate: "2026-08-15", requiresPrescription: false, unit: "tablet", reorderLevel: 100, barcode: "8901234001", shelfLocation: "A1" },
  { id: "M002", name: "Amoxicillin 250mg Caps", genericName: "Amoxicillin", brand: "Beecham", category: "Antibiotics", price: 120, costPrice: 75, stock: 200, batchNo: "B2024-012", expiryDate: "2025-12-30", requiresPrescription: true, unit: "capsule", reorderLevel: 50, barcode: "8901234002", shelfLocation: "B3" },
  { id: "M003", name: "Ibuprofen 400mg", genericName: "Ibuprofen", brand: "Dawa Ltd", category: "Pain Relief", price: 80, costPrice: 45, stock: 350, batchNo: "B2024-045", expiryDate: "2027-03-20", requiresPrescription: false, unit: "tablet", reorderLevel: 80, barcode: "8901234003", shelfLocation: "A2" },
  { id: "M004", name: "Metformin 500mg", genericName: "Metformin HCl", brand: "Regal Pharma", category: "Diabetes", price: 150, costPrice: 90, stock: 180, batchNo: "B2024-023", expiryDate: "2026-06-10", requiresPrescription: true, unit: "tablet", reorderLevel: 40, barcode: "8901234004", shelfLocation: "C1" },
  { id: "M005", name: "Omeprazole 20mg", genericName: "Omeprazole", brand: "Cosmos", category: "GI Tract", price: 200, costPrice: 120, stock: 120, batchNo: "B2024-067", expiryDate: "2026-01-25", requiresPrescription: true, unit: "capsule", reorderLevel: 30, barcode: "8901234005", shelfLocation: "D2" },
  { id: "M006", name: "Cetirizine 10mg", genericName: "Cetirizine HCl", brand: "Dawa Ltd", category: "Allergy", price: 60, costPrice: 35, stock: 400, batchNo: "B2024-089", expiryDate: "2027-05-18", requiresPrescription: false, unit: "tablet", reorderLevel: 60, barcode: "8901234006", shelfLocation: "A3" },
  { id: "M007", name: "Artemether/Lumefantrine", genericName: "ALu", brand: "Novartis", category: "Antimalarials", price: 350, costPrice: 220, stock: 90, batchNo: "B2024-034", expiryDate: "2025-11-08", requiresPrescription: true, unit: "pack", reorderLevel: 25, barcode: "8901234007", shelfLocation: "E1" },
  { id: "M008", name: "Diclofenac Gel 30g", genericName: "Diclofenac", brand: "GSK", category: "Pain Relief", price: 280, costPrice: 170, stock: 65, batchNo: "B2024-056", expiryDate: "2026-09-12", requiresPrescription: false, unit: "tube", reorderLevel: 20, barcode: "8901234008", shelfLocation: "F2" },
  { id: "M009", name: "Azithromycin 500mg", genericName: "Azithromycin", brand: "Pfizer", category: "Antibiotics", price: 450, costPrice: 300, stock: 75, batchNo: "B2024-078", expiryDate: "2026-04-30", requiresPrescription: true, unit: "tablet", reorderLevel: 20, barcode: "8901234009", shelfLocation: "B1" },
  { id: "M010", name: "Salbutamol Inhaler", genericName: "Salbutamol", brand: "GSK", category: "Respiratory", price: 650, costPrice: 420, stock: 40, batchNo: "B2024-091", expiryDate: "2026-07-22", requiresPrescription: true, unit: "inhaler", reorderLevel: 10, barcode: "8901234010", shelfLocation: "G1" },
  { id: "M011", name: "Loratadine 10mg", genericName: "Loratadine", brand: "Cosmos", category: "Allergy", price: 70, costPrice: 40, stock: 300, batchNo: "B2024-102", expiryDate: "2027-01-14", requiresPrescription: false, unit: "tablet", reorderLevel: 50, barcode: "8901234011", shelfLocation: "A4" },
  { id: "M012", name: "Ciprofloxacin 500mg", genericName: "Ciprofloxacin", brand: "Regal Pharma", category: "Antibiotics", price: 180, costPrice: 110, stock: 150, batchNo: "B2024-115", expiryDate: "2026-10-05", requiresPrescription: true, unit: "tablet", reorderLevel: 35, barcode: "8901234012", shelfLocation: "B4" },
  { id: "M013", name: "ORS Sachets (Box 20)", genericName: "Oral Rehydration Salts", brand: "Dawa Ltd", category: "GI Tract", price: 250, costPrice: 150, stock: 200, batchNo: "B2024-128", expiryDate: "2027-08-20", requiresPrescription: false, unit: "box", reorderLevel: 40, barcode: "8901234013", shelfLocation: "D1" },
  { id: "M014", name: "Atenolol 50mg", genericName: "Atenolol", brand: "Beta Healthcare", category: "Cardiovascular", price: 120, costPrice: 72, stock: 160, batchNo: "B2024-140", expiryDate: "2026-12-18", requiresPrescription: true, unit: "tablet", reorderLevel: 30, barcode: "8901234014", shelfLocation: "C2" },
  { id: "M015", name: "Prednisolone 5mg", genericName: "Prednisolone", brand: "Cosmos", category: "Anti-inflammatory", price: 90, costPrice: 55, stock: 220, batchNo: "B2024-155", expiryDate: "2026-05-28", requiresPrescription: true, unit: "tablet", reorderLevel: 45, barcode: "8901234015", shelfLocation: "C3" },
  { id: "M016", name: "Cough Syrup 100ml", genericName: "Dextromethorphan", brand: "Dawa Ltd", category: "Respiratory", price: 180, costPrice: 105, stock: 85, batchNo: "B2024-168", expiryDate: "2026-03-15", requiresPrescription: false, unit: "bottle", reorderLevel: 20, barcode: "8901234016", shelfLocation: "F1" },
  { id: "M017", name: "Metronidazole 400mg", genericName: "Metronidazole", brand: "Cosmos", category: "Antibiotics", price: 95, costPrice: 55, stock: 280, batchNo: "B2024-180", expiryDate: "2027-02-10", requiresPrescription: true, unit: "tablet", reorderLevel: 50, barcode: "8901234017", shelfLocation: "B5" },
  { id: "M018", name: "Zinc Sulphate 20mg", genericName: "Zinc Sulphate", brand: "Dawa Ltd", category: "Supplements", price: 45, costPrice: 25, stock: 450, batchNo: "B2024-195", expiryDate: "2027-09-15", requiresPrescription: false, unit: "tablet", reorderLevel: 80, barcode: "8901234018", shelfLocation: "H1" },
  { id: "M019", name: "Fluconazole 150mg", genericName: "Fluconazole", brand: "Pfizer", category: "Antifungals", price: 220, costPrice: 140, stock: 100, batchNo: "B2024-210", expiryDate: "2026-11-20", requiresPrescription: true, unit: "capsule", reorderLevel: 25, barcode: "8901234019", shelfLocation: "E2" },
  { id: "M020", name: "Multivitamin Syrup 200ml", genericName: "Multivitamins", brand: "GSK", category: "Supplements", price: 320, costPrice: 200, stock: 60, batchNo: "B2024-225", expiryDate: "2026-08-30", requiresPrescription: false, unit: "bottle", reorderLevel: 15, barcode: "8901234020", shelfLocation: "H2" },
  { id: "M021", name: "Amlodipine 5mg", genericName: "Amlodipine", brand: "Regal Pharma", category: "Cardiovascular", price: 110, costPrice: 65, stock: 190, batchNo: "B2024-240", expiryDate: "2027-04-12", requiresPrescription: true, unit: "tablet", reorderLevel: 35, barcode: "8901234021", shelfLocation: "C4" },
  { id: "M022", name: "Doxycycline 100mg", genericName: "Doxycycline", brand: "Cosmos", category: "Antibiotics", price: 130, costPrice: 80, stock: 170, batchNo: "B2024-255", expiryDate: "2026-07-18", requiresPrescription: true, unit: "capsule", reorderLevel: 30, barcode: "8901234022", shelfLocation: "B6" },
  { id: "M023", name: "Clotrimazole Cream 20g", genericName: "Clotrimazole", brand: "Dawa Ltd", category: "Antifungals", price: 150, costPrice: 85, stock: 110, batchNo: "B2024-270", expiryDate: "2027-01-25", requiresPrescription: false, unit: "tube", reorderLevel: 25, barcode: "8901234023", shelfLocation: "F3" },
  { id: "M024", name: "Ferrous Sulphate 200mg", genericName: "Iron Supplement", brand: "Beta Healthcare", category: "Supplements", price: 55, costPrice: 30, stock: 380, batchNo: "B2024-285", expiryDate: "2027-06-20", requiresPrescription: false, unit: "tablet", reorderLevel: 60, barcode: "8901234024", shelfLocation: "H3" },
];

export const categories = ["All", ...Array.from(new Set(medicines.map(m => m.category)))];

export interface CartItem extends Medicine {
  qty: number;
  discount: number;
  note?: string;
  lineTotal: number;
  // Prescription tracking metadata
  prescriptionItemId?: string;
  prescriptionId?: string;
  sourcePatientId?: string;
  sourceType?: "prescription" | "walkin";
}

export interface Sale {
  id: string;
  receiptNo: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  taxRate: number;
  total: number;
  paymentMethod: string;
  amountPaid: number;
  change: number;
  cashier: string;
  customer?: string;
  timestamp: Date;
  status: "completed" | "refunded" | "held";
}

export interface HeldSale {
  id: string;
  items: CartItem[];
  customer?: string;
  heldAt: Date;
  note?: string;
}
