import { useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { type Sale } from "@/data/medicines";
import { Printer, Download, Check, Mail } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useHospital } from "@/contexts/HospitalContext";

interface Props {
  sale: Sale;
  onClose: () => void;
  autoPrint?: boolean;
}

type ReceiptSettings = {
  pharmacyName?: string;
  address?: string;
  phone?: string;
  licenseNo?: string;
  headerText?: string;
  footerText?: string;
  thankYouMessage?: string;
  showLicense?: boolean;
  showCashier?: boolean;
  showCustomer?: boolean;
  showTaxBreakdown?: boolean;
  showPaymentMethod?: boolean;
  showChangeAmount?: boolean;
  showDateTime?: boolean;
  receiptWidth?: "narrow" | "standard" | "wide";
  fontSize?: "small" | "medium" | "large";
  currency?: string;
  taxRate?: number;
  poweredBy?: string;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

export function ReceiptModal({ sale, onClose, autoPrint }: Props) {
  const { hospital } = useHospital();
  const receiptRef = useRef<HTMLDivElement>(null);
  const hasPrinted = useRef(false);

  const receiptConfig = (((hospital?.settings as Record<string, any> | null | undefined) ?? {}).receipt_config ??
    {}) as ReceiptSettings;
  const currency = receiptConfig.currency || hospital?.currency || "KES";
  const taxRate =
    typeof sale.taxRate === "number" && sale.taxRate > 0
      ? sale.taxRate
      : typeof hospital?.tax_rate === "number"
        ? Number(hospital.tax_rate)
        : typeof receiptConfig.taxRate === "number" && receiptConfig.taxRate > 0
          ? receiptConfig.taxRate
          : 16;
  const pharmacyName = receiptConfig.pharmacyName || hospital?.name || "BRIGHTCARE PHARMACY";
  const address = receiptConfig.address || hospital?.address || "Hospital Rd, Nairobi, Kenya";
  const phone = receiptConfig.phone || hospital?.phone || "+254 700 000 000";
  const licenseNo = receiptConfig.licenseNo || "PPB/2024/12345";
  const headerText = receiptConfig.headerText || "";
  const footerText = receiptConfig.footerText || "Thank you for your purchase!";
  const thankYouMessage = receiptConfig.thankYouMessage || "Get well soon 💊";
  const poweredBy = receiptConfig.poweredBy || "Brightcare Hospital Management System";
  const showLicense = receiptConfig.showLicense ?? true;
  const showCashier = receiptConfig.showCashier ?? true;
  const showCustomer = receiptConfig.showCustomer ?? true;
  const showTaxBreakdown = receiptConfig.showTaxBreakdown ?? true;
  const showPaymentMethod = receiptConfig.showPaymentMethod ?? true;
  const showChangeAmount = receiptConfig.showChangeAmount ?? true;
  const showDateTime = receiptConfig.showDateTime ?? true;
  const widthClass =
    receiptConfig.receiptWidth === "narrow"
      ? "max-w-[280px]"
      : receiptConfig.receiptWidth === "wide"
        ? "max-w-[360px]"
        : "max-w-[320px]";
  const fontClass =
    receiptConfig.fontSize === "small"
      ? "text-[11px]"
      : receiptConfig.fontSize === "large"
        ? "text-[13px]"
        : "text-[12px]";
  const saleDate = sale.timestamp.toLocaleDateString("en-GB");
  const saleTime = sale.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const handlePrint = useCallback(() => {
    const printWidth =
      receiptConfig.receiptWidth === "narrow" ? 300 : receiptConfig.receiptWidth === "wide" ? 380 : 340;
    const printFontSize = receiptConfig.fontSize === "small" ? 11 : receiptConfig.fontSize === "large" ? 13 : 12;
    const itemRows = sale.items
      .map((item) => {
        const itemMeta = [
          item.batchNo ? `Batch: ${item.batchNo}` : "",
          item.requiresPrescription ? "Rx Required" : "",
          item.discount > 0 ? `Disc: -${currency} ${item.discount}/unit` : "",
        ]
          .filter(Boolean)
          .join(" • ");

        return `
        <tr>
          <td>
            <div class="item-name">${escapeHtml(item.name)}</div>
            ${itemMeta ? `<div class="item-meta">${escapeHtml(itemMeta)}</div>` : ""}
          </td>
          <td class="qty">${item.qty}</td>
          <td class="money">${item.price.toLocaleString()}</td>
          <td class="money strong">${item.lineTotal.toLocaleString()}</td>
        </tr>
      `;
      })
      .join("");

    const win = window.open("", "_blank", `width=${printWidth + 100},height=880`);
    if (!win) return;
    win.document.write(`
      <html><head><title>Receipt ${escapeHtml(sale.receiptNo)}</title>
      <style>
        @page { margin: 8mm; size: auto; }
        body { font-family: 'Courier New', monospace; padding: 12px; max-width: ${printWidth}px; margin: 0 auto; font-size: ${printFontSize}px; line-height: 1.45; color: #111; background: #fff; font-weight: 600; }
        .kicker { text-align: center; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.28em; margin: 0 0 4px; }
        .brand { text-align: center; font-size: 18px; line-height: 1.1; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; margin: 4px 0; }
        .meta { text-align: center; font-size: 10px; font-weight: 700; color: #4b5563; margin: 2px 0; }
        .divider { border-top: 2px solid #111; border-bottom: 1px dashed #777; height: 3px; margin: 10px 0; }
        .meta-table, .items { width: 100%; border-collapse: collapse; }
        .meta-table td { padding: 3px 0; vertical-align: top; }
        .label { width: 38%; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.16em; color: #6b7280; }
        .value { text-align: right; font-size: 11px; font-weight: 800; }
        .items th { padding: 5px 0; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.14em; border-bottom: 1px solid #111; }
        .items td { padding: 6px 0; vertical-align: top; border-bottom: 1px dashed #d4d4d8; }
        .item-name { font-size: 11px; font-weight: 800; }
        .item-meta { margin-top: 2px; font-size: 9px; font-weight: 700; color: #6b7280; }
        .qty { text-align: center; font-weight: 800; }
        .money { text-align: right; font-weight: 700; white-space: nowrap; }
        .strong { font-weight: 900; }
        .summary-row { display: flex; justify-content: space-between; gap: 12px; margin: 4px 0; }
        .summary-label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.16em; color: #6b7280; }
        .summary-value { font-weight: 800; }
        .grand-total { display: flex; justify-content: space-between; gap: 12px; border-top: 3px double #111; border-bottom: 3px double #111; padding: 7px 0; margin: 10px 0; font-size: 15px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; }
        .note-box { border: 1px solid #111; padding: 6px; margin: 8px 0; font-size: 9px; font-weight: 700; text-align: center; }
        .footer-main { text-align: center; font-size: 10px; font-weight: 800; color: #374151; margin: 4px 0; }
        .footer-highlight { text-align: center; font-size: 11px; font-weight: 900; margin: 4px 0; }
        .footer-small { text-align: center; font-size: 9px; font-weight: 700; color: #6b7280; margin: 2px 0; }
      </style></head><body>
        ${headerText ? `<p class="kicker">${escapeHtml(headerText)}</p>` : ""}
        <h1 class="brand">${escapeHtml(pharmacyName)}</h1>
        <p class="meta">${escapeHtml(address)}</p>
        <p class="meta">Tel: ${escapeHtml(phone)}</p>
        ${showLicense ? `<p class="meta">License: ${escapeHtml(licenseNo)}</p>` : ""}

        <div class="divider"></div>

        <table class="meta-table">
          <tbody>
            <tr><td class="label">Receipt No</td><td class="value">${escapeHtml(sale.receiptNo)}</td></tr>
            ${showDateTime ? `<tr><td class="label">Date</td><td class="value">${escapeHtml(saleDate)}</td></tr><tr><td class="label">Time</td><td class="value">${escapeHtml(saleTime)}</td></tr>` : ""}
            ${showCashier ? `<tr><td class="label">Cashier</td><td class="value">${escapeHtml(sale.cashier)}</td></tr>` : ""}
            ${sale.customer && showCustomer ? `<tr><td class="label">Customer</td><td class="value">${escapeHtml(sale.customer)}</td></tr>` : ""}
          </tbody>
        </table>

        <div class="divider"></div>

        <table class="items">
          <thead>
            <tr>
              <th style="text-align:left">Item</th>
              <th style="text-align:center">Qty</th>
              <th style="text-align:right">Price</th>
              <th style="text-align:right">Total</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>

        <div class="divider"></div>

        <div class="summary-row"><span class="summary-label">Subtotal (${sale.items.length} items)</span><span class="summary-value">${currency} ${sale.subtotal.toLocaleString()}</span></div>
        ${sale.discount > 0 ? `<div class="summary-row"><span class="summary-label">Discount</span><span class="summary-value">-${currency} ${sale.discount.toLocaleString()}</span></div>` : ""}
        ${showTaxBreakdown ? `<div class="summary-row"><span class="summary-label">VAT (${taxRate}%)</span><span class="summary-value">${currency} ${sale.tax.toLocaleString()}</span></div>` : ""}

        <div class="grand-total"><span>Total</span><span>${currency} ${sale.total.toLocaleString()}</span></div>

        ${showPaymentMethod ? `<div class="summary-row"><span class="summary-label">Payment</span><span class="summary-value">${escapeHtml(sale.paymentMethod.toUpperCase())}</span></div>` : ""}
        <div class="summary-row"><span class="summary-label">Tendered</span><span class="summary-value">${currency} ${sale.amountPaid.toLocaleString()}</span></div>
        ${showChangeAmount && sale.change > 0 ? `<div class="summary-row"><span class="summary-label">Change</span><span class="summary-value">${currency} ${sale.change.toLocaleString()}</span></div>` : ""}

        ${sale.items.some((item) => item.requiresPrescription) ? `<div class="note-box">This receipt contains prescription medicines (Rx). Please follow prescribed dosage instructions.</div>` : ""}

        <p class="footer-main">${escapeHtml(footerText)}</p>
        <p class="footer-highlight">${escapeHtml(thankYouMessage)}</p>
        <p class="footer-small">No returns after 24hrs. Keep receipt for reference.</p>
        <p class="footer-small">${escapeHtml(poweredBy)}</p>
        <script>
          window.onload = () => {
            window.print();
            window.onafterprint = () => window.close();
          };
        <\/script>
      </body></html>
    `);
    win.document.close();
  }, [
    address,
    currency,
    footerText,
    headerText,
    licenseNo,
    pharmacyName,
    phone,
    poweredBy,
    receiptConfig.fontSize,
    receiptConfig.receiptWidth,
    sale,
    showCashier,
    showChangeAmount,
    showCustomer,
    showDateTime,
    showLicense,
    showPaymentMethod,
    showTaxBreakdown,
    taxRate,
    thankYouMessage,
  ]);

  const handleEmail = () => {
    if (sale.customer) {
      toast({ title: "Receipt Emailed", description: `Receipt ${sale.receiptNo} sent to ${sale.customer}.` });
    } else {
      toast({ title: "No Customer", description: "No customer attached to this sale.", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (!autoPrint || hasPrinted.current) return;
    hasPrinted.current = true;
    const timer = window.setTimeout(() => handlePrint(), 500);
    return () => window.clearTimeout(timer);
  }, [autoPrint, handlePrint]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="flex items-center gap-3 p-4 bg-success/10 border-b">
          <div className="h-10 w-10 rounded-full bg-success flex items-center justify-center">
            <Check className="h-5 w-5 text-success-foreground" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Sale Complete!</h3>
            <p className="text-sm text-muted-foreground">
              {sale.receiptNo} • {sale.paymentMethod.toUpperCase()}
            </p>
          </div>
          <div className="ml-auto text-right">
            <div className="text-2xl font-black font-mono text-primary">KES {sale.total.toLocaleString()}</div>
            {sale.change > 0 && (
              <div className="text-xs text-success font-semibold">Change: KES {sale.change.toLocaleString()}</div>
            )}
          </div>
        </div>

        <div className="p-4 max-h-[55vh] overflow-auto">
          <div
            ref={receiptRef}
            className={`${widthClass} mx-auto rounded-2xl border border-border bg-card p-5 font-mono shadow-sm ${fontClass}`}
          >
            {/* Header */}
            <div className="text-center space-y-1">
              {headerText && (
                <p className="text-[10px] font-black uppercase tracking-[0.34em] text-primary">{headerText}</p>
              )}
              <h2 className="text-lg font-black uppercase tracking-[0.1em] text-foreground">{pharmacyName}</h2>
              <p className="text-[10px] font-semibold text-muted-foreground">{address}</p>
              <p className="text-[10px] font-semibold text-muted-foreground">Tel: {phone}</p>
              {showLicense && <p className="text-[10px] font-bold text-muted-foreground">License: {licenseNo}</p>}
            </div>

            <div className="my-3 border-t-2 border-border border-dashed" />

            <div className="space-y-1">
              <div className="flex justify-between gap-3">
                <span className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                  Receipt No
                </span>
                <span className="font-extrabold">{sale.receiptNo}</span>
              </div>
              {showDateTime && (
                <>
                  <div className="flex justify-between gap-3">
                    <span className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                      Date
                    </span>
                    <span className="font-extrabold">{saleDate}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                      Time
                    </span>
                    <span className="font-extrabold">{saleTime}</span>
                  </div>
                </>
              )}
              {showCashier && (
                <div className="flex justify-between gap-3">
                  <span className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                    Cashier
                  </span>
                  <span className="font-extrabold">{sale.cashier}</span>
                </div>
              )}
              {sale.customer && showCustomer && (
                <div className="flex justify-between gap-3">
                  <span className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                    Customer
                  </span>
                  <span className="font-extrabold text-right">{sale.customer}</span>
                </div>
              )}
            </div>

            <div className="my-3 border-t-2 border-border border-dashed" />

            {/* Items */}
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-border text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                  <th className="text-left py-1">Item</th>
                  <th className="text-center py-1 w-10">Qty</th>
                  <th className="text-right py-1 w-14">Price</th>
                  <th className="text-right py-1 w-16">Total</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item) => (
                  <tr key={item.id} className="border-b border-dashed border-border/70 align-top last:border-b-0">
                    <td className="py-1">
                      <div className="text-[11px] font-extrabold">{item.name}</div>
                      <div className="text-[9px] font-semibold text-muted-foreground">
                        {item.batchNo && `B: ${item.batchNo}`}
                        {item.batchNo && item.requiresPrescription ? " • " : ""}
                        {item.requiresPrescription && "Rx required"}
                      </div>
                      {item.discount > 0 && (
                        <div className="text-[9px] font-bold text-primary">
                          Disc: -{currency} {item.discount}/unit
                        </div>
                      )}
                    </td>
                    <td className="py-1 text-center font-bold">{item.qty}</td>
                    <td className="py-1 text-right font-bold">{item.price.toLocaleString()}</td>
                    <td className="py-1 text-right font-extrabold">{item.lineTotal.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="my-3 border-t-2 border-border border-dashed" />

            {/* Totals */}
            <div className="space-y-1.5">
              <div className="flex justify-between gap-3">
                <span className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                  Subtotal ({sale.items.length} items)
                </span>
                <span className="font-extrabold">
                  {currency} {sale.subtotal.toLocaleString()}
                </span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between gap-3 text-success">
                  <span className="text-[9px] font-black uppercase tracking-[0.14em]">Discount</span>
                  <span className="font-extrabold">
                    -{currency} {sale.discount.toLocaleString()}
                  </span>
                </div>
              )}
              {showTaxBreakdown && (
                <div className="flex justify-between gap-3">
                  <span className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                    VAT ({taxRate}%)
                  </span>
                  <span className="font-extrabold">
                    {currency} {sale.tax.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="my-3 border-y-2 border-border py-2">
              <div className="flex justify-between font-black text-base uppercase tracking-[0.12em]">
                <span>Total</span>
                <span>
                  {currency} {sale.total.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-0.5">
              {showPaymentMethod && (
                <div className="flex justify-between gap-3">
                  <span className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                    Payment
                  </span>
                  <span className="font-extrabold uppercase">{sale.paymentMethod}</span>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <span className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                  Tendered
                </span>
                <span className="font-extrabold">
                  {currency} {sale.amountPaid.toLocaleString()}
                </span>
              </div>
              {showChangeAmount && sale.change > 0 && (
                <div className="flex justify-between gap-3 font-bold">
                  <span className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                    Change
                  </span>
                  <span className="font-extrabold">
                    {currency} {sale.change.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="my-3 border-t-2 border-border border-dashed" />

            {/* Prescription items warning */}
            {sale.items.some((i) => i.requiresPrescription) && (
              <div className="mb-2 rounded-lg border border-border bg-muted/40 p-2 text-center text-[10px] font-semibold">
                ⚠ This receipt contains prescription medicines (Rx).
                <br />
                Please follow prescribed dosage instructions.
              </div>
            )}

            <div className="space-y-1 text-center text-muted-foreground">
              <p className="text-[10px] font-bold">{footerText}</p>
              <p className="font-extrabold text-foreground">{thankYouMessage}</p>
              <p className="text-[9px] font-semibold">No returns after 24hrs. Keep receipt for reference.</p>
              <p className="text-[9px] font-semibold">{poweredBy}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 p-4 border-t bg-muted/30">
          <Button size="sm" variant="outline" className="flex-1" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" /> Print
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={handleEmail}>
            <Mail className="h-4 w-4 mr-1" /> Email
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => {
              handlePrint();
              toast({ title: "PDF", description: "Use print dialog to Save as PDF." });
            }}
          >
            <Download className="h-4 w-4 mr-1" /> PDF
          </Button>
          <Button size="sm" className="flex-1" onClick={onClose}>
            New Sale
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
