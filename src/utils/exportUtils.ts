/**
 * Export data as CSV file download
 */
export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h];
        const str = val instanceof Date ? val.toISOString() : String(val ?? "");
        return str.includes(",") || str.includes('"') || str.includes("\n")
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(",")
    ),
  ];
  
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Export data as formatted text receipt / report for printing
 */
export function exportToPrintableHTML(title: string, content: string) {
  const win = window.open("", "_blank", "width=800,height=600");
  if (!win) return;
  win.document.write(`
    <html><head><title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #333; }
      h1 { font-size: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 8px; color: #1e40af; }
      h2 { font-size: 14px; margin-top: 20px; color: #374151; }
      table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
      th { background: #f3f4f6; padding: 8px 12px; text-align: left; border: 1px solid #e5e7eb; font-weight: 600; }
      td { padding: 6px 12px; border: 1px solid #e5e7eb; }
      tr:nth-child(even) { background: #f9fafb; }
      .header { text-align: center; margin-bottom: 20px; }
      .header h1 { border: none; margin: 0; font-size: 24px; }
      .header p { color: #6b7280; margin: 2px 0; font-size: 12px; }
      .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; }
      .summary { background: #eff6ff; padding: 12px; border-radius: 6px; margin: 12px 0; }
      .summary p { margin: 4px 0; font-size: 13px; }
      @media print { body { padding: 20px; } }
    </style></head><body>
    <div class="header">
      <h1>BRIGHTECH PHARMACY</h1>
      <p>Nairobi, Kenya | Tel: +254 700 000 000</p>
      <p>License: PPB/2024/12345</p>
    </div>
    ${content}
    <div class="footer">
      <p>Generated on ${new Date().toLocaleString()} by Brightcare POS</p>
      <p>Powered by Brightcare by Brightech</p>
    </div>
    <script>window.print();<\/script>
    </body></html>
  `);
  win.document.close();
}

/**
 * Parse CSV string into array of objects
 */
export function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];
  
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h.trim()] = (values[i] || "").trim(); });
    return obj;
  });
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
