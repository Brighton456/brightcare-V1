import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Building2, Check, ArrowRight, ArrowLeft, Sparkles, Shield, Zap, Phone, Loader2,
  CheckCircle2, XCircle, Clock, Crown, FlaskConical, Pill, CreditCard,
  Stethoscope, Bed, BarChart3, Users, Lock, KeyRound, Rocket, Star, ChevronRight,
} from "lucide-react";
import { FACILITY_ORDER, FACILITY_PACKAGES, type FacilityKey } from "@/config/facilityPackages";
import { initiateMpesaPayment, pollMpesaStatus, generateReference } from "@/utils/mpesa";
import { seedPlatformDefaults } from "@/lib/platformDefaults";
import heroImg from "@/assets/onboarding-hero.jpg";
import constructImg from "@/assets/onboarding-construct.jpg";

interface Package {
  id: string; name: string; display_name: string; price_monthly: number;
  price_yearly: number | null; price_lifetime: number | null; maintenance_monthly: number | null;
  description: string; allowed_modules: string[]; max_staff: number;
}

const TIER_COLORS: Record<string, string> = {
  basic: "from-emerald-500 to-teal-600",
  standard: "from-blue-500 to-indigo-600",
  premium: "from-purple-500 to-pink-600",
};

const FACILITY_COLORS: Record<FacilityKey, string> = {
  hospital: "from-yellow-500 to-orange-600",
  clinic: "from-blue-500 to-indigo-600",
  herbal: "from-emerald-500 to-teal-600",
};

const TIER_ICONS: Record<string, React.ReactNode> = {
  basic: <Pill className="h-7 w-7" />,
  standard: <FlaskConical className="h-7 w-7" />,
  premium: <Sparkles className="h-7 w-7" />,
};

const TIER_TAGLINES: Record<string, string> = {
  basic: "Pharmacy Ready",
  standard: "Lab Connected",
  premium: "AI Activated",
};

const TIER_FEATURES: Record<string, string[]> = {
  basic: ["Core POS system (pharmacy + billing)", "Patient registration & records", "Prescription module (doctor → pharmacy)", "Nurse read-only prescriptions", "Basic reporting (daily sales, visits)", "Up to 20 staff accounts", "Email support"],
  standard: ["Everything in Basic, plus:", "Lab module (test requests + results)", "Nurse dashboard with patient care logs", "Inventory management with stock alerts", "Role-based dashboards per department", "Automated renewal reminders", "Up to 50 staff accounts", "Priority support (chat + email)"],
  premium: ["Everything in Standard, plus:", "AI chatbot assistant (role-aware)", "Predictive analytics", "Compliance dashboard with audit logs", "Add-on marketplace", "Multi-hospital oversight", "Up to 500 staff accounts", "24/7 premium support"],
};

type PaymentStatus = "idle" | "sending" | "polling" | "completed" | "failed";

interface ProvisionStep {
  id: string; label: string; detail: string; icon: React.ReactNode;
  status: "pending" | "running" | "done" | "error";
}

const PROVISION_STEPS: Omit<ProvisionStep, "status">[] = [
  { id: "schema", label: "Creating Hospital Schema", detail: "Initializing isolated data environment...", icon: <Building2 className="h-4 w-4" /> },
  { id: "departments", label: "Building Digital Wards", detail: "Configuring 50+ clinical & admin departments...", icon: <Bed className="h-4 w-4" /> },
  { id: "modules", label: "Activating 100+ Modules", detail: "Enabling hospital management modules...", icon: <Zap className="h-4 w-4" /> },
  { id: "dropdowns", label: "Stocking Clinical Data", detail: "Importing ICD-10 codes, lab tests, allergens, counties & more...", icon: <FlaskConical className="h-4 w-4" /> },
  { id: "hours", label: "Setting Business Hours", detail: "Configuring default operating schedule...", icon: <Clock className="h-4 w-4" /> },
  { id: "permissions", label: "Configuring 800+ Permissions", detail: "Setting role permissions for 10 staff roles...", icon: <Shield className="h-4 w-4" /> },
  { id: "billing", label: "Equipping Finance Engine", detail: "Initializing billing engine, tax rates & payment rules...", icon: <CreditCard className="h-4 w-4" /> },
  { id: "complete", label: "Launching Application", detail: "Running integrity checks & verification...", icon: <Rocket className="h-4 w-4" /> },
];

// ECG animation SVG
function ECGLine() {
  return (
    <svg viewBox="0 0 400 40" className="w-full h-8 opacity-30" preserveAspectRatio="none">
      <path
        d="M0,20 L60,20 L70,20 L80,5 L90,35 L100,10 L110,30 L120,20 L200,20 L210,20 L220,5 L230,35 L240,10 L250,30 L260,20 L340,20 L350,20 L360,5 L370,35 L380,10 L390,30 L400,20"
        fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5"
        className="animate-[ecg_3s_linear_infinite]"
      />
    </svg>
  );
}

// Floating particles background
function Particles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-primary/10 animate-pulse"
          style={{
            width: `${Math.random() * 6 + 2}px`,
            height: `${Math.random() * 6 + 2}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${Math.random() * 3 + 2}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function HospitalOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0 = welcome splash
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedFacilityType, setSelectedFacilityType] = useState<FacilityKey | "">("");
  const [selectedPkg, setSelectedPkg] = useState<string>("");
  useEffect(() => { console.log("DEBUG selectedPkg changed to:", selectedPkg); }, [selectedPkg]);
  const [loading, setLoading] = useState(false);
  const [showContent, setShowContent] = useState(false);

  const [hospitalName, setHospitalName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const [adminFirst, setAdminFirst] = useState("");
  const [adminLast, setAdminLast] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  // Activation key
  const [activationMode, setActivationMode] = useState<"payment" | "key">("payment");
  const [activationKey, setActivationKey] = useState("");

  const [paymentPhone, setPaymentPhone] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");
  const [mpesaReceipt, setMpesaReceipt] = useState("");
  const [pollAttempts, setPollAttempts] = useState(0);
  const [cancelPoll, setCancelPoll] = useState<(() => void) | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Provisioning
  const [provisioning, setProvisioning] = useState(false);
  const [provisionSteps, setProvisionSteps] = useState<ProvisionStep[]>([]);
  const [provisionComplete, setProvisionComplete] = useState(false);

  // Animate welcome screen
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    supabase.from("license_packages").select("*").eq("is_active", true).order("sort_order").then(({ data }) => {
      if (data) setPackages(data as any);
    });
  }, []);

  useEffect(() => { if (phone) setPaymentPhone(phone); }, [phone]);
  useEffect(() => { return () => { cancelPoll?.(); }; }, [cancelPoll]);

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36);
  const selectedPackage = packages.find(p => p.id === selectedPkg);
  // Facility type controls the product configuration; selectedPkg is strictly the
  // billing/license tier ID. Keep these independent throughout onboarding.
  const selectedFacilityProfile = selectedFacilityType
    ? FACILITY_PACKAGES[selectedFacilityType]
    : null;

  const handleMpesaPayment = async () => {
    if (!paymentPhone || paymentPhone.length < 9) { toast({ title: "Error", description: "Enter a valid M-Pesa phone number.", variant: "destructive" }); return; }
    setPaymentStatus("sending");
    setPollAttempts(0);
    try {
      const ref = generateReference("BC-REG");
      const amount = selectedPackage?.price_yearly || 0;
      const result = await initiateMpesaPayment({ amount, phone_number: paymentPhone, external_reference: ref });
      if (!result.success || !result.checkout_id) throw new Error(result.error || "Failed to initiate payment");
      setPaymentStatus("polling");
      const cancel = pollMpesaStatus(result.checkout_id,
        () => setPollAttempts(prev => prev + 1),
        (status) => {
          if (status.status === "COMPLETED") { setPaymentStatus("completed"); setMpesaReceipt(status.mpesa_receipt || ""); toast({ title: "✅ Payment Received!", description: `Receipt: ${status.mpesa_receipt}` }); }
          else { setPaymentStatus("failed"); toast({ title: "Payment Failed", variant: "destructive" }); }
        },
        (error) => { setPaymentStatus("failed"); toast({ title: "Payment Error", description: error.message, variant: "destructive" }); },
        3000, 40
      );
      setCancelPoll(() => cancel);
    } catch (err: any) { setPaymentStatus("failed"); toast({ title: "Payment Error", description: err.message, variant: "destructive" }); }
  };

  const handleActivationKey = async () => {
    if (!activationKey.trim()) { toast({ title: "Error", description: "Enter your activation key.", variant: "destructive" }); return; }
    // Validate key in DB
    const { data: keyData, error } = await supabase.from("license_keys").select("*, license_packages(*)").eq("license_key", activationKey.trim().toUpperCase()).eq("status", "unused").maybeSingle();
    if (error || !keyData) { toast({ title: "Invalid Key", description: "This activation key is invalid or already used.", variant: "destructive" }); return; }
    // Key is valid — set the package and proceed
    setSelectedPkg(keyData.package_id || selectedPkg);
    setPaymentStatus("completed");
    setMpesaReceipt(`KEY:${activationKey.trim().toUpperCase()}`);
    toast({ title: "✅ Key Validated!", description: `Package: ${(keyData as any).license_packages?.display_name || "Licensed"}` });
  };

  const updateProvisionStep = (id: string, status: ProvisionStep["status"], detail?: string) => {
    setProvisionSteps(prev => prev.map(s => s.id === id ? { ...s, status, ...(detail ? { detail } : {}) } : s));
  };

  const handleSubmit = async (asTrial: boolean) => {
    console.log("DEBUG handleSubmit", { hospitalName, email, adminFirst, adminLast, adminUsername, adminPassword });
    if (!hospitalName || !email || !adminFirst || !adminLast || !adminUsername || !adminPassword) {
      toast({ title: "Error", description: "Please fill all required fields.", variant: "destructive" }); return;
    }

    setProvisioning(true);
    setProvisionSteps(PROVISION_STEPS.map(s => ({ ...s, status: "pending" as const })));

    try {
      updateProvisionStep("schema", "running");
      if (import.meta.env.MODE !== "test") await new Promise(r => setTimeout(r, 1200));

      const slug = generateSlug(hospitalName);
      const facilityType = selectedFacilityProfile?.key ?? "hospital";
      const hospitalPayload = {
        name: hospitalName,
        slug,
        city,
        phone,
        email,
        address,
        license_package_id: selectedPkg || null,
        license_status: asTrial ? "trial" : "active",
        facility_type: facilityType,
        settings: { facility_type: facilityType },
        ...(asTrial ? {} : { license_started_at: new Date().toISOString() }),
      };

      console.log("DEBUG about to insert hospitals payload:", hospitalPayload);
      let { data: hospital, error: hospErr } = await supabase
        .from("hospitals")
        .insert(hospitalPayload as any)
        .select().single();
      console.log("DEBUG insert result:", { hospital, hospErr });

      // Older production schemas may not yet have the additive facility_type
      // migration. The existing settings JSONB keeps the selected package intact
      // while allowing registration to proceed until the migration is deployed.
      if (hospErr && /facility_type.*(column|schema cache)|column.*facility_type/i.test(hospErr.message || "")) {
        console.warn("hospitals.facility_type is not available yet; persisting the selected facility in hospitals.settings until the migration is applied.");
        const { facility_type: _facilityType, ...legacyPayload } = hospitalPayload;
        const retry = await supabase.from("hospitals").insert(legacyPayload as any).select().single();
        hospital = retry.data;
        hospErr = retry.error;
      }

      if (hospErr) throw hospErr;
      updateProvisionStep("schema", "done", "✅ Hospital infrastructure created");

      // Mark activation key as used if applicable
      if (mpesaReceipt.startsWith("KEY:")) {
        const keyVal = mpesaReceipt.replace("KEY:", "");
        await supabase.from("license_keys").update({ status: "activated", hospital_id: hospital.id, activated_at: new Date().toISOString() } as any).eq("license_key", keyVal);
      }

      // Create admin
      const { data: hashedPw } = await supabase.rpc("hash_password", { raw_password: adminPassword });
      const staffNo = `HA-${Date.now().toString(36).toUpperCase()}`;
      const { error: staffErr } = await supabase.from("staff").insert({
        staff_no: staffNo, username: adminUsername.toLowerCase().trim(), first_name: adminFirst, last_name: adminLast,
        role: "hospital_admin", hospital_id: hospital.id, password_hash: hashedPw, must_change_password: false, is_active: true,
      });
      if (staffErr) throw staffErr;

      // Seed platform defaults with progress
      await seedPlatformDefaults(hospital.id, (stepId, detail) => {
        const mapped: Record<string, string> = { departments: "departments", modules: "modules", dropdowns: "dropdowns", hours: "hours", permissions: "permissions", billing: "billing", complete: "complete" };
        const provId = mapped[stepId];
        if (provId) {
          if (detail.startsWith("✅")) updateProvisionStep(provId, "done", detail);
          else updateProvisionStep(provId, "running", detail);
        }
      }, selectedFacilityProfile?.key ?? "hospital");

      await supabase.from("license_audit_log").insert({
        hospital_id: hospital.id,
        action: asTrial ? "HOSPITAL_CREATED_TRIAL" : "HOSPITAL_CREATED_PAID",
        details: `Hospital "${hospitalName}" registered. ${!asTrial ? `Payment: ${mpesaReceipt}` : "14-day trial"}`,
      });

      updateProvisionStep("complete", "done", "✅ Hospital is ready!");
      if (import.meta.env.MODE !== "test") await new Promise(r => setTimeout(r, 2000));
      setProvisionComplete(true);

      toast({ title: "🎉 Hospital Registered!", description: `${hospitalName} is ready. Log in with username: ${adminUsername}` });
    } catch (err: any) {
      console.error(err);
      setProvisionSteps(prev => prev.map(s => s.status === "running" ? { ...s, status: "error", detail: err.message } : s));
      toast({ title: "Registration Failed", description: err.message || "Something went wrong.", variant: "destructive" });
    }
  };

  // ─── SCREEN: Provisioning ───
  if (provisioning) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img src={constructImg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-sm" />
        </div>
        <Particles />

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="max-w-xl w-full">
            <div className="text-center mb-10">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-black text-3xl mb-6 shadow-2xl shadow-primary/30 animate-pulse">
                B
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {provisionComplete ? "🎉 Hospital Ready!" : "Building Your Hospital"}
              </h2>
              <p className="text-slate-400 text-sm">
                {provisionComplete
                  ? `${hospitalName} has been successfully set up with all modules and data.`
                  : "Constructing your dedicated digital infrastructure. Please wait..."}
              </p>
              <ECGLine />
            </div>

            <div className="space-y-2.5">
              {provisionSteps.map((ps, idx) => (
                <div
                  key={ps.id}
                  className={`flex items-center gap-4 rounded-xl border p-4 transition-all duration-700 ${
                    ps.status === "done" ? "bg-emerald-500/10 border-emerald-500/30 translate-x-0" :
                    ps.status === "running" ? "bg-primary/10 border-primary/40 shadow-lg shadow-primary/20 scale-[1.02]" :
                    ps.status === "error" ? "bg-red-500/10 border-red-500/30" :
                    "bg-white/5 border-white/10 opacity-40"
                  }`}
                  style={{ transitionDelay: `${idx * 50}ms` }}
                >
                  <div className="shrink-0">
                    {ps.status === "done" ? (
                      <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    ) : ps.status === "running" ? (
                      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    ) : ps.status === "error" ? (
                      <div className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center">
                        <XCircle className="h-4 w-4 text-white" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full border-2 border-white/20 flex items-center justify-center text-white/30">
                        {ps.icon}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${
                      ps.status === "done" ? "text-emerald-400" :
                      ps.status === "running" ? "text-white" :
                      ps.status === "error" ? "text-red-400" : "text-slate-500"
                    }`}>
                      {ps.label}
                    </p>
                    <p className={`text-xs ${ps.status === "running" ? "text-slate-300" : "text-slate-500"}`}>{ps.detail}</p>
                  </div>
                  {ps.status === "running" && (
                    <div className="flex gap-1 items-center shrink-0">
                      {[0,1,2].map(i => <div key={i} className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />)}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {provisionComplete && (
              <div className="mt-8 text-center animate-fade-in">
                <Button size="lg" className="gap-2 h-14 px-10 text-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-2xl shadow-emerald-500/30" onClick={() => navigate("/login")}>
                  <Rocket className="h-5 w-5" /> Launch Application
                </Button>
              </div>
            )}

            {provisionSteps.some(s => s.status === "error") && (
              <div className="mt-6 text-center">
                <Button variant="outline" onClick={() => { setProvisioning(false); setProvisionSteps([]); }} className="text-white border-white/20">
                  ← Try Again
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── SCREEN 0: Welcome Splash ───
  if (step === 0) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="" className="w-full h-full object-cover" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-slate-900/40" />
        </div>
        <Particles />

        <div className={`relative z-10 min-h-screen flex flex-col items-center justify-center p-6 transition-all duration-1000 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="text-center max-w-2xl">
            {/* Logo with heartbeat */}
            <div className="inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-black text-4xl mb-8 shadow-2xl shadow-primary/40 animate-pulse">
              B
            </div>

            <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight">
              Bright<span className="text-primary">Care</span>
            </h1>
            <p className="text-xl text-slate-300 mb-2 font-medium">Healthcare Management Platform</p>
            <p className="text-slate-400 text-sm mb-10 max-w-lg mx-auto">
              Step into the digital future of healthcare. A complete ecosystem for hospitals, clinics, and pharmacies — built for Africa.
            </p>

            <ECGLine />

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Button size="lg" className="gap-2 h-14 px-8 text-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-2xl shadow-primary/30" onClick={() => setStep(1)}>
                Get Started <ArrowRight className="h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="gap-2 h-14 px-8 text-lg border-white/20 text-white hover:bg-white/10" onClick={() => navigate("/login")}>
                Sign In <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-3 mt-12">
              {[
                { icon: <Stethoscope className="h-3.5 w-3.5" />, label: "90+ Modules" },
                { icon: <Shield className="h-3.5 w-3.5" />, label: "HIPAA Ready" },
                { icon: <Zap className="h-3.5 w-3.5" />, label: "Offline Support" },
                { icon: <Phone className="h-3.5 w-3.5" />, label: "M-Pesa Integrated" },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 text-white/80 text-xs font-medium border border-white/10">
                  {f.icon} {f.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalSteps = 6;
  const stepLabels = ["Agreement", "Facility", "License", "Organization", "Admin", "Activate"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
      <Particles />

      {/* Header */}
      <div className="relative z-10 border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-black text-lg flex items-center justify-center shadow-lg shadow-primary/20">B</div>
            <div><h1 className="font-bold text-lg text-white">BrightCare</h1><p className="text-xs text-slate-400">Facility Registration</p></div>
          </div>
          <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white" onClick={() => navigate("/login")}>Already have an account? Sign in</Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 pt-8">
        <div className="flex items-center justify-center gap-1 mb-8">
          {stepLabels.map((label, i) => {
            const s = i + 1;
            return (
              <div key={s} className="flex items-center gap-1">
                <div className="flex flex-col items-center gap-1">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                    step >= s
                      ? "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/30"
                      : "bg-white/10 text-slate-500 border border-white/10"
                  }`}>
                    {step > s ? <Check className="h-4 w-4" /> : s}
                  </div>
                  <span className={`text-[10px] font-medium ${step >= s ? "text-primary" : "text-slate-500"}`}>{label}</span>
                </div>
                {s < totalSteps && (
                  <div className={`w-16 h-0.5 mb-4 transition-all duration-500 ${step > s ? "bg-primary shadow-sm shadow-primary/50" : "bg-white/10"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 pb-16">
        {/* Step 1: License Agreement */}
        {step === 1 && (
          <div className="animate-fade-in max-w-3xl mx-auto">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm overflow-hidden">
              <div className="grid md:grid-cols-[1.1fr_0.9fr]">
                <div className="p-6 md:p-8 space-y-5">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary mb-4">
                      <Shield className="h-3.5 w-3.5" /> License Agreement
                    </div>
                    <h2 className="text-3xl font-bold text-white">Review and accept the BrightCare terms</h2>
                    <p className="text-slate-400 mt-2">Please review our terms carefully before proceeding.</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5 max-h-[320px] overflow-y-auto space-y-4 text-sm text-slate-300">
                    <div><p className="font-semibold text-white mb-1">1. Acceptance of Terms</p><p>These Terms of Service constitute a legally binding agreement between Brightech Publishers Ltd. ("Brightcare", "we", "us", "our") and you, the individual or legal entity ("Client", "you", "your") that accesses or uses our Hospital Management System and Electronic Health Record platform. If you are entering into this Agreement on behalf of a company, hospital, clinic, or other legal entity, you represent that you have the authority to bind that entity to these Terms.</p></div>
                    <div><p className="font-semibold text-white mb-1">2. Eligibility</p><p>You must be at least 18 years of age and a legally registered healthcare organization, clinic, hospital, or duly authorized representative thereof. Your use must comply with all applicable local, national, and international laws, including healthcare regulations in your jurisdiction. Brightcare reserves the right to verify eligibility and decline or revoke access at its discretion.</p></div>
                    <div><p className="font-semibold text-white mb-1">3. Account Registration & Security</p><p>You must provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of all login credentials and must immediately notify Brightcare of any unauthorized access. Sharing credentials between users is prohibited. Each user must have their own login. The designated Administrator is responsible for managing role-based access permissions and ensuring all Authorized Users comply with these Terms.</p></div>
                    <div><p className="font-semibold text-white mb-1">4. Description of Services</p><p>Brightcare provides a cloud-based and offline-capable Hospital Management System including patient management, appointment scheduling, electronic health records, billing & invoicing, pharmacy management, laboratory integration, inpatient ward management, analytics & reporting, and multi-location support. Brightcare reserves the right to modify, add, or discontinue features at any time with reasonable notice. Medical Disclaimer: Brightcare is a healthcare administration platform and is not a substitute for professional medical judgment, diagnosis, or treatment.</p></div>
                    <div><p className="font-semibold text-white mb-1">5. Subscriptions & Payment</p><p>Subscriptions are billed in advance on a monthly or annual basis. We offer a 14-day free trial on eligible plans — no credit card required. All fees are non-refundable except as stated in our Refund Policy. Prices may change with at least 30 days' advance notice. All fees are exclusive of applicable taxes. Accounts with payment overdue for more than 60 days may be suspended or terminated.</p></div>
                    <div><p className="font-semibold text-white mb-1">6. Acceptable Use Policy</p><p>You agree to use Brightcare only for lawful purposes. Prohibited activities include: unauthorized access, data misuse, reverse engineering, uploading malware, automated scraping, resale without authorization, identity impersonation, and regulatory violations. Violations may result in immediate suspension or termination without refund.</p></div>
                    <div><p className="font-semibold text-white mb-1">7. Data Ownership & Processing</p><p>Your data belongs to you. Brightcare does not claim ownership over any data you submit. The Client is the Data Controller; Brightcare acts solely as a Data Processor. You may export your data at any time. Brightcare will never sell, rent, or monetize Client data or Patient Data to any third party.</p></div>
                    <div><p className="font-semibold text-white mb-1">8. Intellectual Property</p><p>The Brightcare Platform, including its software, source code, UI, design, algorithms, and branding, are the exclusive intellectual property of Brightech Publishers Ltd. Your subscription grants a limited, non-exclusive, non-transferable, revocable license to use the Platform for your organization's internal healthcare operations.</p></div>
                    <div><p className="font-semibold text-white mb-1">9. Confidentiality</p><p>Each party agrees to maintain confidentiality of the other party's Confidential Information. This obligation survives termination for five (5) years, except for trade secrets which are protected indefinitely.</p></div>
                    <div><p className="font-semibold text-white mb-1">10. Uptime & Support</p><p>Brightcare targets 99.9% platform uptime monthly. Routine maintenance is performed during low-traffic periods with at least 24 hours' advance notice. Support response times vary by plan: Basic (48 hours), Standard (8 hours), Premium (2 hours, 24/7 for critical issues).</p></div>
                    <div><p className="font-semibold text-white mb-1">11. Disclaimers</p><p>THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. Brightcare does not provide medical, clinical, legal, or regulatory advice. All clinical decisions are the sole responsibility of licensed healthcare professionals.</p></div>
                    <div><p className="font-semibold text-white mb-1">12. Limitation of Liability</p><p>Brightcare's total liability shall not exceed the total fees paid in the twelve (12) months preceding the claim or USD $100, whichever is greater. This applies regardless of the form of action.</p></div>
                    <div><p className="font-semibold text-white mb-1">13. Termination</p><p>You may cancel your subscription at any time through your account settings. Brightcare may suspend or terminate access immediately for material breach, prohibited activities, payment overdue beyond 60 days, or legal compliance requirements. Upon termination, data remains accessible for export for 30 days before secure deletion.</p></div>
                    <div><p className="font-semibold text-white mb-1">14. Governing Law</p><p>These Terms are governed by the laws of the jurisdiction in which Brightech Publishers Ltd. is incorporated. Disputes shall first be resolved through good-faith negotiation for at least 30 days, then binding arbitration if unresolved.</p></div>
                    <div><p className="font-semibold text-white mb-1">15. Offline Desktop Mode</p><p>The Brightcare desktop application stores operational data locally using encrypted storage and automatically synchronizes with the cloud once internet connectivity returns. Offline mode provides full functionality for critical hospital operations.</p></div>
                    <div><p className="font-semibold text-white mb-1">16. Changes to Terms</p><p>Brightcare reserves the right to update these Terms at any time with at least 14 days' advance notice for material changes. Continued use after changes become effective constitutes acceptance. If you do not agree, you must stop using the Platform before the effective date.</p></div>
                  </div>

                  <button type="button" onClick={() => setAcceptedTerms(v => !v)} className={`w-full rounded-xl border p-4 text-left transition-all ${acceptedTerms ? "border-emerald-400/40 bg-emerald-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border ${acceptedTerms ? "border-emerald-400 bg-emerald-500 text-white" : "border-white/20"}`}>
                        {acceptedTerms && <Check className="h-3.5 w-3.5" />}
                      </div>
                      <div>
                        <p className="font-semibold text-white">I accept the BrightCare Terms of Service</p>
                        <p className="text-xs text-slate-400 mt-1">By accepting, you agree to the terms and conditions outlined above.</p>
                      </div>
                    </div>
                  </button>

                  <div className="flex gap-3 pt-1">
                    <Button variant="outline" onClick={() => setStep(0)} className="gap-1 border-white/10 text-slate-300 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back</Button>
                    <Button className="flex-1 gap-1 bg-gradient-to-r from-primary to-primary/80" disabled={!acceptedTerms} onClick={() => setStep(2)}>Continue <ArrowRight className="h-4 w-4" /></Button>
                  </div>
                </div>

                <div className="relative min-h-[320px] border-l border-white/10 bg-gradient-to-br from-primary/15 via-transparent to-transparent p-6 flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/80">
                      <Sparkles className="h-3.5 w-3.5 text-primary" /> Compliance Seal
                    </div>
                    <div className={`mt-8 mx-auto flex h-40 w-40 items-center justify-center rounded-full border transition-all duration-500 ${acceptedTerms ? "border-primary/50 bg-primary/15 shadow-2xl shadow-primary/30" : "border-white/10 bg-white/5"}`}>
                      <div className={`flex h-28 w-28 items-center justify-center rounded-full border ${acceptedTerms ? "border-primary/50 text-primary animate-pulse" : "border-white/10 text-slate-600"}`}>
                        <Shield className="h-12 w-12" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-slate-300">
                    <p className="font-semibold text-white">Setup progress</p>
                    {['Terms & Conditions', 'Facility Type', 'License Plan', 'Organization Details', 'Admin Account', 'Activate'].map((item) => (
                      <div key={item} className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-primary" /><span>{item}</span></div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Step 2: Select the facility configuration, independently of billing */}
        {step === 2 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white">Select Your Facility Type</h2>
              <p className="text-slate-400 mt-2">This configures Brightcare workflows and navigation. Your license plan is selected separately next.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {FACILITY_ORDER.map((facilityKey) => {
                const facility = FACILITY_PACKAGES[facilityKey];
                const FacilityIcon = facility.icon;
                const selected = selectedFacilityType === facility.key;
                return (
                  <button type="button" key={facility.key} aria-pressed={selected}
                    className={`relative rounded-2xl border p-6 text-left transition-all duration-300 hover:-translate-y-1 ${selected ? "border-primary/70 bg-gradient-to-br from-primary/20 to-primary/5 shadow-xl ring-1 ring-primary/50" : "border-white/10 bg-white/5 hover:border-white/25"}`}
                    onClick={() => setSelectedFacilityType(facility.key)}>
                    {selected && <CheckCircle2 className="absolute right-5 top-5 h-5 w-5 text-emerald-400" />}
                    <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${FACILITY_COLORS[facilityKey]} text-white flex items-center justify-center mb-5 shadow-lg`}>
                      <FacilityIcon className="h-7 w-7" />
                    </div>
                    <h3 className="text-xl font-bold text-white">{facility.label}</h3>
                    <p className="text-sm font-medium text-primary mt-1">{facility.tagline}</p>
                    <p className="text-sm text-slate-400 mt-3 min-h-16">{facility.description}</p>
                    <ul className="space-y-2 mt-4 text-sm text-slate-300">
                      {facility.highlights.map((highlight) => <li key={highlight} className="flex items-start gap-2"><Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" /><span>{highlight}</span></li>)}
                    </ul>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-center mt-8 gap-3">
              <Button size="lg" variant="outline" className="gap-2 h-12 border-white/10 text-slate-300 hover:text-white" onClick={() => setStep(1)}><ArrowLeft className="h-4 w-4" /> Back</Button>
              <Button size="lg" className="gap-2 h-12" onClick={() => setStep(3)} disabled={!selectedFacilityType}>Continue <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {/* Step 3: Select a license tier; it does not determine facility type */}
        {step === 3 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white">Choose Your License Plan</h2>
              <p className="text-slate-400 mt-2">{selectedFacilityProfile?.label} selected. Choose a billing tier; the 14-day trial remains available at activation.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {packages.map((pkg) => {
                const TierIcon = Sparkles;
                return (
                  <button type="button" key={pkg.id} aria-pressed={selectedPkg === pkg.id}
                    className={`relative rounded-2xl border p-1 text-left transition-all duration-300 hover:scale-[1.02] ${selectedPkg === pkg.id ? "border-primary/50 bg-gradient-to-br from-primary/20 to-primary/5 shadow-xl scale-[1.02]" : "border-white/10 bg-white/5 hover:border-white/20"}`}
                    onClick={() => setSelectedPkg(pkg.id)}>
                    {pkg.name === "premium" && <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10"><Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"><Star className="h-3 w-3 mr-1" /> Most Popular</Badge></div>}
                    <div className="p-5 rounded-xl">
                      <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${TIER_COLORS[pkg.name] || "from-slate-500 to-slate-700"} text-white flex items-center justify-center mb-4 shadow-lg`}>{TIER_ICONS[pkg.name] || <TierIcon className="h-7 w-7" />}</div>
                      <h3 className="text-xl font-bold text-white">{pkg.display_name}</h3>
                      <p className="text-xs text-slate-400 mt-1">{TIER_TAGLINES[pkg.name] || pkg.description}</p>
                      <div className="mt-4 mb-1"><span className="text-3xl font-black text-white">KES {(pkg.price_yearly || 0).toLocaleString()}</span><span className="text-slate-400 text-sm">/year</span></div>
                      <p className="text-xs text-slate-500 mb-1">≈ ${((pkg.price_yearly || 0) / 130).toFixed(0)} USD</p>
                      <p className="text-xs text-slate-500 mb-4">+ KES {(pkg.maintenance_monthly || pkg.price_monthly || 3000).toLocaleString()}/mo maintenance</p>
                      {pkg.price_lifetime && <div className="mb-4"><Badge variant="outline" className="gap-1 border-amber-500/30 text-amber-400"><Crown className="h-3 w-3" /> Lifetime: KES {pkg.price_lifetime.toLocaleString()}</Badge></div>}
                      <ul className="space-y-2 text-sm text-slate-300">{(TIER_FEATURES[pkg.name] || pkg.allowed_modules || []).slice(0, 6).map((feature) => <li key={feature} className="flex items-start gap-2"><Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" /><span>{feature}</span></li>)}</ul>
                    </div>
                  </button>
                );
              })}
            </div>
            {packages.length === 0 && <p className="text-center text-slate-400 mt-6">License plans could not be loaded. You can still continue with a free trial.</p>}
            <div className="flex justify-center mt-8 gap-3">
              <Button size="lg" variant="outline" className="gap-2 h-12 border-white/10 text-slate-300 hover:text-white" onClick={() => setStep(2)}><ArrowLeft className="h-4 w-4" /> Back</Button>
              <Button size="lg" className="gap-2 h-12" onClick={() => setStep(4)} disabled={!selectedPkg}>Continue <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {/* Step 4: Organization details */}
        {step === 4 && (
          <div className="animate-fade-in max-w-lg mx-auto">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader><CardTitle className="flex items-center gap-2 text-white"><Building2 className="h-5 w-5 text-primary" /> Organization Details</CardTitle><CardDescription className="text-slate-400">Tell us about your {selectedFacilityProfile?.label.toLowerCase() ?? "facility"}</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div><Label className="text-slate-300">Organization Name *</Label><Input value={hospitalName} onChange={e => setHospitalName(e.target.value)} placeholder={selectedFacilityType === "herbal" ? "e.g. Greenleaf Herbal Clinic" : selectedFacilityType === "clinic" ? "e.g. City Medical Clinic" : "e.g. City General Hospital"} className="bg-white/10 border-white/10 text-white placeholder:text-slate-500" /></div>
                <div className="grid grid-cols-2 gap-3"><div><Label className="text-slate-300">City</Label><Input value={city} onChange={e => setCity(e.target.value)} placeholder="Nairobi" className="bg-white/10 border-white/10 text-white placeholder:text-slate-500" /></div><div><Label className="text-slate-300">Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254..." className="bg-white/10 border-white/10 text-white placeholder:text-slate-500" /></div></div>
                <div><Label className="text-slate-300">Email *</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com" className="bg-white/10 border-white/10 text-white placeholder:text-slate-500" /></div>
                <div><Label className="text-slate-300">Address</Label><Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Full address" className="bg-white/10 border-white/10 text-white placeholder:text-slate-500" /></div>
                <div className="flex gap-3 pt-2"><Button variant="outline" onClick={() => setStep(3)} className="gap-1 border-white/10 text-slate-300 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back</Button><Button className="flex-1 gap-1" onClick={() => { if (!hospitalName || !email) { toast({ title: "Error", description: "Organization name and email are required.", variant: "destructive" }); return; } setStep(5); }}>Continue <ArrowRight className="h-4 w-4" /></Button></div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 5: Primary administrator */}
        {step === 5 && (
          <div className="animate-fade-in max-w-lg mx-auto">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader><CardTitle className="flex items-center gap-2 text-white"><Users className="h-5 w-5 text-primary" /> Create Primary Administrator</CardTitle><CardDescription className="text-slate-400">Administrator for {hospitalName}</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3"><div><Label className="text-slate-300">First Name *</Label><Input value={adminFirst} onChange={e => setAdminFirst(e.target.value)} placeholder="John" className="bg-white/10 border-white/10 text-white placeholder:text-slate-500" /></div><div><Label className="text-slate-300">Last Name *</Label><Input value={adminLast} onChange={e => setAdminLast(e.target.value)} placeholder="Doe" className="bg-white/10 border-white/10 text-white placeholder:text-slate-500" /></div></div>
                <div><Label className="text-slate-300">Username *</Label><Input value={adminUsername} onChange={e => setAdminUsername(e.target.value)} placeholder="john.doe" className="bg-white/10 border-white/10 text-white placeholder:text-slate-500" /></div>
                <div><Label className="text-slate-300">Password *</Label><Input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="Min. 8 characters" className="bg-white/10 border-white/10 text-white placeholder:text-slate-500" /></div>
                <div className="text-xs space-y-1"><p className={adminPassword.length >= 8 ? "text-emerald-400" : "text-slate-500"}>✓ At least 8 characters</p><p className={/[A-Z]/.test(adminPassword) ? "text-emerald-400" : "text-slate-500"}>✓ At least one uppercase letter</p><p className={/[0-9]/.test(adminPassword) ? "text-emerald-400" : "text-slate-500"}>✓ At least one number</p></div>
                <div className="flex gap-3 pt-2"><Button variant="outline" onClick={() => setStep(4)} className="gap-1 border-white/10 text-slate-300 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back</Button><Button className="flex-1 gap-1" onClick={() => { if (!adminFirst || !adminLast || !adminUsername || !adminPassword) { toast({ title: "Error", description: "All fields are required.", variant: "destructive" }); return; } if (adminPassword.length < 8) { toast({ title: "Error", description: "Password must be at least 8 characters.", variant: "destructive" }); return; } setStep(6); }}>Continue to Activation <ArrowRight className="h-4 w-4" /></Button></div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 6: Payment / activation */}
        {step === 6 && (
          <div className="animate-fade-in max-w-lg mx-auto">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader><CardTitle className="flex items-center gap-2 text-white"><Rocket className="h-5 w-5 text-primary" /> Activate Your License</CardTitle><CardDescription className="text-slate-400">Pay via M-Pesa, use an activation key, or start a free trial</CardDescription></CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2 text-sm">
                  <p className="font-bold text-base text-white">📋 Setup Summary</p>
                  <div className="flex justify-between"><span className="text-slate-400">Facility type</span><span className="font-medium text-white">{selectedFacilityProfile?.label}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">License plan</span><span className="font-medium text-white">{selectedPackage?.display_name}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Organization</span><span className="font-medium text-white">{hospitalName}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Administrator</span><span className="font-medium text-white">{adminFirst} {adminLast}</span></div>
                  <div className="border-t border-white/10 pt-2 flex justify-between text-base"><span className="font-bold text-white">Annual License</span><span className="font-black text-primary">KES {(selectedPackage?.price_yearly || 0).toLocaleString()}</span></div>
                </div>

                {paymentStatus === "idle" || paymentStatus === "failed" ? (
                  <div className="space-y-4">
                    <div className="flex rounded-xl border border-white/10 overflow-hidden">
                      <button className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 ${activationMode === "payment" ? "bg-primary text-primary-foreground" : "bg-white/5 text-slate-400 hover:text-white"}`} onClick={() => setActivationMode("payment")}><Phone className="h-4 w-4" /> M-Pesa Payment</button>
                      <button className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 ${activationMode === "key" ? "bg-primary text-primary-foreground" : "bg-white/5 text-slate-400 hover:text-white"}`} onClick={() => setActivationMode("key")}><KeyRound className="h-4 w-4" /> Activation Key</button>
                    </div>
                    {activationMode === "payment" ? <div className="space-y-3"><div><Label className="text-slate-300">M-Pesa Phone Number</Label><Input value={paymentPhone} onChange={e => setPaymentPhone(e.target.value)} placeholder="254712345678" className="mt-1 bg-white/10 border-white/10 text-white placeholder:text-slate-500" /><p className="text-xs text-slate-500 mt-1">Enter the number to receive the STK push</p></div><Button className="w-full gap-2 h-12" onClick={handleMpesaPayment}><Phone className="h-5 w-5" /> Pay KES {(selectedPackage?.price_yearly || 0).toLocaleString()} via M-Pesa</Button></div> : <div className="space-y-3"><div><Label className="text-slate-300">Activation Key</Label><Input value={activationKey} onChange={e => setActivationKey(e.target.value)} placeholder="XXXX-XXXX-XXXX-XXXX" className="mt-1 bg-white/10 border-white/10 text-white font-mono tracking-wider" /></div><Button className="w-full gap-2 h-12" onClick={handleActivationKey}><KeyRound className="h-5 w-5" /> Validate & Activate</Button></div>}
                    <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-800 px-3 text-slate-500">or</span></div></div>
                    <Button variant="outline" className="w-full gap-2 border-white/10 text-slate-300 hover:text-white" onClick={() => handleSubmit(true)} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />} Start 14-Day Free Trial</Button>
                  </div>
                ) : paymentStatus === "sending" || paymentStatus === "polling" ? (
                  <div className="flex flex-col items-center gap-4 py-10"><Loader2 className="h-14 w-14 animate-spin text-primary" /><p className="text-lg font-semibold text-white">{paymentStatus === "sending" ? "Sending STK Push..." : `Waiting for payment... (${pollAttempts})`}</p>{paymentStatus === "polling" && <Button variant="ghost" size="sm" className="text-slate-400" onClick={() => { cancelPoll?.(); setPaymentStatus("failed"); }}>Cancel</Button>}</div>
                ) : paymentStatus === "completed" ? (
                  <div className="flex flex-col items-center gap-4 py-10"><div className="h-20 w-20 rounded-full bg-emerald-500/20 flex items-center justify-center border-2 border-emerald-500/40"><CheckCircle2 className="h-12 w-12 text-emerald-400" /></div><p className="text-lg font-bold text-emerald-400">Activation Successful</p>{mpesaReceipt && <p className="text-sm text-slate-400">Receipt: <strong className="text-white">{mpesaReceipt.startsWith("KEY:") ? "License key" : mpesaReceipt}</strong></p>}<Button className="w-full gap-2 h-14 text-lg" onClick={() => handleSubmit(false)} disabled={loading}>{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Rocket className="h-5 w-5" />} Create {selectedFacilityProfile?.label}</Button></div>
                ) : null}
                <div className="pt-2"><Button variant="ghost" onClick={() => { cancelPoll?.(); setPaymentStatus("idle"); setStep(5); }} className="gap-1 text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back</Button></div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
