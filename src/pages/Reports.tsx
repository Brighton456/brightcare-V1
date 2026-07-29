import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import {
  BarChart3, DollarSign, TrendingUp, Users, Package, CreditCard,
  AlertTriangle, FileText, Download, Printer, Calendar, Pill,
  Receipt, Activity, FlaskConical, Heart, Bed, Building,
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle, Search,
  ChevronRight, Stethoscope, ClipboardList, Scissors, Award,
  UserCheck, MapPin, ShieldCheck, BookOpen, BarChart, LineChart as LineChartIcon,
  PieChart as PieChartIcon, RefreshCw,
} from "lucide-react";
import {
  BarChart as ReBarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area,
} from "recharts";
import { exportToCSV, exportToPrintableHTML } from "@/utils/exportUtils";
import { useHospital } from "@/contexts/HospitalContext";

const COLORS = ["hsl(217,71%,45%)", "hsl(142,60%,40%)", "hsl(38,92%,50%)", "hsl(0,72%,51%)", "hsl(262,60%,50%)", "hsl(190,70%,50%)", "hsl(330,60%,50%)", "hsl(60,70%,45%)"];

interface ReportCategory {
  label: string;
  icon: any;
  items: { key: string; label: string }[];
}

const REPORT_CATEGORIES: ReportCategory[] = [
  {
    label: "MEDICAL",
    icon: Stethoscope,
    items: [
      { key: "patient-report", label: "Patient Report" },
      { key: "diagnoses", label: "Diagnoses" },
      { key: "diagnoses-treatments", label: "Diagnoses & Treatments" },
      { key: "prescriptions-report", label: "Prescriptions" },
      { key: "surgeries", label: "Surgeries" },
      { key: "recommendations", label: "Recommendations" },
      { key: "medical-certificates", label: "Medical Certificates" },
      { key: "medical-attendances", label: "Medical Attendances" },
      { key: "referrals", label: "Referrals" },
      { key: "clinical-outcomes", label: "Clinical Outcomes" },
    ],
  },
  {
    label: "STATISTICS",
    icon: BarChart3,
    items: [
      { key: "diagnoses-stats", label: "Diagnoses Statistics" },
      { key: "treatments-stats", label: "Treatments Statistics" },
      { key: "prescriptions-stats", label: "Prescriptions Statistics" },
      { key: "visits-stats", label: "Visits Statistics" },
      { key: "checkins-stats", label: "Checkins Statistics" },
      { key: "patients-age", label: "Patient's Age" },
      { key: "patients-gender", label: "Patient's Gender" },
      { key: "patients-cities", label: "Patient's Cities" },
      { key: "department-workload", label: "Department Workload" },
      { key: "monthly-trends", label: "Monthly Trends" },
    ],
  },
  {
    label: "SCHEDULING",
    icon: Calendar,
    items: [
      { key: "appointments", label: "Appointments" },
      { key: "resources-usage", label: "Resources Usage" },
      { key: "admissions-report", label: "Admissions" },
      { key: "admission-days", label: "Admission Days" },
      { key: "admissions-copayer", label: "Admissions by Copayer" },
      { key: "bed-occupancy", label: "Bed Occupancy" },
      { key: "discharge-summary", label: "Discharge Summary" },
      { key: "ot-schedule", label: "OT Schedule" },
    ],
  },
  {
    label: "FINANCIAL",
    icon: DollarSign,
    items: [
      { key: "balance-sheet", label: "Balance Sheet" },
      { key: "patient-balance", label: "Patient Balance Sheet" },
      { key: "patient-financial", label: "Patient Financial Summary" },
      { key: "providers-revenue", label: "Providers Revenue" },
      { key: "providers-billed", label: "Providers Billed Revenue" },
      { key: "income-referrer", label: "Income by Referrer" },
      { key: "income-copayer", label: "Income by Copayer" },
      { key: "items-copayer", label: "Items by Copayer" },
      { key: "costs-profits", label: "Costs & Profits" },
      { key: "revenue-trends", label: "Revenue Trends" },
      { key: "payment-methods", label: "Payment Methods" },
      { key: "daily-collections", label: "Daily Collections" },
    ],
  },
  {
    label: "BILLING",
    icon: Receipt,
    items: [
      { key: "billing-patients", label: "Patients" },
      { key: "invoices", label: "Invoices" },
      { key: "aged-receivables", label: "Aged Receivables" },
      { key: "unpaid-invoices", label: "Unpaid Invoices" },
      { key: "receipts", label: "Receipts" },
      { key: "sold-items", label: "Sold Items" },
      { key: "sold-by-category", label: "Sold Items by Category" },
      { key: "billable-items", label: "Billable Items" },
      { key: "credit-notes", label: "Credit Notes" },
      { key: "insurance-claims", label: "Insurance Claims" },
    ],
  },
  {
    label: "PURCHASES",
    icon: Package,
    items: [
      { key: "suppliers-report", label: "Suppliers" },
      { key: "purchase-invoices", label: "Invoices" },
      { key: "unpaid-purchase-invoices", label: "Unpaid Invoices" },
      { key: "purchases", label: "Purchases" },
      { key: "purchases-details", label: "Purchases Details" },
      { key: "grn-report", label: "Goods Received Notes" },
      { key: "purchase-orders-report", label: "Purchase Orders" },
      { key: "purchase-returns", label: "Purchase Returns" },
    ],
  },
  {
    label: "COMPANY",
    icon: Building,
    items: [
      { key: "company-patients", label: "Patients" },
      { key: "contacts", label: "Contacts" },
      { key: "prices", label: "Prices" },
      { key: "item-stocks", label: "Item Stocks" },
      { key: "expire-items", label: "Expire Items" },
      { key: "removals-report", label: "Removals Report" },
      { key: "low-stocks", label: "Low Stocks" },
      { key: "items-location-prices", label: "Items Location Prices" },
      { key: "transfers", label: "Transfers" },
      { key: "transfer-requests", label: "Transfer Requests" },
    ],
  },
  {
    label: "LABORATORY",
    icon: FlaskConical,
    items: [
      { key: "lab-tests-report", label: "Lab Tests" },
      { key: "lab-by-category", label: "Tests by Category" },
      { key: "lab-turnaround", label: "Turnaround Time" },
      { key: "abnormal-results", label: "Abnormal Results" },
      { key: "lab-revenue", label: "Lab Revenue" },
      { key: "pending-tests", label: "Pending Tests" },
    ],
  },
  {
    label: "PHARMACY",
    icon: Pill,
    items: [
      { key: "pharmacy-sales", label: "Sales Report" },
      { key: "top-medicines", label: "Top Selling Medicines" },
      { key: "dispensing-log", label: "Dispensing Log" },
      { key: "controlled-drugs-report", label: "Controlled Drugs" },
      { key: "pharmacy-returns", label: "Returns" },
      { key: "stock-valuation", label: "Stock Valuation" },
    ],
  },
  {
    label: "STAFF & HR",
    icon: Users,
    items: [
      { key: "staff-directory", label: "Staff Directory" },
      { key: "attendance-report", label: "Attendance Report" },
      { key: "payroll-summary", label: "Payroll Summary" },
      { key: "staff-performance", label: "Staff Performance" },
      { key: "leave-report", label: "Leave Report" },
      { key: "overtime-report", label: "Overtime Report" },
    ],
  },
];

export default function Reports() {
  const { hospitalId, loading: hospitalLoading } = useHospital();
  const [activeReport, setActiveReport] = useState("appointments");
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [completedOnly, setCompletedOnly] = useState(false);
  const [confirmedOnly, setConfirmedOnly] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [providerFilter, setProviderFilter] = useState("all");
  const [patientSearch, setPatientSearch] = useState("");

  // Data states
  const [sales, setSales] = useState<any[]>([]);
  const [saleItems, setSaleItems] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [billItems, setBillItems] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [labTests, setLabTests] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    if (hospitalLoading) return;

    if (!hospitalId) {
      setSales([]);
      setSaleItems([]);
      setBills([]);
      setBillItems([]);
      setPatients([]);
      setLabTests([]);
      setMedicines([]);
      setAdmissions([]);
      setStaff([]);
      setConsultations([]);
      setPrescriptions([]);
      setAppointments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const [sRes, siRes, bRes, biRes, pRes, lRes, mRes, aRes, stRes, cRes, prRes, apRes] = await Promise.all([
      supabase.from("pharmacy_sales").select("*").eq("hospital_id", hospitalId).gte("created_at", dateFrom).lte("created_at", dateTo + "T23:59:59"),
      supabase.from("pharmacy_sale_items").select("*").eq("hospital_id", hospitalId),
      supabase.from("bills").select("*, patients(first_name,last_name,patient_no,phone,insurance_provider)").eq("hospital_id", hospitalId).gte("created_at", dateFrom).lte("created_at", dateTo + "T23:59:59"),
      supabase.from("bill_items").select("*").eq("hospital_id", hospitalId),
      supabase.from("patients").select("*").eq("hospital_id", hospitalId).order("created_at", { ascending: false }),
      supabase.from("lab_tests").select("*, patients(first_name,last_name,patient_no)").eq("hospital_id", hospitalId).gte("requested_at", dateFrom).lte("requested_at", dateTo + "T23:59:59"),
      supabase.from("medicines").select("*").eq("hospital_id", hospitalId).order("name"),
      supabase.from("admissions").select("*, patients(first_name,last_name,patient_no), staff(first_name,last_name)").eq("hospital_id", hospitalId).gte("admitted_at", dateFrom),
      supabase.from("staff").select("*, departments(name)").eq("hospital_id", hospitalId),
      supabase.from("consultations").select("*, patients(first_name,last_name,patient_no), staff(first_name,last_name)").eq("hospital_id", hospitalId).gte("created_at", dateFrom).lte("created_at", dateTo + "T23:59:59"),
      supabase.from("prescriptions").select("*, patients(first_name,last_name,patient_no), staff:doctor_id(first_name,last_name)").eq("hospital_id", hospitalId).gte("created_at", dateFrom),
      supabase.from("appointments").select("*, patients(first_name,last_name,patient_no,phone), staff(first_name,last_name)").eq("hospital_id", hospitalId).gte("appointment_date", dateFrom).lte("appointment_date", dateTo),
    ]);
    const firstError = sRes.error || siRes.error || bRes.error || biRes.error || pRes.error || lRes.error || mRes.error || aRes.error || stRes.error || cRes.error || prRes.error || apRes.error;
    if (firstError) {
      toast({ title: "Failed to load reports", description: firstError.message, variant: "destructive" });
    }
    setSales((sRes.data || []) as any[]);
    setSaleItems((siRes.data || []) as any[]);
    setBills((bRes.data || []) as any[]);
    setBillItems((biRes.data || []) as any[]);
    setPatients((pRes.data || []) as any[]);
    setLabTests((lRes.data || []) as any[]);
    setMedicines((mRes.data || []) as any[]);
    setAdmissions((aRes.data || []) as any[]);
    setStaff((stRes.data || []) as any[]);
    setConsultations((cRes.data || []) as any[]);
    setPrescriptions((prRes.data || []) as any[]);
    setAppointments((apRes.data || []) as any[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [dateFrom, dateTo, hospitalId, hospitalLoading]);

  const doctors = staff.filter(s => s.role === "doctor");
  const pharmacyRevenue = sales.filter(s => s.status === "completed").reduce((a, s) => a + (s.total || 0), 0);
  const billingRevenue = bills.filter(b => b.status === "paid").reduce((a, b) => a + (b.total || 0), 0);
  const totalRevenue = pharmacyRevenue + billingRevenue;
  const lowStock = medicines.filter(m => (m.stock || 0) <= (m.reorder_level || 10));
  const expiringSoon = medicines.filter(m => m.expiry_date && new Date(m.expiry_date) <= new Date(Date.now() + 90 * 86400000));

  const handleExport = (data: any[], name: string) => {
    if (!data.length) { toast({ title: "No data to export", variant: "destructive" }); return; }
    exportToCSV(data, `brightech-${name}-${dateFrom}-${dateTo}`);
    toast({ title: "Exported successfully" });
  };

  const handlePrint = () => {
    // Build printable HTML from current report data
    const label = REPORT_CATEGORIES.flatMap(c => c.items).find(i => i.key === activeReport)?.label || "Report";
    const tableData = getReportTableData();
    if (!tableData || tableData.rows.length === 0) {
      toast({ title: "No data to print", variant: "destructive" });
      return;
    }
    const tableHTML = `
      <h1>${label}</h1>
      <p style="font-size:12px;color:#6b7280;">Period: ${dateFrom} to ${dateTo} | Generated: ${new Date().toLocaleString()}</p>
      <table>
        <thead><tr>${tableData.headers.map((h: string) => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>${tableData.rows.map((row: string[]) => `<tr>${row.map((c: string) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>
      ${tableData.summary ? `<div class="summary">${tableData.summary}</div>` : ""}
    `;
    exportToPrintableHTML(label, tableHTML);
  };

  /** Extract current report data as headers + rows for printing */
  const getReportTableData = (): { headers: string[]; rows: string[][]; summary?: string } | null => {
    switch (activeReport) {
      case "appointments":
        return {
          headers: ["Date", "Time", "Patient", "Doctor", "Status"],
          rows: filteredAppointments.map(a => [
            a.appointment_date, a.appointment_time,
            `${a.patients?.first_name || ""} ${a.patients?.last_name || ""}`,
            `Dr. ${a.staff?.first_name || ""} ${a.staff?.last_name || ""}`,
            a.status || "—",
          ]),
          summary: `<p>Total appointments: ${filteredAppointments.length}</p>`,
        };
      case "pharmacy-sales":
        return {
          headers: ["Receipt #", "Date", "Customer", "Payment", "Total"],
          rows: sales.filter(s => s.status === "completed").map(s => [
            s.receipt_no, new Date(s.created_at).toLocaleDateString(),
            s.customer_name || "Walk-in",
            s.payment_method || "cash",
            `KES ${(s.total || 0).toLocaleString()}`,
          ]),
          summary: `<p>Total Revenue: KES ${pharmacyRevenue.toLocaleString()}</p>`,
        };
      case "revenue-trends":
      case "daily-collections":
        return {
          headers: ["Day", "Pharmacy", "Billing", "Total"],
          rows: revenueByDay.map(r => [r.day, `KES ${r.pharmacy.toLocaleString()}`, `KES ${r.billing.toLocaleString()}`, `KES ${r.total.toLocaleString()}`]),
          summary: `<p>Total Revenue: KES ${totalRevenue.toLocaleString()}</p>`,
        };
      case "top-medicines":
        return {
          headers: ["Medicine", "Qty Sold", "Revenue"],
          rows: topMedicines.map(m => [m.name, String(m.qty), `KES ${m.revenue.toLocaleString()}`]),
        };
      case "lab-tests-report":
      case "pending-tests":
        return {
          headers: ["Test #", "Patient", "Test", "Category", "Status", "Date"],
          rows: labTests.map(t => [
            t.test_no, `${t.patients?.first_name || ""} ${t.patients?.last_name || ""}`,
            t.test_name, t.test_category || "—", t.status || "—",
            new Date(t.requested_at).toLocaleDateString(),
          ]),
        };
      case "staff-directory":
        return {
          headers: ["Staff #", "Name", "Role", "Department", "Status"],
          rows: staff.map(s => [
            s.staff_no, `${s.first_name} ${s.last_name}`,
            s.role?.replace(/_/g, " ") || "—",
            s.departments?.name || "—",
            s.is_active ? "Active" : "Inactive",
          ]),
        };
      case "patient-report":
        return {
          headers: ["Patient #", "Name", "Gender", "Phone", "Insurance"],
          rows: patients.slice(0, 200).map(p => [
            p.patient_no, `${p.first_name} ${p.last_name}`,
            p.gender || "—", p.phone || "—", p.insurance_provider || "—",
          ]),
          summary: `<p>Total patients: ${patients.length}</p>`,
        };
      case "low-stocks":
        return {
          headers: ["Medicine", "Stock", "Reorder Level", "Category"],
          rows: lowStock.map(m => [m.name, String(m.stock || 0), String(m.reorder_level || 10), m.category || "—"]),
        };
      case "expire-items":
        return {
          headers: ["Medicine", "Batch", "Expiry", "Stock"],
          rows: expiringSoon.map(m => [m.name, m.batch_no || "—", m.expiry_date || "—", String(m.stock || 0)]),
        };
      case "diagnoses":
      case "diagnoses-treatments":
      case "clinical-outcomes":
        return {
          headers: ["Consultation #", "Patient", "Doctor", "Diagnosis", "Treatment Plan", "Status", "Date"],
          rows: consultations.map(c => [
            c.consultation_no, `${c.patients?.first_name || ""} ${c.patients?.last_name || ""}`,
            `Dr. ${c.staff?.first_name || ""} ${c.staff?.last_name || ""}`,
            c.diagnosis || "—", c.treatment_plan || "—", c.status || "—",
            new Date(c.created_at).toLocaleDateString(),
          ]),
          summary: `<p>Total consultations: ${consultations.length}</p>`,
        };
      case "prescriptions-report":
      case "dispensing-log":
        return {
          headers: ["Rx #", "Patient", "Doctor", "Status", "Date"],
          rows: prescriptions.map(p => [
            p.prescription_no, `${p.patients?.first_name || ""} ${p.patients?.last_name || ""}`,
            `Dr. ${p.staff?.first_name || ""} ${p.staff?.last_name || ""}`,
            p.status || "—", new Date(p.created_at).toLocaleDateString(),
          ]),
        };
      case "admissions-report":
      case "admission-days":
      case "discharge-summary":
        return {
          headers: ["Admission #", "Patient", "Doctor", "Type", "Status", "Admitted", "Discharged"],
          rows: admissions.map(a => [
            a.admission_no, `${a.patients?.first_name || ""} ${a.patients?.last_name || ""}`,
            `Dr. ${a.staff?.first_name || ""} ${a.staff?.last_name || ""}`,
            a.admission_type || "—", a.status || "—",
            a.admitted_at ? new Date(a.admitted_at).toLocaleDateString() : "—",
            a.discharged_at ? new Date(a.discharged_at).toLocaleDateString() : "—",
          ]),
          summary: `<p>Total admissions: ${admissions.length}</p>`,
        };
      case "invoices":
      case "receipts":
      case "unpaid-invoices":
      case "billing-patients":
      case "aged-receivables":
        return {
          headers: ["Bill #", "Patient", "Status", "Subtotal", "Tax", "Discount", "Total", "Paid", "Method", "Date"],
          rows: bills.filter(b => activeReport === "unpaid-invoices" ? b.status !== "paid" : true).map(b => [
            b.bill_no, `${b.patients?.first_name || ""} ${b.patients?.last_name || ""}`,
            b.status || "—", `KES ${(b.subtotal || 0).toLocaleString()}`,
            `KES ${(b.tax || 0).toLocaleString()}`, `KES ${(b.discount || 0).toLocaleString()}`,
            `KES ${(b.total || 0).toLocaleString()}`, `KES ${(b.amount_paid || 0).toLocaleString()}`,
            b.payment_method || "—", new Date(b.created_at).toLocaleDateString(),
          ]),
          summary: `<p>Total bills: ${bills.length} | Revenue: KES ${billingRevenue.toLocaleString()}</p>`,
        };
      case "sold-items":
      case "sold-by-category":
      case "billable-items":
        return {
          headers: ["Medicine", "Qty Sold", "Revenue"],
          rows: topMedicines.map(m => [m.name, String(m.qty), `KES ${m.revenue.toLocaleString()}`]),
        };
      case "balance-sheet":
      case "patient-balance":
      case "patient-financial":
      case "costs-profits":
        return {
          headers: ["Category", "Amount (KES)"],
          rows: [
            ["Pharmacy Revenue", `KES ${pharmacyRevenue.toLocaleString()}`],
            ["Billing Revenue", `KES ${billingRevenue.toLocaleString()}`],
            ["Total Revenue", `KES ${totalRevenue.toLocaleString()}`],
          ],
        };
      case "providers-revenue":
      case "providers-billed":
        return {
          headers: ["Doctor", "Consultations", "Revenue"],
          rows: doctors.map(d => {
            const docCons = consultations.filter(c => c.doctor_id === d.id);
            const docRev = docCons.reduce((s: number, c: any) => s + (c.consultation_fee || 0), 0);
            return [`Dr. ${d.first_name} ${d.last_name}`, String(docCons.length), `KES ${docRev.toLocaleString()}`];
          }),
        };
      case "payment-methods":
        return {
          headers: ["Method", "Amount (KES)", "Percentage"],
          rows: paymentMethods.map(p => [p.name, `KES ${p.value.toLocaleString()}`, `${totalRevenue > 0 ? Math.round((p.value / totalRevenue) * 100) : 0}%`]),
          summary: `<p>Total: KES ${totalRevenue.toLocaleString()}</p>`,
        };
      case "lab-by-category":
        return {
          headers: ["Category", "Count"],
          rows: labStats.map(l => [l.name, String(l.value)]),
          summary: `<p>Total tests: ${labTests.length}</p>`,
        };
      case "abnormal-results":
        return {
          headers: ["Test #", "Patient", "Test", "Result", "Normal Range", "Date"],
          rows: labTests.filter(t => t.is_abnormal).map(t => [
            t.test_no, `${t.patients?.first_name || ""} ${t.patients?.last_name || ""}`,
            t.test_name, t.results || "—", t.normal_range || "—",
            new Date(t.requested_at).toLocaleDateString(),
          ]),
        };
      case "lab-revenue":
        return {
          headers: ["Test #", "Test Name", "Fee (KES)", "Status"],
          rows: labTests.map(t => [t.test_no, t.test_name, `KES ${(t.fee || 0).toLocaleString()}`, t.status || "—"]),
          summary: `<p>Total Lab Revenue: KES ${labTests.reduce((s: number, t: any) => s + (t.fee || 0), 0).toLocaleString()}</p>`,
        };
      case "stock-valuation":
        return {
          headers: ["Medicine", "Stock", "Cost Price", "Sell Price", "Stock Value"],
          rows: medicines.map(m => [m.name, String(m.stock || 0), `KES ${(m.cost_price || 0).toLocaleString()}`, `KES ${(m.price || 0).toLocaleString()}`, `KES ${((m.stock || 0) * (m.cost_price || 0)).toLocaleString()}`]),
          summary: `<p>Total Stock Value: KES ${medicines.reduce((s: number, m: any) => s + (m.stock || 0) * (m.cost_price || 0), 0).toLocaleString()}</p>`,
        };
      case "attendance-report":
        return {
          headers: ["Staff #", "Name", "Role", "Department"],
          rows: staff.map(s => [s.staff_no, `${s.first_name} ${s.last_name}`, s.role?.replace(/_/g, " ") || "—", s.departments?.name || "—"]),
        };
      case "payroll-summary":
        return {
          headers: ["Staff #", "Name", "Role", "Department"],
          rows: staff.map(s => [s.staff_no, `${s.first_name} ${s.last_name}`, s.role?.replace(/_/g, " ") || "—", s.departments?.name || "—"]),
        };
      case "diagnoses-stats":
      case "treatments-stats":
        return {
          headers: ["Diagnosis/Treatment", "Count"],
          rows: (() => {
            const map = new Map<string, number>();
            consultations.forEach(c => { const d = c.diagnosis || "Unknown"; map.set(d, (map.get(d) || 0) + 1); });
            return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).map(([name, count]) => [name, String(count)]);
          })(),
        };
      case "prescriptions-stats":
        return {
          headers: ["Status", "Count"],
          rows: (() => {
            const map = new Map<string, number>();
            prescriptions.forEach(p => { const s = p.status || "pending"; map.set(s, (map.get(s) || 0) + 1); });
            return Array.from(map.entries()).map(([name, count]) => [name, String(count)]);
          })(),
        };
      case "visits-stats":
      case "checkins-stats":
      case "monthly-trends":
        return {
          headers: ["Day", "Pharmacy", "Billing", "Total"],
          rows: revenueByDay.map(r => [r.day, `KES ${r.pharmacy.toLocaleString()}`, `KES ${r.billing.toLocaleString()}`, `KES ${r.total.toLocaleString()}`]),
        };
      case "patients-age":
        return {
          headers: ["Age Group", "Count"],
          rows: ageStats.map(a => [a.name, String(a.value)]),
          summary: `<p>Total patients: ${patients.length}</p>`,
        };
      case "patients-gender":
        return {
          headers: ["Gender", "Count"],
          rows: genderStats.map(g => [g.name, String(g.value)]),
          summary: `<p>Total patients: ${patients.length}</p>`,
        };
      case "bed-occupancy":
        return {
          headers: ["Admission #", "Patient", "Status", "Admitted"],
          rows: admissions.filter(a => a.status === "admitted").map(a => [
            a.admission_no, `${a.patients?.first_name || ""} ${a.patients?.last_name || ""}`,
            a.status || "—", a.admitted_at ? new Date(a.admitted_at).toLocaleDateString() : "—",
          ]),
        };
      case "insurance-claims":
        return {
          headers: ["Bill #", "Patient", "Insurance", "Total", "Status"],
          rows: bills.filter(b => b.patients?.insurance_provider).map(b => [
            b.bill_no, `${b.patients?.first_name || ""} ${b.patients?.last_name || ""}`,
            b.patients?.insurance_provider || "—", `KES ${(b.total || 0).toLocaleString()}`, b.status || "—",
          ]),
        };
      default:
        // Fallback: show consultations data as a generic report
        return {
          headers: ["Consultation #", "Patient", "Doctor", "Diagnosis", "Status", "Date"],
          rows: consultations.length > 0 ? consultations.map(c => [
            c.consultation_no, `${c.patients?.first_name || ""} ${c.patients?.last_name || ""}`,
            `Dr. ${c.staff?.first_name || ""} ${c.staff?.last_name || ""}`,
            c.diagnosis || "—", c.status || "—", new Date(c.created_at).toLocaleDateString(),
          ]) : [["No data available for this period. Adjust date range or use CSV export."]],
        };
    }
  };

  // Get active report label
  const activeLabel = REPORT_CATEGORIES.flatMap(c => c.items).find(i => i.key === activeReport)?.label || "Report";

  // Filter helpers
  const filteredAppointments = useMemo(() => {
    let data = appointments;
    if (providerFilter !== "all") data = data.filter(a => a.doctor_id === providerFilter);
    if (patientSearch) data = data.filter(a => `${a.patients?.first_name} ${a.patients?.last_name}`.toLowerCase().includes(patientSearch.toLowerCase()));
    if (completedOnly) data = data.filter(a => a.status === "completed");
    if (confirmedOnly) data = data.filter(a => a.status === "confirmed");
    return data;
  }, [appointments, providerFilter, patientSearch, completedOnly, confirmedOnly]);

  // Revenue by day
  const revenueByDay = useMemo(() => {
    const map = new Map<string, { pharmacy: number; billing: number }>();
    sales.filter(s => s.status === "completed").forEach(s => {
      const d = new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const e = map.get(d) || { pharmacy: 0, billing: 0 };
      map.set(d, { ...e, pharmacy: e.pharmacy + (s.total || 0) });
    });
    bills.filter(b => b.status === "paid").forEach(b => {
      const d = new Date(b.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const e = map.get(d) || { pharmacy: 0, billing: 0 };
      map.set(d, { ...e, billing: e.billing + (b.total || 0) });
    });
    return Array.from(map.entries()).map(([day, v]) => ({ day, ...v, total: v.pharmacy + v.billing })).slice(-14);
  }, [sales, bills]);

  const paymentMethods = useMemo(() => {
    const map = new Map<string, number>();
    [...sales.filter(s => s.status === "completed"), ...bills.filter(b => b.status === "paid")].forEach(r => {
      const m = r.payment_method || "cash";
      map.set(m, (map.get(m) || 0) + (r.total || 0));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [sales, bills]);

  const topMedicines = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    saleItems.forEach(i => {
      const e = map.get(i.medicine_name) || { name: i.medicine_name, qty: 0, revenue: 0 };
      map.set(i.medicine_name, { name: i.medicine_name, qty: e.qty + i.quantity, revenue: e.revenue + i.total });
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [saleItems]);

  const labStats = useMemo(() => {
    const byCategory = new Map<string, number>();
    labTests.forEach(t => byCategory.set(t.test_category || "Other", (byCategory.get(t.test_category || "Other") || 0) + 1));
    return Array.from(byCategory.entries()).map(([name, value]) => ({ name, value }));
  }, [labTests]);

  const genderStats = useMemo(() => {
    const map = new Map<string, number>();
    patients.forEach(p => map.set(p.gender || "Unknown", (map.get(p.gender || "Unknown") || 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [patients]);

  const ageStats = useMemo(() => {
    const buckets: Record<string, number> = { "0-10": 0, "11-20": 0, "21-30": 0, "31-40": 0, "41-50": 0, "51-60": 0, "61-70": 0, "71+": 0 };
    patients.forEach(p => {
      if (!p.date_of_birth) return;
      const age = Math.floor((Date.now() - new Date(p.date_of_birth).getTime()) / (365.25 * 86400000));
      if (age <= 10) buckets["0-10"]++;
      else if (age <= 20) buckets["11-20"]++;
      else if (age <= 30) buckets["21-30"]++;
      else if (age <= 40) buckets["31-40"]++;
      else if (age <= 50) buckets["41-50"]++;
      else if (age <= 60) buckets["51-60"]++;
      else if (age <= 70) buckets["61-70"]++;
      else buckets["71+"]++;
    });
    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  }, [patients]);

  const renderReportContent = () => {
    if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading report data...</div>;

    switch (activeReport) {
      // ===== APPOINTMENTS =====
      case "appointments":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Providers</label>
                <Select value={providerFilter} onValueChange={setProviderFilter}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Providers</SelectItem>
                    {doctors.map(d => <SelectItem key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Patient</label>
                <Input placeholder="Type the patient" value={patientSearch} onChange={e => setPatientSearch(e.target.value)} className="h-9" />
              </div>
              <div className="flex items-end">
                <Button size="sm" onClick={fetchAll} className="gap-1"><RefreshCw className="h-3 w-3" /> Refresh</Button>
              </div>
            </div>
            <div className="flex items-center gap-6 text-xs">
              <label className="flex items-center gap-1.5"><Checkbox checked={showStats} onCheckedChange={(v) => setShowStats(!!v)} /> Statistic</label>
              <label className="flex items-center gap-1.5"><Checkbox checked={completedOnly} onCheckedChange={(v) => setCompletedOnly(!!v)} /> Completed only</label>
              <label className="flex items-center gap-1.5"><Checkbox checked={confirmedOnly} onCheckedChange={(v) => setConfirmedOnly(!!v)} /> Confirmed only</label>
            </div>
            {showStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Total", value: filteredAppointments.length },
                  { label: "Completed", value: filteredAppointments.filter(a => a.status === "completed").length },
                  { label: "Scheduled", value: filteredAppointments.filter(a => a.status === "scheduled").length },
                  { label: "No Show", value: filteredAppointments.filter(a => a.status === "no_show").length },
                ].map(s => (
                  <div key={s.label} className="p-3 rounded-lg border bg-card text-center">
                    <p className="text-lg font-bold">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-muted/60 border-b">
                  <th className="text-left p-2.5 font-semibold">Date</th>
                  <th className="text-left p-2.5 font-semibold">Time</th>
                  <th className="text-left p-2.5 font-semibold">Patient</th>
                  <th className="text-left p-2.5 font-semibold">Mobile</th>
                  <th className="text-left p-2.5 font-semibold">Reason</th>
                  <th className="text-left p-2.5 font-semibold">Notes</th>
                  <th className="text-left p-2.5 font-semibold">Status</th>
                  <th className="text-left p-2.5 font-semibold">Invoice</th>
                </tr></thead>
                <tbody>
                  {filteredAppointments.length === 0 ? (
                    <tr><td colSpan={8} className="p-12 text-center text-muted-foreground">No appointments found for the selected criteria</td></tr>
                  ) : filteredAppointments.map(a => (
                    <tr key={a.id} className="border-b hover:bg-muted/30">
                      <td className="p-2.5">{a.appointment_date}</td>
                      <td className="p-2.5">{a.appointment_time}</td>
                      <td className="p-2.5 font-medium">{a.patients?.first_name} {a.patients?.last_name}</td>
                      <td className="p-2.5">{a.patients?.phone || "—"}</td>
                      <td className="p-2.5">{a.reason || "—"}</td>
                      <td className="p-2.5 max-w-[150px] truncate">{a.notes || "—"}</td>
                      <td className="p-2.5"><Badge variant={a.status === "completed" ? "default" : "secondary"} className="text-[10px]">{a.status}</Badge></td>
                      <td className="p-2.5">—</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      // ===== PATIENT REPORT =====
      case "patient-report":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Patients", value: patients.length, color: "text-blue-600" },
                { label: "Active", value: patients.filter(p => p.is_active !== false).length, color: "text-emerald-600" },
                { label: "With Insurance", value: patients.filter(p => p.insurance_provider).length, color: "text-purple-600" },
                { label: "New This Month", value: patients.filter(p => new Date(p.created_at) >= new Date(dateFrom)).length, color: "text-amber-600" },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-lg border bg-card"><p className={`text-lg font-bold ${s.color}`}>{s.value}</p><p className="text-[10px] text-muted-foreground">{s.label}</p></div>
              ))}
            </div>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-muted/60 border-b">
                  <th className="text-left p-2.5 font-semibold">Patient No</th>
                  <th className="text-left p-2.5 font-semibold">Name</th>
                  <th className="text-left p-2.5 font-semibold">Gender</th>
                  <th className="text-left p-2.5 font-semibold">DOB</th>
                  <th className="text-left p-2.5 font-semibold">Phone</th>
                  <th className="text-left p-2.5 font-semibold">Insurance</th>
                  <th className="text-left p-2.5 font-semibold">Blood Type</th>
                  <th className="text-left p-2.5 font-semibold">Registered</th>
                </tr></thead>
                <tbody>
                  {patients.slice(0, 100).map(p => (
                    <tr key={p.id} className="border-b hover:bg-muted/30">
                      <td className="p-2.5 font-medium">{p.patient_no}</td>
                      <td className="p-2.5">{p.first_name} {p.last_name}</td>
                      <td className="p-2.5 capitalize">{p.gender || "—"}</td>
                      <td className="p-2.5">{p.date_of_birth || "—"}</td>
                      <td className="p-2.5">{p.phone || "—"}</td>
                      <td className="p-2.5">{p.insurance_provider || "—"}</td>
                      <td className="p-2.5">{p.blood_type || "—"}</td>
                      <td className="p-2.5">{p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      // ===== DIAGNOSES =====
      case "diagnoses":
      case "diagnoses-treatments":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Consultations", value: consultations.length },
                { label: "With Diagnosis", value: consultations.filter(c => c.diagnosis).length },
                { label: "With Treatment Plan", value: consultations.filter(c => c.treatment_plan).length },
                { label: "Completed", value: consultations.filter(c => c.status === "completed").length },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-lg border bg-card"><p className="text-lg font-bold">{s.value}</p><p className="text-[10px] text-muted-foreground">{s.label}</p></div>
              ))}
            </div>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-muted/60 border-b">
                  <th className="text-left p-2.5 font-semibold">Consultation #</th>
                  <th className="text-left p-2.5 font-semibold">Patient</th>
                  <th className="text-left p-2.5 font-semibold">Doctor</th>
                  <th className="text-left p-2.5 font-semibold">Diagnosis</th>
                  <th className="text-left p-2.5 font-semibold">ICD Code</th>
                  {activeReport === "diagnoses-treatments" && <th className="text-left p-2.5 font-semibold">Treatment Plan</th>}
                  <th className="text-left p-2.5 font-semibold">Status</th>
                  <th className="text-left p-2.5 font-semibold">Date</th>
                </tr></thead>
                <tbody>
                  {consultations.filter(c => c.diagnosis).length === 0 ? (
                    <tr><td colSpan={8} className="p-12 text-center text-muted-foreground">No diagnoses found</td></tr>
                  ) : consultations.filter(c => c.diagnosis).slice(0, 100).map(c => (
                    <tr key={c.id} className="border-b hover:bg-muted/30">
                      <td className="p-2.5 font-medium">{c.consultation_no}</td>
                      <td className="p-2.5">{c.patients?.first_name} {c.patients?.last_name}</td>
                      <td className="p-2.5">Dr. {c.staff?.first_name} {c.staff?.last_name}</td>
                      <td className="p-2.5 max-w-[200px] truncate">{c.diagnosis || "—"}</td>
                      <td className="p-2.5">{c.diagnosis_code || "—"}</td>
                      {activeReport === "diagnoses-treatments" && <td className="p-2.5 max-w-[200px] truncate">{c.treatment_plan || "—"}</td>}
                      <td className="p-2.5"><Badge variant={c.status === "completed" ? "default" : "secondary"} className="text-[10px]">{c.status}</Badge></td>
                      <td className="p-2.5">{new Date(c.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      // ===== PRESCRIPTIONS REPORT =====
      case "prescriptions-report":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Prescriptions", value: prescriptions.length },
                { label: "Dispensed", value: prescriptions.filter(p => p.status === "dispensed").length },
                { label: "Pending", value: prescriptions.filter(p => p.status === "pending").length },
                { label: "Active Doctors", value: new Set(prescriptions.map(p => p.doctor_id)).size },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-lg border bg-card"><p className="text-lg font-bold">{s.value}</p><p className="text-[10px] text-muted-foreground">{s.label}</p></div>
              ))}
            </div>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-muted/60 border-b">
                  <th className="text-left p-2.5 font-semibold">Rx #</th>
                  <th className="text-left p-2.5 font-semibold">Patient</th>
                  <th className="text-left p-2.5 font-semibold">Doctor</th>
                  <th className="text-left p-2.5 font-semibold">Status</th>
                  <th className="text-left p-2.5 font-semibold">Notes</th>
                  <th className="text-left p-2.5 font-semibold">Date</th>
                </tr></thead>
                <tbody>
                  {prescriptions.length === 0 ? (
                    <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">No prescriptions found</td></tr>
                  ) : prescriptions.slice(0, 100).map(p => (
                    <tr key={p.id} className="border-b hover:bg-muted/30">
                      <td className="p-2.5 font-medium">{p.prescription_no}</td>
                      <td className="p-2.5">{p.patients?.first_name} {p.patients?.last_name}</td>
                      <td className="p-2.5">Dr. {p.staff?.first_name} {p.staff?.last_name}</td>
                      <td className="p-2.5"><Badge variant={p.status === "dispensed" ? "default" : "secondary"} className="text-[10px]">{p.status}</Badge></td>
                      <td className="p-2.5 max-w-[200px] truncate">{p.notes || "—"}</td>
                      <td className="p-2.5">{new Date(p.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      // ===== STATISTICS: Age, Gender, Cities =====
      case "patients-age":
        return (
          <div className="space-y-4">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Patient Age Distribution</CardTitle></CardHeader>
              <CardContent><ResponsiveContainer width="100%" height={350}>
                <ReBarChart data={ageStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,88%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(217,71%,45%)" radius={[4,4,0,0]} barSize={32} name="Patients" />
                </ReBarChart>
              </ResponsiveContainer></CardContent>
            </Card>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-muted/60 border-b">
                  <th className="text-left p-2.5 font-semibold">Age Group</th>
                  <th className="text-right p-2.5 font-semibold">Count</th>
                  <th className="text-right p-2.5 font-semibold">Percentage</th>
                </tr></thead>
                <tbody>
                  {ageStats.map(a => (
                    <tr key={a.name} className="border-b hover:bg-muted/30">
                      <td className="p-2.5 font-medium">{a.name} years</td>
                      <td className="p-2.5 text-right">{a.value}</td>
                      <td className="p-2.5 text-right">{patients.length ? ((a.value / patients.length) * 100).toFixed(1) : 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "patients-gender":
        return (
          <div className="space-y-4">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Patient Gender Distribution</CardTitle></CardHeader>
              <CardContent><ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie data={genderStats.length > 0 ? genderStats : [{ name: "No data", value: 1 }]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} innerRadius={60} paddingAngle={3} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {genderStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer></CardContent>
            </Card>
          </div>
        );

      // ===== FINANCIAL REPORTS =====
      case "balance-sheet":
      case "revenue-trends":
      case "daily-collections":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Revenue", value: `KES ${totalRevenue.toLocaleString()}`, color: "text-emerald-600" },
                { label: "Pharmacy Revenue", value: `KES ${pharmacyRevenue.toLocaleString()}`, color: "text-amber-600" },
                { label: "Hospital Billing", value: `KES ${billingRevenue.toLocaleString()}`, color: "text-blue-600" },
                { label: "Pending Amount", value: `KES ${bills.filter(b => b.status === "pending").reduce((a, b) => a + (b.total || 0), 0).toLocaleString()}`, color: "text-destructive" },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-lg border bg-card"><p className={`text-lg font-bold ${s.color}`}>{s.value}</p><p className="text-[10px] text-muted-foreground">{s.label}</p></div>
              ))}
            </div>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Revenue Trend</CardTitle></CardHeader>
              <CardContent><ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueByDay}>
                  <defs>
                    <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(38,92%,50%)" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(38,92%,50%)" stopOpacity={0}/></linearGradient>
                    <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(217,71%,45%)" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(217,71%,45%)" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,88%)" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => `KES ${v.toLocaleString()}`} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="pharmacy" stroke="hsl(38,92%,50%)" fill="url(#gP)" strokeWidth={2} name="Pharmacy" />
                  <Area type="monotone" dataKey="billing" stroke="hsl(217,71%,45%)" fill="url(#gB)" strokeWidth={2} name="Hospital" />
                </AreaChart>
              </ResponsiveContainer></CardContent>
            </Card>
          </div>
        );

      case "payment-methods":
        return (
          <div className="space-y-4">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Payment Methods Breakdown</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie data={paymentMethods.length > 0 ? paymentMethods : [{ name: "No data", value: 1 }]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} innerRadius={50} paddingAngle={4} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                        {paymentMethods.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => `KES ${v.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-muted/60 border-b">
                        <th className="text-left p-2.5 font-semibold">Method</th>
                        <th className="text-right p-2.5 font-semibold">Amount</th>
                        <th className="text-right p-2.5 font-semibold">%</th>
                      </tr></thead>
                      <tbody>
                        {paymentMethods.map((m, i) => (
                          <tr key={m.name} className="border-b hover:bg-muted/30">
                            <td className="p-2.5 flex items-center gap-2"><span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: COLORS[i % COLORS.length] }} />{m.name}</td>
                            <td className="p-2.5 text-right font-medium">KES {m.value.toLocaleString()}</td>
                            <td className="p-2.5 text-right">{totalRevenue ? ((m.value / totalRevenue) * 100).toFixed(1) : 0}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      // ===== BILLING REPORTS =====
      case "invoices":
      case "unpaid-invoices":
      case "aged-receivables":
      case "billing-patients":
        const billFilter = activeReport === "unpaid-invoices" ? bills.filter(b => b.status !== "paid") : activeReport === "aged-receivables" ? bills.filter(b => b.status === "pending" && new Date(b.created_at) < new Date(Date.now() - 30 * 86400000)) : bills;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Bills", value: billFilter.length },
                { label: "Total Amount", value: `KES ${billFilter.reduce((a, b) => a + (b.total || 0), 0).toLocaleString()}` },
                { label: "Paid", value: billFilter.filter(b => b.status === "paid").length },
                { label: "Unpaid Amount", value: `KES ${billFilter.filter(b => b.status !== "paid").reduce((a, b) => a + ((b.total || 0) - (b.amount_paid || 0)), 0).toLocaleString()}` },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-lg border bg-card"><p className="text-lg font-bold">{typeof s.value === "number" ? s.value : s.value}</p><p className="text-[10px] text-muted-foreground">{s.label}</p></div>
              ))}
            </div>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-muted/60 border-b">
                  <th className="text-left p-2.5 font-semibold">Bill #</th>
                  <th className="text-left p-2.5 font-semibold">Patient</th>
                  <th className="text-right p-2.5 font-semibold">Total</th>
                  <th className="text-right p-2.5 font-semibold">Paid</th>
                  <th className="text-right p-2.5 font-semibold">Balance</th>
                  <th className="text-left p-2.5 font-semibold">Payment</th>
                  <th className="text-left p-2.5 font-semibold">Status</th>
                  <th className="text-left p-2.5 font-semibold">Date</th>
                </tr></thead>
                <tbody>
                  {billFilter.length === 0 ? (
                    <tr><td colSpan={8} className="p-12 text-center text-muted-foreground">No records found</td></tr>
                  ) : billFilter.slice(0, 100).map(b => (
                    <tr key={b.id} className="border-b hover:bg-muted/30">
                      <td className="p-2.5 font-medium">{b.bill_no}</td>
                      <td className="p-2.5">{b.patients?.first_name} {b.patients?.last_name}</td>
                      <td className="p-2.5 text-right font-medium">KES {(b.total || 0).toLocaleString()}</td>
                      <td className="p-2.5 text-right">KES {(b.amount_paid || 0).toLocaleString()}</td>
                      <td className="p-2.5 text-right text-destructive font-medium">KES {((b.total || 0) - (b.amount_paid || 0)).toLocaleString()}</td>
                      <td className="p-2.5">{b.payment_method || "—"}</td>
                      <td className="p-2.5"><Badge variant={b.status === "paid" ? "default" : "destructive"} className="text-[10px]">{b.status}</Badge></td>
                      <td className="p-2.5">{new Date(b.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      // ===== SOLD ITEMS =====
      case "sold-items":
      case "sold-by-category":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: "Items Sold", value: saleItems.reduce((a, i) => a + i.quantity, 0) },
                { label: "Total Revenue", value: `KES ${saleItems.reduce((a, i) => a + i.total, 0).toLocaleString()}` },
                { label: "Unique Products", value: new Set(saleItems.map(i => i.medicine_name)).size },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-lg border bg-card"><p className="text-lg font-bold">{s.value}</p><p className="text-[10px] text-muted-foreground">{s.label}</p></div>
              ))}
            </div>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-muted/60 border-b">
                  <th className="text-left p-2.5 font-semibold">Item</th>
                  <th className="text-right p-2.5 font-semibold">Qty Sold</th>
                  <th className="text-right p-2.5 font-semibold">Unit Price</th>
                  <th className="text-right p-2.5 font-semibold">Total</th>
                  <th className="text-right p-2.5 font-semibold">Discount</th>
                </tr></thead>
                <tbody>
                  {topMedicines.length === 0 ? (
                    <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">No sold items</td></tr>
                  ) : topMedicines.map(m => (
                    <tr key={m.name} className="border-b hover:bg-muted/30">
                      <td className="p-2.5 font-medium">{m.name}</td>
                      <td className="p-2.5 text-right">{m.qty}</td>
                      <td className="p-2.5 text-right">KES {m.qty ? Math.round(m.revenue / m.qty).toLocaleString() : 0}</td>
                      <td className="p-2.5 text-right font-medium">KES {m.revenue.toLocaleString()}</td>
                      <td className="p-2.5 text-right">—</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      // ===== LAB REPORTS =====
      case "lab-tests-report":
      case "pending-tests":
      case "abnormal-results":
        const labFilter = activeReport === "pending-tests" ? labTests.filter(t => t.status !== "completed") : activeReport === "abnormal-results" ? labTests.filter(t => t.is_abnormal) : labTests;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Tests", value: labFilter.length },
                { label: "Completed", value: labFilter.filter(t => t.status === "completed").length },
                { label: "Abnormal", value: labFilter.filter(t => t.is_abnormal).length },
                { label: "Revenue", value: `KES ${labFilter.reduce((a, t) => a + (t.fee || 0), 0).toLocaleString()}` },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-lg border bg-card"><p className="text-lg font-bold">{s.value}</p><p className="text-[10px] text-muted-foreground">{s.label}</p></div>
              ))}
            </div>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-muted/60 border-b">
                  <th className="text-left p-2.5 font-semibold">Test #</th>
                  <th className="text-left p-2.5 font-semibold">Test Name</th>
                  <th className="text-left p-2.5 font-semibold">Patient</th>
                  <th className="text-left p-2.5 font-semibold">Category</th>
                  <th className="text-left p-2.5 font-semibold">Status</th>
                  <th className="text-left p-2.5 font-semibold">Abnormal</th>
                  <th className="text-right p-2.5 font-semibold">Fee</th>
                  <th className="text-left p-2.5 font-semibold">Date</th>
                </tr></thead>
                <tbody>
                  {labFilter.length === 0 ? (
                    <tr><td colSpan={8} className="p-12 text-center text-muted-foreground">No tests found</td></tr>
                  ) : labFilter.slice(0, 100).map(t => (
                    <tr key={t.id} className="border-b hover:bg-muted/30">
                      <td className="p-2.5 font-medium">{t.test_no}</td>
                      <td className="p-2.5">{t.test_name}</td>
                      <td className="p-2.5">{t.patients?.first_name} {t.patients?.last_name}</td>
                      <td className="p-2.5">{t.test_category || "—"}</td>
                      <td className="p-2.5"><Badge variant={t.status === "completed" ? "default" : "secondary"} className="text-[10px]">{t.status}</Badge></td>
                      <td className="p-2.5">{t.is_abnormal ? <Badge variant="destructive" className="text-[10px]">Yes</Badge> : "No"}</td>
                      <td className="p-2.5 text-right">KES {(t.fee || 0).toLocaleString()}</td>
                      <td className="p-2.5">{new Date(t.requested_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "lab-by-category":
        return (
          <div className="space-y-4">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Lab Tests by Category</CardTitle></CardHeader>
              <CardContent><ResponsiveContainer width="100%" height={350}>
                <ReBarChart data={labStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,88%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(262,60%,50%)" radius={[4,4,0,0]} barSize={24} name="Tests" />
                </ReBarChart>
              </ResponsiveContainer></CardContent>
            </Card>
          </div>
        );

      // ===== PHARMACY REPORTS =====
      case "pharmacy-sales":
      case "dispensing-log":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Sales", value: sales.filter(s => s.status === "completed").length },
                { label: "Revenue", value: `KES ${pharmacyRevenue.toLocaleString()}` },
                { label: "Avg Sale", value: `KES ${sales.filter(s => s.status === "completed").length ? Math.round(pharmacyRevenue / sales.filter(s => s.status === "completed").length).toLocaleString() : 0}` },
                { label: "Items Sold", value: saleItems.reduce((a, i) => a + i.quantity, 0) },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-lg border bg-card"><p className="text-lg font-bold">{s.value}</p><p className="text-[10px] text-muted-foreground">{s.label}</p></div>
              ))}
            </div>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-muted/60 border-b">
                  <th className="text-left p-2.5 font-semibold">Receipt #</th>
                  <th className="text-left p-2.5 font-semibold">Customer</th>
                  <th className="text-right p-2.5 font-semibold">Total</th>
                  <th className="text-left p-2.5 font-semibold">Payment</th>
                  <th className="text-left p-2.5 font-semibold">Status</th>
                  <th className="text-left p-2.5 font-semibold">Date</th>
                </tr></thead>
                <tbody>
                  {sales.filter(s => s.status === "completed").length === 0 ? (
                    <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">No sales</td></tr>
                  ) : sales.filter(s => s.status === "completed").slice(0, 100).map(s => (
                    <tr key={s.id} className="border-b hover:bg-muted/30">
                      <td className="p-2.5 font-medium">{s.receipt_no}</td>
                      <td className="p-2.5">{s.customer_name || "Walk-in"}</td>
                      <td className="p-2.5 text-right font-medium">KES {(s.total || 0).toLocaleString()}</td>
                      <td className="p-2.5"><Badge variant="outline" className="text-[10px]">{s.payment_method || "cash"}</Badge></td>
                      <td className="p-2.5"><Badge variant="default" className="text-[10px]">{s.status}</Badge></td>
                      <td className="p-2.5">{new Date(s.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "top-medicines":
        return (
          <div className="space-y-4">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Top Selling Medicines</CardTitle></CardHeader>
              <CardContent><ResponsiveContainer width="100%" height={350}>
                <ReBarChart data={topMedicines} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,88%)" />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 9 }} />
                  <Tooltip formatter={(v: number) => `KES ${v.toLocaleString()}`} />
                  <Bar dataKey="revenue" fill="hsl(217,71%,45%)" radius={[0,4,4,0]} barSize={16} />
                </ReBarChart>
              </ResponsiveContainer></CardContent>
            </Card>
          </div>
        );

      case "stock-valuation":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Items", value: medicines.length },
                { label: "Total Stock Value", value: `KES ${medicines.reduce((a, m) => a + ((m.price || 0) * (m.stock || 0)), 0).toLocaleString()}` },
                { label: "Cost Value", value: `KES ${medicines.reduce((a, m) => a + ((m.cost_price || 0) * (m.stock || 0)), 0).toLocaleString()}` },
                { label: "Potential Profit", value: `KES ${medicines.reduce((a, m) => a + (((m.price || 0) - (m.cost_price || 0)) * (m.stock || 0)), 0).toLocaleString()}` },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-lg border bg-card"><p className="text-lg font-bold">{s.value}</p><p className="text-[10px] text-muted-foreground">{s.label}</p></div>
              ))}
            </div>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-muted/60 border-b">
                  <th className="text-left p-2.5 font-semibold">Medicine</th>
                  <th className="text-left p-2.5 font-semibold">Category</th>
                  <th className="text-right p-2.5 font-semibold">Stock</th>
                  <th className="text-right p-2.5 font-semibold">Cost Price</th>
                  <th className="text-right p-2.5 font-semibold">Sell Price</th>
                  <th className="text-right p-2.5 font-semibold">Stock Value</th>
                </tr></thead>
                <tbody>
                  {medicines.slice(0, 100).map(m => (
                    <tr key={m.id} className="border-b hover:bg-muted/30">
                      <td className="p-2.5 font-medium">{m.name}</td>
                      <td className="p-2.5">{m.category || "—"}</td>
                      <td className="p-2.5 text-right">{m.stock || 0}</td>
                      <td className="p-2.5 text-right">KES {(m.cost_price || 0).toLocaleString()}</td>
                      <td className="p-2.5 text-right">KES {(m.price || 0).toLocaleString()}</td>
                      <td className="p-2.5 text-right font-medium">KES {((m.price || 0) * (m.stock || 0)).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      // ===== COMPANY: Stocks, Expiry, Low Stock =====
      case "item-stocks":
        return (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="bg-muted/60 border-b">
                <th className="text-left p-2.5 font-semibold">Item</th>
                <th className="text-left p-2.5 font-semibold">Category</th>
                <th className="text-left p-2.5 font-semibold">Batch</th>
                <th className="text-right p-2.5 font-semibold">Stock</th>
                <th className="text-right p-2.5 font-semibold">Reorder</th>
                <th className="text-left p-2.5 font-semibold">Location</th>
                <th className="text-left p-2.5 font-semibold">Status</th>
              </tr></thead>
              <tbody>
                {medicines.slice(0, 100).map(m => (
                  <tr key={m.id} className="border-b hover:bg-muted/30">
                    <td className="p-2.5 font-medium">{m.name}</td>
                    <td className="p-2.5">{m.category || "—"}</td>
                    <td className="p-2.5">{m.batch_no || "—"}</td>
                    <td className="p-2.5 text-right">{m.stock || 0}</td>
                    <td className="p-2.5 text-right">{m.reorder_level || 10}</td>
                    <td className="p-2.5">{m.shelf_location || "—"}</td>
                    <td className="p-2.5"><Badge variant={(m.stock || 0) <= (m.reorder_level || 10) ? "destructive" : "default"} className="text-[10px]">{(m.stock || 0) <= (m.reorder_level || 10) ? "Low" : "OK"}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "expire-items":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: "Expiring ≤30 days", value: medicines.filter(m => m.expiry_date && new Date(m.expiry_date) <= new Date(Date.now() + 30 * 86400000)).length, color: "text-destructive" },
                { label: "Expiring ≤90 days", value: expiringSoon.length, color: "text-amber-600" },
                { label: "Expired", value: medicines.filter(m => m.expiry_date && new Date(m.expiry_date) < new Date()).length, color: "text-destructive" },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-lg border bg-card"><p className={`text-lg font-bold ${s.color}`}>{s.value}</p><p className="text-[10px] text-muted-foreground">{s.label}</p></div>
              ))}
            </div>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-muted/60 border-b">
                  <th className="text-left p-2.5 font-semibold">Medicine</th>
                  <th className="text-left p-2.5 font-semibold">Batch</th>
                  <th className="text-left p-2.5 font-semibold">Expiry Date</th>
                  <th className="text-right p-2.5 font-semibold">Stock</th>
                  <th className="text-right p-2.5 font-semibold">Value at Risk</th>
                  <th className="text-left p-2.5 font-semibold">Days Left</th>
                </tr></thead>
                <tbody>
                  {expiringSoon.sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()).map(m => {
                    const daysLeft = Math.ceil((new Date(m.expiry_date).getTime() - Date.now()) / 86400000);
                    return (
                      <tr key={m.id} className="border-b hover:bg-muted/30">
                        <td className="p-2.5 font-medium">{m.name}</td>
                        <td className="p-2.5">{m.batch_no || "—"}</td>
                        <td className="p-2.5">{m.expiry_date}</td>
                        <td className="p-2.5 text-right">{m.stock || 0}</td>
                        <td className="p-2.5 text-right font-medium">KES {((m.price || 0) * (m.stock || 0)).toLocaleString()}</td>
                        <td className="p-2.5"><Badge variant={daysLeft <= 0 ? "destructive" : daysLeft <= 30 ? "destructive" : "secondary"} className="text-[10px]">{daysLeft <= 0 ? "EXPIRED" : `${daysLeft}d`}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "low-stocks":
        return (
          <div className="space-y-4">
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-muted/60 border-b">
                  <th className="text-left p-2.5 font-semibold">Medicine</th>
                  <th className="text-left p-2.5 font-semibold">Category</th>
                  <th className="text-right p-2.5 font-semibold">Current Stock</th>
                  <th className="text-right p-2.5 font-semibold">Reorder Level</th>
                  <th className="text-right p-2.5 font-semibold">Deficit</th>
                  <th className="text-left p-2.5 font-semibold">Supplier</th>
                </tr></thead>
                <tbody>
                  {lowStock.length === 0 ? (
                    <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">All stock levels healthy</td></tr>
                  ) : lowStock.map(m => (
                    <tr key={m.id} className="border-b hover:bg-muted/30">
                      <td className="p-2.5 font-medium">{m.name}</td>
                      <td className="p-2.5">{m.category || "—"}</td>
                      <td className="p-2.5 text-right"><Badge variant="destructive" className="text-[10px]">{m.stock || 0}</Badge></td>
                      <td className="p-2.5 text-right">{m.reorder_level || 10}</td>
                      <td className="p-2.5 text-right text-destructive font-medium">{(m.reorder_level || 10) - (m.stock || 0)}</td>
                      <td className="p-2.5">{m.supplier || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      // ===== ADMISSIONS =====
      case "admissions-report":
      case "admission-days":
      case "discharge-summary":
        const admFilter = activeReport === "discharge-summary" ? admissions.filter(a => a.status === "discharged") : admissions;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Admissions", value: admFilter.length },
                { label: "Currently Admitted", value: admFilter.filter(a => a.status === "admitted").length },
                { label: "Discharged", value: admFilter.filter(a => a.status === "discharged").length },
                { label: "Avg Stay (days)", value: admFilter.filter(a => a.discharged_at).length ? Math.round(admFilter.filter(a => a.discharged_at).reduce((acc, a) => acc + (new Date(a.discharged_at).getTime() - new Date(a.admitted_at).getTime()) / 86400000, 0) / admFilter.filter(a => a.discharged_at).length) : 0 },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-lg border bg-card"><p className="text-lg font-bold">{s.value}</p><p className="text-[10px] text-muted-foreground">{s.label}</p></div>
              ))}
            </div>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-muted/60 border-b">
                  <th className="text-left p-2.5 font-semibold">Admission #</th>
                  <th className="text-left p-2.5 font-semibold">Patient</th>
                  <th className="text-left p-2.5 font-semibold">Doctor</th>
                  <th className="text-left p-2.5 font-semibold">Type</th>
                  <th className="text-left p-2.5 font-semibold">Admitted</th>
                  <th className="text-left p-2.5 font-semibold">Discharged</th>
                  <th className="text-left p-2.5 font-semibold">Days</th>
                  <th className="text-left p-2.5 font-semibold">Status</th>
                </tr></thead>
                <tbody>
                  {admFilter.length === 0 ? (
                    <tr><td colSpan={8} className="p-12 text-center text-muted-foreground">No admissions found</td></tr>
                  ) : admFilter.slice(0, 100).map(a => {
                    const days = a.discharged_at ? Math.ceil((new Date(a.discharged_at).getTime() - new Date(a.admitted_at).getTime()) / 86400000) : Math.ceil((Date.now() - new Date(a.admitted_at).getTime()) / 86400000);
                    return (
                      <tr key={a.id} className="border-b hover:bg-muted/30">
                        <td className="p-2.5 font-medium">{a.admission_no}</td>
                        <td className="p-2.5">{a.patients?.first_name} {a.patients?.last_name}</td>
                        <td className="p-2.5">Dr. {a.staff?.first_name} {a.staff?.last_name}</td>
                        <td className="p-2.5">{a.admission_type || "—"}</td>
                        <td className="p-2.5">{new Date(a.admitted_at).toLocaleDateString()}</td>
                        <td className="p-2.5">{a.discharged_at ? new Date(a.discharged_at).toLocaleDateString() : "—"}</td>
                        <td className="p-2.5">{days}</td>
                        <td className="p-2.5"><Badge variant={a.status === "admitted" ? "default" : "secondary"} className="text-[10px]">{a.status}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );

      // ===== STAFF =====
      case "staff-directory":
      case "attendance-report":
      case "payroll-summary":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Staff", value: staff.length },
                { label: "Doctors", value: staff.filter(s => s.role === "doctor").length },
                { label: "Nurses", value: staff.filter(s => s.role === "nurse").length },
                { label: "Active", value: staff.filter(s => s.is_active).length },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-lg border bg-card"><p className="text-lg font-bold">{s.value}</p><p className="text-[10px] text-muted-foreground">{s.label}</p></div>
              ))}
            </div>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-muted/60 border-b">
                  <th className="text-left p-2.5 font-semibold">Staff #</th>
                  <th className="text-left p-2.5 font-semibold">Name</th>
                  <th className="text-left p-2.5 font-semibold">Role</th>
                  <th className="text-left p-2.5 font-semibold">Department</th>
                  <th className="text-left p-2.5 font-semibold">Specialization</th>
                  <th className="text-left p-2.5 font-semibold">Phone</th>
                  <th className="text-left p-2.5 font-semibold">Email</th>
                  <th className="text-left p-2.5 font-semibold">Status</th>
                </tr></thead>
                <tbody>
                  {staff.map(s => (
                    <tr key={s.id} className="border-b hover:bg-muted/30">
                      <td className="p-2.5 font-medium">{s.staff_no}</td>
                      <td className="p-2.5">{s.first_name} {s.last_name}</td>
                      <td className="p-2.5 capitalize">{s.role.replace("_", " ")}</td>
                      <td className="p-2.5">{s.departments?.name || "—"}</td>
                      <td className="p-2.5">{s.specialization || "—"}</td>
                      <td className="p-2.5">{s.phone || "—"}</td>
                      <td className="p-2.5">{s.email || "—"}</td>
                      <td className="p-2.5"><Badge variant={s.is_active ? "default" : "secondary"} className="text-[10px]">{s.is_active ? "Active" : "Inactive"}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      // ===== DEFAULT / PLACEHOLDER for remaining reports =====
      default:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Revenue", value: `KES ${totalRevenue.toLocaleString()}` },
                { label: "Patients", value: patients.length },
                { label: "Bills", value: bills.length },
                { label: "Staff", value: staff.length },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-lg border bg-card"><p className="text-lg font-bold">{s.value}</p><p className="text-[10px] text-muted-foreground">{s.label}</p></div>
              ))}
            </div>
            <div className="flex items-center justify-center h-48 text-muted-foreground border rounded-lg bg-muted/20">
              <div className="text-center">
                <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">{activeLabel} Report</p>
                <p className="text-xs">Data will be displayed here based on available records</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <AppLayout title="Reports & Analytics Center">
      <div className="flex gap-0 h-[calc(100vh-100px)] -m-4">
        {/* LEFT SIDEBAR */}
        <div className="w-52 min-w-[208px] border-r bg-muted/20 flex-shrink-0">
          <ScrollArea className="h-full">
            <div className="py-2">
              {REPORT_CATEGORIES.map(cat => (
                <div key={cat.label} className="mb-1">
                  <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
                    <cat.icon className="h-3 w-3" />
                    {cat.label}
                  </div>
                  {cat.items.map(item => (
                    <button
                      key={item.key}
                      onClick={() => setActiveReport(item.key)}
                      className={`w-full text-left px-4 py-1.5 text-xs transition-colors hover:bg-muted/60 ${activeReport === item.key ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary" : "text-foreground/70"}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">{activeLabel}</h2>
                <p className="text-xs text-muted-foreground">Medic {activeLabel.toLowerCase()}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="gap-1 text-xs h-8" onClick={handlePrint}><Printer className="h-3 w-3" /> Print</Button>
                <Button size="sm" variant="outline" className="gap-1 text-xs h-8" onClick={() => {
                  const reportData = activeReport.includes("appointment") ? filteredAppointments : activeReport.includes("bill") || activeReport.includes("invoice") ? bills : activeReport.includes("lab") ? labTests : activeReport.includes("pharm") || activeReport.includes("sale") ? sales : activeReport.includes("staff") ? staff : patients;
                  handleExport(reportData, activeReport);
                }}><Download className="h-3 w-3" /> Export</Button>
              </div>
            </div>

            {/* Date filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="text-[10px] font-medium text-muted-foreground">This Month</label>
                <div className="flex items-center gap-1.5">
                  <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 text-xs w-[140px]" />
                  <span className="text-xs text-muted-foreground">–</span>
                  <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 text-xs w-[140px]" />
                </div>
              </div>
            </div>

            {/* Report content */}
            {renderReportContent()}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
