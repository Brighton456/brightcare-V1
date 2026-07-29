import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Shield, Eye, EyeOff, LogIn, KeyRound, User, Stethoscope, Activity, Heart, Phone, MessageCircle, Mail } from "lucide-react";
import bgLogin from "@/assets/bg-login.jpg";
import brightcareLogo from "@/assets/brightcare-logo.png";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";

export default function Login() {
  const navigate = useNavigate();
  const { signIn, changePassword } = useAuth();
  const { settings: ps } = usePlatformSettings();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [mustChange, setMustChange] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const handleLogin = async () => {
    if (!username || !password) {
      toast({ title: "Error", description: "Username and password are required.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const res = await signIn(username.trim(), password);
    setLoading(false);
    if (res.error) {
      toast({ title: "Login Failed", description: res.error, variant: "destructive" });
      return;
    }
    if (res.mustChange) {
      setMustChange(true);
      toast({ title: "Password Change Required", description: "Please set a new password to continue." });
      return;
    }
    toast({ title: "Welcome back!" });
    if (res.staff?.role === "platform_admin") {
      navigate("/platform-admin");
    } else {
      navigate("/dashboard");
    }
  };

  const handleChangePassword = async () => {
    if (newPass.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }
    if (!/[A-Z]/.test(newPass)) {
      toast({ title: "Error", description: "Password must contain at least one uppercase letter.", variant: "destructive" });
      return;
    }
    if (!/[0-9]/.test(newPass)) {
      toast({ title: "Error", description: "Password must contain at least one number.", variant: "destructive" });
      return;
    }
    if (newPass !== confirmPass) {
      toast({ title: "Error", description: "Passwords don't match.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const res = await changePassword(newPass);
    setLoading(false);
    if (res.error) {
      toast({ title: "Error", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: "Password Updated", description: "You're all set!" });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Hospital background */}
      <img src={bgLogin} alt="" className="absolute inset-0 w-full h-full object-cover" width={1920} height={1080} />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-primary/30" />

      {/* Floating medical icons */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <Stethoscope className="absolute top-[15%] left-[8%] h-16 w-16 text-white/5 rotate-12" />
        <Heart className="absolute top-[25%] right-[10%] h-12 w-12 text-white/5 -rotate-12" />
        <Activity className="absolute bottom-[20%] left-[12%] h-14 w-14 text-white/5 rotate-6" />
        <Shield className="absolute bottom-[30%] right-[8%] h-10 w-10 text-white/5" />
      </div>

      {/* ECG line */}
      <svg viewBox="0 0 800 40" className="absolute bottom-0 left-0 right-0 w-full h-10 opacity-10" preserveAspectRatio="none">
        <path
          d="M0,20 L120,20 L140,5 L160,35 L180,10 L200,30 L220,20 L400,20 L420,5 L440,35 L460,10 L480,30 L500,20 L680,20 L700,5 L720,35 L740,10 L760,30 L800,20"
          fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5"
        />
      </svg>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src={brightcareLogo} alt="Brightcare" className="h-16 w-16 mx-auto mb-4 drop-shadow-2xl animate-pulse rounded-2xl object-contain" />
          <h1 className="text-2xl font-bold text-white">Brightcare</h1>
          <p className="text-sm text-slate-300 mt-1">Hospital Management & Medical POS</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-6 shadow-2xl">
          {!mustChange ? (
            <>
              <h2 className="text-lg font-bold mb-1 text-white">Staff Login</h2>
              <p className="text-xs text-slate-300 mb-4">Enter your username and password to access the system.</p>

              <div className="space-y-3">
                <div>
                  <Label className="flex items-center gap-1.5 text-slate-200"><User className="h-3.5 w-3.5" /> Username</Label>
                  <Input
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="e.g. admin or john.doe"
                    onKeyDown={e => { if (e.key === "Enter") document.getElementById("pwd-input")?.focus(); }}
                    autoFocus
                    autoComplete="username"
                    className="bg-white/10 border-white/10 text-white placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-1.5 text-slate-200"><KeyRound className="h-3.5 w-3.5" /> Password</Label>
                  <div className="relative">
                    <Input
                      id="pwd-input"
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      onKeyDown={e => { if (e.key === "Enter") handleLogin(); }}
                      autoComplete="current-password"
                      className="bg-white/10 border-white/10 text-white placeholder:text-slate-400"
                    />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" onClick={() => setShowPass(!showPass)}>
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/20" onClick={handleLogin} disabled={loading}>
                  <LogIn className="h-4 w-4" />
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </div>

              <div className="mt-4 rounded-lg bg-white/5 border border-white/10 p-3 text-[11px] text-slate-300">
                <p className="font-semibold mb-1 text-white">Need access?</p>
                <p>Contact your hospital administrator for login credentials.</p>
                <p className="mt-1 italic text-slate-400">First-time users will be asked to set a new password.</p>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold mb-1 text-white">Set New Password</h2>
              <p className="text-xs text-slate-300 mb-4">Your password must be changed before continuing.</p>

              <div className="space-y-3">
                <div>
                  <Label className="text-slate-200">New Password</Label>
                  <Input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Min. 8 chars, 1 uppercase, 1 number" autoFocus className="bg-white/10 border-white/10 text-white placeholder:text-slate-400" />
                </div>
                <div>
                  <Label className="text-slate-200">Confirm Password</Label>
                  <Input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Re-enter new password"
                    onKeyDown={e => { if (e.key === "Enter") handleChangePassword(); }} className="bg-white/10 border-white/10 text-white placeholder:text-slate-400" />
                </div>

                <div className="text-[11px] space-y-0.5">
                  <p className={newPass.length >= 8 ? "text-emerald-400" : "text-slate-400"}>✓ At least 8 characters</p>
                  <p className={/[A-Z]/.test(newPass) ? "text-emerald-400" : "text-slate-400"}>✓ At least one uppercase letter</p>
                  <p className={/[0-9]/.test(newPass) ? "text-emerald-400" : "text-slate-400"}>✓ At least one number</p>
                  <p className={newPass && newPass === confirmPass ? "text-emerald-400" : "text-slate-400"}>✓ Passwords match</p>
                </div>

                <Button className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80" onClick={handleChangePassword} disabled={loading}>
                  <KeyRound className="h-4 w-4" />
                  {loading ? "Updating..." : "Set Password & Continue"}
                </Button>
              </div>
            </>
          )}

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Shield className="h-3.5 w-3.5" />
            <span>Secured by Brightcare · Role-Based Access Control</span>
          </div>
        </div>

        <div className="text-center mt-4">
          <button onClick={() => navigate("/register")} className="text-sm text-primary hover:underline font-medium">
            Register a new hospital →
          </button>
        </div>

        {/* Customer Care Support Tags */}
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <a href={`mailto:${ps.support_email}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-slate-300 text-[11px] hover:bg-white/20 transition-all border border-white/10">
            <Mail className="h-3 w-3" /> {ps.support_email}
          </a>
          <a href={`tel:${ps.support_phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-slate-300 text-[11px] hover:bg-white/20 transition-all border border-white/10">
            <Phone className="h-3 w-3" /> {ps.support_phone}
          </a>
          <a href={`tel:${ps.support_phone_2.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-slate-300 text-[11px] hover:bg-white/20 transition-all border border-white/10">
            <Phone className="h-3 w-3" /> {ps.support_phone_2}
          </a>
          <a href={`https://wa.me/${ps.whatsapp_number.replace(/[\s+]/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-sm text-emerald-300 text-[11px] hover:bg-emerald-500/30 transition-all border border-emerald-500/20">
            <MessageCircle className="h-3 w-3" /> WhatsApp Support
          </a>
        </div>

        <p className="text-center text-[10px] text-slate-400 mt-3">
          © {new Date().getFullYear()} Brightcare by Brightech Publishers. All rights reserved.
        </p>
      </div>
    </div>
  );
}
