import JSZip from "jszip";
import { supabase } from "@/integrations/supabase/client";

/** Tables scoped to a single hospital (filtered by hospital_id). */
const HOSPITAL_TABLES = [
  "activity_log", "admissions", "announcements", "appointments", "beds",
  "bill_items", "billing_settings", "bills", "business_hours", "consultations",
  "credit_sales", "departments", "dropdown_options", "financial_settlements",
  "hospital_addons", "inactive_days", "internal_messages", "invoice_items",
  "invoices", "lab_consumables", "lab_service_bundles", "lab_service_consumables",
  "lab_test_consumables", "lab_tests", "medicines", "module_settings",
  "notifications", "nursing_notes", "patients", "payment_method_permissions",
  "pharmacy_sale_items", "pharmacy_sales", "prescription_items", "prescriptions",
  "role_permissions", "staff", "staff_checkins", "staff_salaries",
  "vitals_records", "wards",
] as const;

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Array.from(
    rows.reduce((set, r) => {
      Object.keys(r).forEach((k) => set.add(k));
      return set;
    }, new Set<string>())
  );
  const escape = (val: unknown) => {
    if (val === null || val === undefined) return "";
    const str = typeof val === "object" ? JSON.stringify(val) : String(val);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
}

export interface BackupProgress {
  table: string;
  index: number;
  total: number;
  rows: number;
}

/**
 * Fetches all hospital-scoped tables and packages them into a downloadable ZIP.
 */
export async function downloadHospitalBackup(
  hospitalId: string,
  hospitalName: string,
  onProgress?: (p: BackupProgress) => void
): Promise<{ tables: number; totalRows: number }> {
  const zip = new JSZip();
  const folder = zip.folder("brightcare-backup")!;
  const summary: { table: string; rows: number }[] = [];
  let totalRows = 0;

  for (let i = 0; i < HOSPITAL_TABLES.length; i++) {
    const table = HOSPITAL_TABLES[i];
    let rows: Record<string, unknown>[] = [];
    try {
      let query = supabase.from(table as any).select("*");
      if (hospitalId) query = query.eq("hospital_id", hospitalId);
      const { data, error } = await query;
      if (error) {
        // Some tables may not have hospital_id — retry without the filter.
        const retry = await supabase.from(table as any).select("*");
        rows = (retry.data as any) || [];
      } else {
        rows = (data as any) || [];
      }
    } catch {
      rows = [];
    }
    folder.file(`${table}.csv`, toCSV(rows));
    summary.push({ table, rows: rows.length });
    totalRows += rows.length;
    onProgress?.({ table, index: i + 1, total: HOSPITAL_TABLES.length, rows: rows.length });
  }

  folder.file(
    "_summary.csv",
    toCSV(summary.map((s) => ({ table: s.table, row_count: s.rows })))
  );
  folder.file(
    "RESTORE_INSTRUCTIONS.md",
    `# Brightcare Data Backup\n\n` +
      `- **Hospital:** ${hospitalName || "N/A"}\n` +
      `- **Hospital ID:** ${hospitalId || "N/A"}\n` +
      `- **Generated:** ${new Date().toISOString()}\n` +
      `- **Tables exported:** ${summary.length}\n` +
      `- **Total rows:** ${totalRows}\n\n` +
      `Each CSV file corresponds to one database table. Import them back using the ` +
      `Lovable Cloud data tools, keeping the same column headers.\n`
  );

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `brightcare-backup-${stamp}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return { tables: summary.length, totalRows };
}
