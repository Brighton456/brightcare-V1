import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useAuth } from "@/contexts/AuthContext";
import { useHospital } from "@/contexts/HospitalContext";
import { initiateMpesaPayment, pollMpesaStatus, generateReference } from "@/utils/mpesa";
import { toast } from "@/hooks/use-toast";
import {
  Shield, Zap, Sparkles, Check, ArrowLeft, Phone,
  Loader2, CheckCircle2, XCircle, Lock, AlertTriangle, Smartphone,
  Crown, Key,
} from "lucide-react";
import { isValidLicenseKeyFormat } from "@/utils/licenseKeys";

interface Package {
  id: string;
  name: string;
  display_name: string;
  price_monthly: number;
  price_yearly: number | null;
  price_lifetime: number | null;
  maintenance_monthly: number | null;
  description: string;
  allowed_modules: string[];
  max_staff: number;
}

const TIER_COLORS: Record<string, string> = {
  basic: "from-emerald-500 to-teal-600",
  standard: "from-blue-500 to-indigo-600",
  premium: "from-purple-500 to-pink-600",
  enterprise_forever: "from-amber-500 to-orange-600",
};

const TIER_ICONS: Record<string, React.ReactNode> = {
  basic: <Shield className="h-6 w-6" />,
  standard: <Zap className="h-6 w-6" />,
  premium: <Sparkles className="h-6 w-6" />,
  enterprise_forever: <Crown className="h-6 w-6" />,
};

const TIER_FEATURES: Record<string, string[]> = {
  basic: [
    "Core POS system (pharmacy + billing)",
    "Patient registration & records",
    "Prescription module (doctor → pharmacy)",
    "Nurse read-only prescriptions",
    "Basic reporting (daily sales, visits)",
    "Up to 20 staff accounts",
    "Email support",
  ],
  standard: [
    "Everything in Basic, plus:",
    "Lab module (test requests + results)",
    "Nurse dashboard with patient care logs",
    "Inventory management with stock alerts",
    "Role-based dashboards per department",
    "Automated renewal reminders",
    "Up to 50 staff accounts",
    "Priority support (chat + email)",
  ],
  premium: [
    "Everything in Standard, plus:",
    "AI chatbot assistant (role-aware)",
    "Predictive analytics (shortages, workload)",
    "Compliance dashboard with audit logs",
    "Add-on marketplace",
    "Multi-hospital oversight",
    "Up to 500 staff accounts",
    "24/7 premium support",
  ],
  enterprise_forever: [
    "All Premium features included",
    "One-time payment — own forever",
    "Zero monthly maintenance fees",
    "Unlimited staff accounts",
    "Priority lifetime support",
    "Free major updates for life",
    "White-label branding option",
  ],
};

const KES_TO_USD = 130; // approximate rate

type PaymentStatus = "idle" | "sending" | "polling" | "completed" | "failed";
type ActivationMethod = "key" | "mpesa" | null;

export default function UpgradePage() {
  const navigate = useNavigate();
  const { staff } = useAuth();
  const { hospital, trialDaysLeft, hospitalId, refreshHospital } = useHospital();
  const isAdmin = staff?.role === "hospital_admin" || staff?.role === "platform_admin";

  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<string>("");
  const [activationMethod, setActivationMethod] = useState<ActivationMethod>(null);

  // License key
  const [licenseKeyInput, setLicenseKeyInput] = useState("");
  const [activatingKey, setActivatingKey] = useState(false);

  // M-Pesa
  const [paymentPhone, setPaymentPhone] = useState(hospital?.phone || "");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");
  const [mpesaReceipt, setMpesaReceipt] = useState("");
  const [pollProgress, setPollProgress] = useState(0);
  const [pollCount, setPollCount] = useState(0);
  const cancelPollRef = useRef<(() => void) | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    supabase.from("license_packages").select("*").eq("is_active", true).order("sort_order").then(({ data }) => {
      if (data) setPackages(data as any);
    });
  }, []);

  useEffect(() => {
    return () => {
      cancelPollRef.current?.();
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  const selectedPackage = packages.find(p => p.id === selectedPkg);

  const handleActivateKey = async () => {
    if (!isValidLicenseKeyFormat(licenseKeyInput)) {
      toast({ title: "Invalid format", description: "Key must be XXXX-XXXX-XXXX-XXXX", variant: "destructive" });
      return;
    }
    setActivatingKey(true);
    try {
      const { data: keyRow, error: keyErr } = await supabase
        .from("license_keys")
        .select("*, license_packages(id, display_name, allowed_modules)")
        .eq("license_key", licenseKeyInput)
        .single();

      if (keyErr || !keyRow) {
        toast({ title: "Invalid key", description: "This license key was not found.", variant: "destructive" });
        return;
      }
      if ((keyRow as any).status !== "unused") {
        toast({ title: "Key already used", description: `This key is ${(keyRow as any).status}.`, variant: "destructive" });
        return;
      }

      const now = new Date();
      const expires = new Date(now);
      expires.setMonth(expires.getMonth() + ((keyRow as any).duration_months || 1));

      await supabase.from("license_keys").update({
        status: "activated",
        hospital_id: hospitalId,
        activated_at: now.toISOString(),
        expires_at: expires.toISOString(),
      } as any).eq("id", (keyRow as any).id);

      await supabase.from("hospitals").update({
        license_status: "active",
        license_package_id: (keyRow as any).package_id,
        license_started_at: now.toISOString(),
        license_expires_at: expires.toISOString(),
        license_key: licenseKeyInput,
      } as any).eq("id", hospitalId);

      await supabase.from("license_audit_log").insert({
        hospital_id: hospitalId,
        action: "LICENSE_ACTIVATED",
        details: `License key ${licenseKeyInput} activated. Package: ${(keyRow as any).license_packages?.display_name}. Expires: ${expires.toLocaleDateString()}`,
        performed_by: staff?.id,
      });

      toast({ title: "🎉 License Activated!", description: `${(keyRow as any).license_packages?.display_name} activated until ${expires.toLocaleDateString()}` });
      await refreshHospital();
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Activation Error", description: err.message, variant: "destructive" });
    } finally {
      setActivatingKey(false);
    }
  };

  const handleMpesaPayment = async () => {
    if (!paymentPhone || paymentPhone.length < 9) {
      toast({ title: "Error", description: "Enter a valid M-Pesa phone number.", variant: "destructive" });
      return;
    }
    if (!selectedPackage) {
      toast({ title: "Error", description: "Please select a package first.", variant: "destructive" });
      return;
    }
    const isLifetime = selectedPackage.name === "enterprise_forever";
    const amount = isLifetime
      ? (selectedPackage.price_lifetime || 80000)
      : (selectedPackage.price_yearly || selectedPackage.price_monthly);
    setPaymentStatus("sending");
    setPollProgress(0);
    setPollCount(0);

    try {
      const ref = generateReference("BC-UPG");
      const result = await initiateMpesaPayment({
        amount,
        phone_number: paymentPhone,
        external_reference: ref,
      });

      if (!result.success || !result.checkout_id) throw new Error(result.error || "Failed to initiate payment");

      setPaymentStatus("polling");

      // Start progress animation
      let progress = 0;
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      progressTimerRef.current = setInterval(() => {
        progress += 0.83;
        setPollProgress(Math.min(progress, 98));
        setPollCount(prev => prev + 1);
      }, 1000);

      const cancel = pollMpesaStatus(
        result.checkout_id,
        () => {},
        async (status) => {
          if (progressTimerRef.current) clearInterval(progressTimerRef.current);
          if (status.status === "COMPLETED") {
            setPollProgress(100);
            setPaymentStatus("completed");
            setMpesaReceipt(status.mpesa_receipt || "");

            const now = new Date();
            const expires = new Date(now);
            if (isLifetime) {
              expires.setFullYear(expires.getFullYear() + 99); // "forever"
            } else {
              expires.setFullYear(expires.getFullYear() + 1);
            }

            const maintenanceDue = isLifetime ? null : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

            await supabase.from("hospitals").update({
              license_status: "active",
              license_package_id: selectedPkg,
              license_started_at: now.toISOString(),
              license_expires_at: expires.toISOString(),
              license_payment_mode: isLifetime ? "lifetime" : "annual",
              maintenance_due_at: maintenanceDue,
              maintenance_last_paid_at: isLifetime ? null : now.toISOString(),
            } as any).eq("id", hospitalId);

            await supabase.from("license_audit_log").insert({
              hospital_id: hospitalId,
              action: "LICENSE_UPGRADED_MPESA",
              details: `Upgraded to ${selectedPackage.display_name} via M-Pesa. Receipt: ${status.mpesa_receipt}. Amount: KES ${amount.toLocaleString()}. Expires: ${expires.toLocaleDateString()}`,
              performed_by: staff?.id,
            });

            toast({ title: "🎉 Upgrade Successful!", description: `${selectedPackage.display_name} activated. M-Pesa receipt: ${status.mpesa_receipt}` });
            await refreshHospital();
          } else {
            setPaymentStatus("failed");
            toast({ title: "Payment Failed", description: "The M-Pesa payment was not completed.", variant: "destructive" });
          }
        },
        (error) => {
          if (progressTimerRef.current) clearInterval(progressTimerRef.current);
          setPaymentStatus("failed");
          toast({ title: "Payment Error", description: error.message, variant: "destructive" });
        },
        3000,
        40
      );
      cancelPollRef.current = cancel;
    } catch (err: any) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setPaymentStatus("failed");
      toast({ title: "Payment Error", description: err.message, variant: "destructive" });
    }
  };

  const handleCancelPayment = () => {
    cancelPollRef.current?.();
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    setPaymentStatus("idle");
    setPollProgress(0);
    setPollCount(0);
  };

  const pollingMessages = [
    "Connecting to M-Pesa...",
    "STK Push sent to your phone...",
    "Waiting for PIN entry...",
    "Processing payment...",
    "Almost there...",
  ];
  const getPollingPhase = () => {
    if (pollCount < 3) return 0;
    if (pollCount < 8) return 1;
    if (pollCount < 20) return 2;
    if (pollCount < 35) return 3;
    return 4;
  };

  // Non-admin: show access denied
  if (!isAdmin) {
    return (
      <AppLayout title="Upgrade">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md text-center">
            <CardContent className="pt-8 pb-8 space-y-4">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <Lock className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-xl font-bold">Admin Access Required</h2>
              <p className="text-sm text-muted-foreground">
                Only hospital administrators can upgrade the subscription plan. Please contact your hospital admin.
              </p>
              <Button variant="outline" onClick={() => navigate("/dashboard")} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Upgrade Plan">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back button */}
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>

        {/* Current status */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  hospital?.license_status === "active" ? "bg-emerald-100 dark:bg-emerald-900" : "bg-amber-100 dark:bg-amber-900"
                }`}>
                  {hospital?.license_status === "active"
                    ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    : <AlertTriangle className="h-5 w-5 text-amber-600" />}
                </div>
                <div>
                  <p className="font-bold text-sm">
                    {hospital?.license_status === "active" ? "Active License" : "Free Trial"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {hospital?.license_status === "trial" && trialDaysLeft !== null
                      ? `${trialDaysLeft} day${trialDaysLeft !== 1 ? "s" : ""} remaining`
                      : hospital?.license_expires_at
                        ? `Expires ${new Date(hospital.license_expires_at).toLocaleDateString()}`
                        : "No expiry set"}
                  </p>
                </div>
              </div>
              {hospital?.license_status === "active" && (
                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200">
                  Current Plan Active
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activation method choice */}
        {!activationMethod && (
          <>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">How would you like to activate?</h2>
              <p className="text-muted-foreground">Choose your preferred activation method</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <Card
                className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-2 hover:border-primary/50"
                onClick={() => setActivationMethod("key")}
              >
                <CardContent className="pt-6 pb-6 text-center space-y-3">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <Key className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg">I have an Activation Key</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter a license key provided by your vendor to instantly activate your package.
                  </p>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-2 hover:border-primary/50"
                onClick={() => setActivationMethod("mpesa")}
              >
                <CardContent className="pt-6 pb-6 text-center space-y-3">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto">
                    <Phone className="h-7 w-7 text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-lg">Pay with M-Pesa</h3>
                  <p className="text-sm text-muted-foreground">
                    Select a plan and pay instantly via M-Pesa. Payment is verified automatically.
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Activation Key Form */}
        {activationMethod === "key" && (
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" /> Enter Activation Key</CardTitle>
              <CardDescription>Enter the license key provided by your administrator or vendor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>License Key</Label>
                <Input
                  value={licenseKeyInput}
                  onChange={e => setLicenseKeyInput(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  className="font-mono text-lg text-center tracking-widest"
                  maxLength={19}
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  The key will automatically detect and activate the associated package and duration.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setActivationMethod(null)} className="gap-1">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button
                  className="flex-1 gap-2"
                  disabled={activatingKey || licenseKeyInput.length < 19}
                  onClick={handleActivateKey}
                >
                  {activatingKey ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</> : <><Key className="h-4 w-4" /> Activate License</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* M-Pesa Payment Flow */}
        {activationMethod === "mpesa" && (
          <div className="space-y-6">
            {/* Package Selection */}
            {paymentStatus === "idle" && (
              <>
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-bold">Select a Plan</h3>
                  <p className="text-sm text-muted-foreground">Choose the package that fits your hospital. Payment is verified automatically via M-Pesa callback.</p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {packages.map(pkg => {
                    const isLifetime = pkg.name === "enterprise_forever";
                    const mainPrice = isLifetime ? (pkg.price_lifetime || 80000) : (pkg.price_yearly || pkg.price_monthly);
                    const usdPrice = Math.round(mainPrice / KES_TO_USD);
                    return (
                    <Card
                      key={pkg.id}
                      className={`relative cursor-pointer transition-all hover:shadow-lg ${selectedPkg === pkg.id ? "ring-2 ring-primary shadow-lg scale-[1.02]" : "hover:scale-[1.01]"}`}
                      onClick={() => setSelectedPkg(pkg.id)}
                    >
                      {pkg.name === "premium" && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">Most Popular</Badge>
                        </div>
                      )}
                      {isLifetime && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">Best Value</Badge>
                        </div>
                      )}
                      <CardHeader className="pb-3">
                        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${TIER_COLORS[pkg.name] || "from-gray-500 to-gray-600"} flex items-center justify-center mb-2 text-white [&>svg]:text-white`}>
                          {TIER_ICONS[pkg.name]}
                        </div>
                        <CardTitle className="text-lg">{pkg.display_name}</CardTitle>
                        <CardDescription className="text-xs">{pkg.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-1">
                          <span className="text-2xl font-black">KES {mainPrice.toLocaleString()}</span>
                          <span className="text-muted-foreground text-sm">{isLifetime ? " one-time" : "/year"}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mb-1">
                          ≈ ${usdPrice.toLocaleString()} USD
                        </p>
                        {isLifetime ? (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-3">
                            ✓ No monthly maintenance fees
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground mb-3">
                            + KES {(pkg.maintenance_monthly || 3000).toLocaleString()}/mo maintenance (~${Math.round((pkg.maintenance_monthly || 3000) / KES_TO_USD)})
                          </p>
                        )}
                        <ul className="space-y-1.5 text-xs">
                          {(TIER_FEATURES[pkg.name] || []).map((feat, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <Check className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  );
                  })}
                </div>

                {selectedPkg && selectedPackage && (() => {
                  const isLifetimePkg = selectedPackage.name === "enterprise_forever";
                  const payAmount = isLifetimePkg ? (selectedPackage.price_lifetime || 80000) : (selectedPackage.price_yearly || selectedPackage.price_monthly);
                  return (
                  <Card className="max-w-lg mx-auto">
                    <CardContent className="pt-5 space-y-4">
                      <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Package</span><span className="font-bold">{selectedPackage.display_name}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">{isLifetimePkg ? "One-time Fee" : "Annual Fee"}</span><span className="font-bold">KES {payAmount.toLocaleString()} <span className="text-xs text-muted-foreground">(~${Math.round(payAmount / KES_TO_USD)})</span></span></div>
                        {!isLifetimePkg && (
                          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Monthly Maintenance</span><span>KES {(selectedPackage.maintenance_monthly || 3000).toLocaleString()}/mo</span></div>
                        )}
                        {isLifetimePkg && (
                          <div className="flex justify-between text-xs text-emerald-600"><span>Maintenance</span><span className="font-semibold">FREE forever</span></div>
                        )}
                      </div>
                      <div>
                        <Label>M-Pesa Phone Number</Label>
                        <div className="relative mt-1">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            value={paymentPhone}
                            onChange={e => setPaymentPhone(e.target.value)}
                            placeholder="e.g. 0712345678 or 254712345678"
                            className="pl-10 font-mono"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button variant="outline" onClick={() => { setActivationMethod(null); setSelectedPkg(""); }}>
                          <ArrowLeft className="h-4 w-4" /> Back
                        </Button>
                        <Button className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleMpesaPayment} disabled={!paymentPhone}>
                          <Smartphone className="h-4 w-4" /> Pay KES {payAmount.toLocaleString()}
                        </Button>
                      </div>
                      <p className="text-[10px] text-center text-muted-foreground">
                        Payment is verified automatically. No activation key required.
                      </p>
                    </CardContent>
                  </Card>
                  );
                })()}
              </>
            )}

            {/* Payment Processing - Beautiful polling animation */}
            {(paymentStatus === "sending" || paymentStatus === "polling") && (
              <Card className="max-w-md mx-auto overflow-hidden">
                <div className="bg-emerald-600 px-6 py-4">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <Smartphone className="h-5 w-5" /> M-PESA Payment
                  </h3>
                </div>
                <CardContent className="py-8 text-center space-y-6">
                  {/* Animated phone icon */}
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center animate-pulse">
                        <Smartphone className="h-10 w-10 text-emerald-600" />
                      </div>
                      <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 animate-ping" />
                      <div className="absolute -inset-2 rounded-full border border-emerald-500/15 animate-ping" style={{ animationDelay: "0.5s" }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      {paymentStatus === "sending" ? "Sending STK Push..." : pollingMessages[getPollingPhase()]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {paymentStatus === "sending"
                        ? "Sending payment prompt to your phone"
                        : "Please complete the M-Pesa payment on your phone"}
                    </p>
                    <p className="text-lg font-bold text-foreground mt-2">
                      KES {selectedPackage ? (selectedPackage.price_yearly || selectedPackage.price_monthly).toLocaleString() : "—"}
                    </p>
                  </div>

                  {paymentStatus === "polling" && (
                    <div className="space-y-2">
                      <Progress value={pollProgress} className="h-2" />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Waiting for confirmation</span>
                        <span>{Math.round(pollProgress)}%</span>
                      </div>
                    </div>
                  )}

                  {/* Animated dots */}
                  <div className="flex justify-center gap-1.5">
                    {[0, 1, 2, 3].map(i => (
                      <div
                        key={i}
                        className="h-2 w-2 rounded-full bg-emerald-500"
                        style={{
                          animation: "pulse 1.5s ease-in-out infinite",
                          animationDelay: `${i * 0.3}s`,
                          opacity: 0.3,
                        }}
                      />
                    ))}
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    Do not close this window. Payment will be verified automatically.
                  </p>

                  <Button variant="outline" size="sm" onClick={handleCancelPayment}>
                    Cancel Payment
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Payment Success */}
            {paymentStatus === "completed" && (
              <Card className="max-w-md mx-auto">
                <CardContent className="py-10 text-center space-y-4">
                  <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-xl text-emerald-600">Upgrade Successful! 🎉</h3>
                  <p className="text-sm text-muted-foreground">
                    Your hospital has been upgraded to <strong>{selectedPackage?.display_name}</strong>.
                    License activated automatically.
                  </p>
                  {mpesaReceipt && (
                    <div className="bg-muted/50 border rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">M-Pesa Receipt</p>
                      <p className="text-lg font-mono font-bold tracking-wider">{mpesaReceipt}</p>
                    </div>
                  )}
                  <Progress value={100} className="h-2" />
                  <Button onClick={() => navigate("/dashboard")} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Check className="h-4 w-4" /> Go to Dashboard
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Payment Failed */}
            {paymentStatus === "failed" && (
              <Card className="max-w-md mx-auto">
                <CardContent className="py-10 text-center space-y-4">
                  <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                    <XCircle className="h-8 w-8 text-destructive" />
                  </div>
                  <h3 className="font-bold text-xl">Payment Failed</h3>
                  <p className="text-sm text-muted-foreground">The M-Pesa payment was not completed. Please try again.</p>
                  <div className="space-y-2">
                    <Button onClick={() => { setPaymentStatus("idle"); setPollProgress(0); setPollCount(0); }} className="w-full gap-2">
                      Try Again
                    </Button>
                    <Button variant="outline" onClick={() => { setActivationMethod(null); setPaymentStatus("idle"); }} className="w-full">
                      Back to Options
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
