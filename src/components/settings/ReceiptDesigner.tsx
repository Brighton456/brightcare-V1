import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useHospital } from "@/contexts/HospitalContext";
import { Eye, Save, RotateCcw, Printer } from "lucide-react";

export interface ReceiptConfig {
  pharmacyName: string;
  address: string;
  phone: string;
  email: string;
  licenseNo: string;
  headerText: string;
  footerText: string;
  thankYouMessage: string;
  showLogo: boolean;
  showLicense: boolean;
  showCashier: boolean;
  showCustomer: boolean;
  showTaxBreakdown: boolean;
  showPaymentMethod: boolean;
  showChangeAmount: boolean;
  showDateTime: boolean;
  receiptWidth: "narrow" | "standard" | "wide";
  fontSize: "small" | "medium" | "large";
  currency: string;
  taxRate: number;
  poweredBy: string;
}

const DEFAULT_CONFIG: ReceiptConfig = {
  pharmacyName: "BRIGHTECH PHARMACY",
  address: "Nairobi, Kenya",
  phone: "+254 700 000 000",
  email: "info@brightech.co.ke",
  licenseNo: "PPB/2024/12345",
  headerText: "",
  footerText: "Thank you for your purchase!",
  thankYouMessage: "Get well soon 💊",
  showLogo: true,
  showLicense: true,
  showCashier: true,
  showCustomer: true,
  showTaxBreakdown: true,
  showPaymentMethod: true,
  showChangeAmount: true,
  showDateTime: true,
  receiptWidth: "standard",
  fontSize: "medium",
  currency: "KES",
  taxRate: 16,
  poweredBy: "Powered by Brightcare POS",
};

const sampleItems = [
  { name: "Paracetamol 500mg", qty: 2, price: 50 },
  { name: "Amoxicillin 250mg", qty: 1, price: 120 },
  { name: "Vitamin C 1000mg", qty: 3, price: 85 },
];

export function ReceiptDesigner() {
  const { hospitalId, hospital, refreshHospital } = useHospital();
  const [config, setConfig] = useState<ReceiptConfig>({ ...DEFAULT_CONFIG });
  const [activeTab, setActiveTab] = useState<"design" | "content" | "options">("design");
  const [saving, setSaving] = useState(false);

  // Load receipt config from hospital settings on mount
  useEffect(() => {
    if (!hospitalId) return;
    supabase.from("hospitals").select("settings, tax_rate, currency, name, address, phone, email").eq("id", hospitalId).single().then(({ data }) => {
      const saved = (data as any)?.settings?.receipt_config || {};
      const hospitalTaxRate = Number((data as any)?.tax_rate ?? DEFAULT_CONFIG.taxRate);
      setConfig({
        ...DEFAULT_CONFIG,
        ...saved,
        pharmacyName: saved.pharmacyName || (data as any)?.name || DEFAULT_CONFIG.pharmacyName,
        address: saved.address || (data as any)?.address || DEFAULT_CONFIG.address,
        phone: saved.phone || (data as any)?.phone || DEFAULT_CONFIG.phone,
        email: saved.email || (data as any)?.email || DEFAULT_CONFIG.email,
        currency: saved.currency || (data as any)?.currency || DEFAULT_CONFIG.currency,
        taxRate: Number.isFinite(Number(saved.taxRate)) && Number(saved.taxRate) > 0
          ? Number(saved.taxRate)
          : hospitalTaxRate,
      });
    });
  }, [hospitalId]);

  useEffect(() => {
    if (!hospital) return;
    setConfig(prev => ({
      ...prev,
      currency: hospital.currency || prev.currency,
      taxRate: typeof hospital.tax_rate === "number" ? Number(hospital.tax_rate) : prev.taxRate,
    }));
  }, [hospital?.currency, hospital?.tax_rate]);

  const update = (field: keyof ReceiptConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const effectiveTaxRate = typeof hospital?.tax_rate === "number"
    ? Number(hospital.tax_rate)
    : Number.isFinite(Number(config.taxRate)) && Number(config.taxRate) > 0
      ? Number(config.taxRate)
      : DEFAULT_CONFIG.taxRate;

  const effectiveCurrency = hospital?.currency || config.currency || DEFAULT_CONFIG.currency;

  const subtotal = sampleItems.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = Math.round((subtotal * effectiveTaxRate / 100) * 100) / 100;
  const total = subtotal + tax;
  const fontClass = config.fontSize === "small" ? "text-[11px]" : config.fontSize === "large" ? "text-[13px]" : "text-[12px]";
  const widthClass = config.receiptWidth === "narrow" ? "max-w-[260px]" : config.receiptWidth === "wide" ? "max-w-[380px]" : "max-w-[320px]";

  const handleSave = async () => {
    if (!hospitalId) return;
    setSaving(true);
    try {
      // Read current settings, merge receipt_config, write back
      const { data: h } = await supabase.from("hospitals").select("settings").eq("id", hospitalId).single();
      const currentSettings = (h as any)?.settings || {};
      const updatedReceiptConfig = { ...config, taxRate: effectiveTaxRate, currency: effectiveCurrency };
      const updatedSettings = { ...currentSettings, receipt_config: updatedReceiptConfig };
      const { error } = await supabase.from("hospitals").update({ settings: updatedSettings } as any).eq("id", hospitalId);
      if (error) { toast({ title: "Error saving", description: error.message, variant: "destructive" }); return; }
      setConfig(updatedReceiptConfig);
      await refreshHospital();
      toast({ title: "✅ Receipt Template Saved", description: "Your receipt layout has been saved to the database." });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig({
      ...DEFAULT_CONFIG,
      pharmacyName: hospital?.name || DEFAULT_CONFIG.pharmacyName,
      address: hospital?.address || DEFAULT_CONFIG.address,
      phone: hospital?.phone || DEFAULT_CONFIG.phone,
      email: hospital?.email || DEFAULT_CONFIG.email,
      currency: hospital?.currency || DEFAULT_CONFIG.currency,
      taxRate: typeof hospital?.tax_rate === "number" ? Number(hospital.tax_rate) : DEFAULT_CONFIG.taxRate,
    });
    toast({ title: "Template Reset", description: "Receipt layout restored to defaults." });
  };

  const handlePrintDemo = () => {
    const widthPx = config.receiptWidth === "narrow" ? 260 : config.receiptWidth === "wide" ? 380 : 320;
    const fs = config.fontSize === "small" ? "11px" : config.fontSize === "large" ? "13px" : "12px";
    const itemRows = sampleItems.map(i => `
      <tr>
        <td>
          <div class="item-name">${i.name}</div>
          <div class="item-meta">Sample medicine line</div>
        </td>
        <td style="text-align:center">${i.qty}</td>
        <td style="text-align:right">${i.price}</td>
        <td style="text-align:right">${(i.price * i.qty).toLocaleString()}</td>
      </tr>
    `).join("");
    const win = window.open("", "_blank", `width=${widthPx + 80},height=700`);
    if (!win) return;
    win.document.write(`<html><head><title>Receipt Demo</title><style>
      @media print { @page { margin: 0; size: ${widthPx + 40}px auto; } }
      body { font-family: 'Courier New', monospace; font-size: ${fs}; width: ${widthPx}px; margin: 10px auto; padding: 12px; color: #111; line-height: 1.45; font-weight: 600; }
      .center { text-align: center; }
      .kicker { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.28em; }
      .brand { font-size: 18px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; margin: 6px 0 4px; }
      .meta { font-size: 10px; font-weight: 700; color: #4b5563; margin: 2px 0; }
      .sep { border-top: 2px solid #111; border-bottom: 1px dashed #777; height: 3px; margin: 10px 0; }
      .row { display: flex; justify-content: space-between; gap: 12px; margin: 3px 0; }
      .label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.18em; color: #6b7280; }
      .value { font-weight: 800; }
      table { width: 100%; border-collapse: collapse; }
      th { text-align: left; padding: 5px 0; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.14em; border-bottom: 1px solid #111; }
      td { padding: 5px 0; vertical-align: top; border-bottom: 1px dashed #d4d4d8; }
      .item-name { font-size: 11px; font-weight: 800; }
      .item-meta { font-size: 9px; font-weight: 700; color: #6b7280; margin-top: 2px; }
      .total { font-size: 15px; font-weight: 900; letter-spacing: 0.08em; }
      .small { font-size: 9px; font-weight: 700; color: #6b7280; margin-top: 8px; }
    </style></head><body>
      ${config.headerText ? `<p class="center kicker">${config.headerText}</p>` : ""}
      <h2 class="center brand">${config.pharmacyName}</h2>
      <p class="center meta">${config.address}</p>
      <p class="center meta">Tel: ${config.phone}</p>
      ${config.showLicense ? `<p class="center meta">License: ${config.licenseNo}</p>` : ""}
      <div class="sep"></div>
      ${config.showDateTime ? `<div class="row"><span class="label">Receipt</span><span class="value">RX-1001</span></div><div class="row"><span class="label">Date</span><span class="value">${new Date().toLocaleDateString()}</span></div>` : ""}
      ${config.showCashier ? `<div class="row"><span class="label">Cashier</span><span class="value">Admin${config.showDateTime ? ` • ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}</span></div>` : ""}
      ${config.showCustomer ? `<div class="row"><span class="label">Customer</span><span class="value">Mary Wanjiku</span></div>` : ""}
      <div class="sep"></div>
      <table><thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr></thead><tbody>${itemRows}</tbody></table>
      <div class="sep"></div>
      <div class="row"><span class="label">Subtotal</span><span class="value">${effectiveCurrency} ${subtotal.toLocaleString()}</span></div>
      ${config.showTaxBreakdown ? `<div class="row"><span class="label">VAT (${effectiveTaxRate}%)</span><span class="value">${effectiveCurrency} ${tax.toLocaleString()}</span></div>` : ""}
      <div class="sep"></div>
      <div class="row total"><span>TOTAL</span><span>${effectiveCurrency} ${total.toLocaleString()}</span></div>
      <div class="sep"></div>
      ${config.showPaymentMethod ? `<div class="row"><span class="label">Payment</span><span class="value">CASH • ${effectiveCurrency} ${(total + 50).toLocaleString()}</span></div>` : ""}
      ${config.showChangeAmount ? `<div class="row"><span class="label">Change</span><span class="value">${effectiveCurrency} 50</span></div>` : ""}
      <div class="sep"></div>
      <p class="center meta">${config.footerText}</p>
      <p class="center" style="font-weight:800">${config.thankYouMessage}</p>
      ${config.poweredBy ? `<p class="center small">${config.poweredBy}</p>` : ""}
      <script>window.print();<\/script>
    </body></html>`);
    win.document.close();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Receipt Template Editor</CardTitle>
            <div className="flex gap-1">
              {(["design", "content", "options"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    activeTab === tab ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeTab === "design" && (
            <>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Receipt Width</label>
                <div className="flex gap-2">
                  {(["narrow", "standard", "wide"] as const).map(w => (
                    <button key={w} onClick={() => update("receiptWidth", w)}
                      className={`flex-1 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                        config.receiptWidth === w ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
                      }`}>
                      {w.charAt(0).toUpperCase() + w.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Font Size</label>
                <div className="flex gap-2">
                  {(["small", "medium", "large"] as const).map(s => (
                    <button key={s} onClick={() => update("fontSize", s)}
                      className={`flex-1 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                        config.fontSize === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
                      }`}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><label className="text-xs text-muted-foreground mb-1 block">Currency</label><Input value={config.currency} onChange={e => update("currency", e.target.value)} /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Tax Rate (%)</label><Input type="number" value={effectiveTaxRate} disabled /></div>
              </div>
              <p className="text-[11px] font-medium text-muted-foreground">Tax now follows the Hospital Profile automatically.</p>
            </>
          )}

          {activeTab === "content" && (
            <>
              <div><label className="text-xs text-muted-foreground mb-1 block">Pharmacy Name</label><Input value={config.pharmacyName} onChange={e => update("pharmacyName", e.target.value)} /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Address</label><Input value={config.address} onChange={e => update("address", e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-xs text-muted-foreground mb-1 block">Phone</label><Input value={config.phone} onChange={e => update("phone", e.target.value)} /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Email</label><Input value={config.email} onChange={e => update("email", e.target.value)} /></div>
              </div>
              <div><label className="text-xs text-muted-foreground mb-1 block">License Number</label><Input value={config.licenseNo} onChange={e => update("licenseNo", e.target.value)} /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Custom Header Text</label><Input value={config.headerText} onChange={e => update("headerText", e.target.value)} placeholder="Optional banner text..." /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Footer Message</label><Input value={config.footerText} onChange={e => update("footerText", e.target.value)} /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Thank You Message</label><Input value={config.thankYouMessage} onChange={e => update("thankYouMessage", e.target.value)} /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Powered By</label><Input value={config.poweredBy} onChange={e => update("poweredBy", e.target.value)} /></div>
            </>
          )}

          {activeTab === "options" && (
            <div className="space-y-2">
              {([
                { key: "showLicense" as const, label: "Show License Number" },
                { key: "showCashier" as const, label: "Show Cashier Name" },
                { key: "showCustomer" as const, label: "Show Customer Name" },
                { key: "showTaxBreakdown" as const, label: "Show Tax Breakdown" },
                { key: "showPaymentMethod" as const, label: "Show Payment Method" },
                { key: "showChangeAmount" as const, label: "Show Change Amount" },
                { key: "showDateTime" as const, label: "Show Date & Time" },
              ]).map(opt => (
                <div key={opt.key} className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <span className="text-sm">{opt.label}</span>
                  <button onClick={() => update(opt.key, !config[opt.key])}>
                    <Badge variant={config[opt.key] ? "default" : "secondary"} className="text-[10px] cursor-pointer">
                      {config[opt.key] ? "ON" : "OFF"}
                    </Badge>
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button size="sm" className="flex-1" onClick={handleSave} disabled={saving}><Save className="h-4 w-4 mr-1" />{saving ? "Saving..." : "Save Template"}</Button>
            <Button size="sm" variant="secondary" onClick={handlePrintDemo}><Printer className="h-4 w-4 mr-1" />Print Demo</Button>
            <Button size="sm" variant="outline" onClick={handleReset}><RotateCcw className="h-4 w-4 mr-1" />Reset</Button>
          </div>
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><Eye className="h-4 w-4" />Live Preview</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className={`${widthClass} w-full rounded-2xl border border-border bg-card p-5 font-mono shadow-sm ${fontClass}`}>
            <div className="text-center space-y-1">
              {config.headerText && <p className="text-[10px] font-black uppercase tracking-[0.32em] text-primary">{config.headerText}</p>}
              <h2 className="text-lg font-black uppercase tracking-[0.1em]">{config.pharmacyName}</h2>
              <p className="text-[10px] font-semibold text-muted-foreground">{config.address}</p>
              <p className="text-[10px] font-semibold text-muted-foreground">Tel: {config.phone}</p>
              {config.showLicense && <p className="text-[10px] font-bold text-muted-foreground">License: {config.licenseNo}</p>}
            </div>
            <div className="my-3 border-t-2 border-border border-dashed" />
            <div className="space-y-1">
              {config.showDateTime && (
                <>
                  <div className="flex justify-between gap-3"><span className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">Receipt</span><span className="font-extrabold">RX-1001</span></div>
                  <div className="flex justify-between gap-3"><span className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">Date</span><span className="font-extrabold">{new Date().toLocaleDateString()}</span></div>
                </>
              )}
              {config.showCashier && <div className="flex justify-between gap-3"><span className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">Cashier</span><span className="font-extrabold">Admin{config.showDateTime && ` • ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}</span></div>}
              {config.showCustomer && <div className="flex justify-between gap-3"><span className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">Customer</span><span className="font-extrabold">Mary Wanjiku</span></div>}
            </div>
            <div className="my-3 border-t-2 border-border border-dashed" />
            <div className="grid grid-cols-[1fr_34px_54px_64px] gap-2 border-b border-border pb-1 text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
              <span>Item</span><span className="text-center">Qty</span><span className="text-right">Price</span><span className="text-right">Total</span>
            </div>
            {sampleItems.map((item, i) => (
              <div key={i} className="grid grid-cols-[1fr_34px_54px_64px] gap-2 border-b border-dashed border-border/70 py-2 last:border-b-0">
                <div>
                  <span className="block truncate text-[11px] font-extrabold">{item.name}</span>
                  <span className="text-[9px] font-semibold text-muted-foreground">Demo medicine line</span>
                </div>
                <span className="text-center font-bold">{item.qty}</span>
                <span className="text-right font-bold">{item.price}</span>
                <span className="text-right font-extrabold">{(item.price * item.qty).toLocaleString()}</span>
              </div>
            ))}
            <div className="my-3 border-t-2 border-border border-dashed" />
            <div className="space-y-1.5">
              <div className="flex justify-between gap-3"><span className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">Subtotal</span><span className="font-extrabold">{effectiveCurrency} {subtotal.toLocaleString()}</span></div>
              {config.showTaxBreakdown && <div className="flex justify-between gap-3"><span className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">VAT ({effectiveTaxRate}%)</span><span className="font-extrabold">{effectiveCurrency} {tax.toLocaleString()}</span></div>}
            </div>
            <div className="my-3 border-y-2 border-border py-2">
              <div className="flex justify-between text-sm font-black uppercase tracking-[0.12em]"><span>Total</span><span>{effectiveCurrency} {total.toLocaleString()}</span></div>
            </div>
            {config.showPaymentMethod && <div className="flex justify-between gap-3"><span className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">Payment</span><span className="font-extrabold">CASH • {effectiveCurrency} {(total + 50).toLocaleString()}</span></div>}
            {config.showChangeAmount && <div className="mt-1 flex justify-between gap-3"><span className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">Change</span><span className="font-extrabold">{effectiveCurrency} 50</span></div>}
            <div className="my-3 border-t-2 border-border border-dashed" />
            <div className="text-center space-y-1 text-muted-foreground">
              <p className="text-[10px] font-bold">{config.footerText}</p>
              <p className="font-extrabold text-foreground">{config.thankYouMessage}</p>
              {config.poweredBy && <p className="text-[9px] font-semibold opacity-70">{config.poweredBy}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
