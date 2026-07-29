import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AIAssistant } from "@/components/AIAssistant";
import { NotificationPopup } from "@/components/NotificationPopup";
import { Search, Wifi, WifiOff, Bot, RefreshCw, CloudOff, AlertTriangle } from "lucide-react";
import { GlobalSearch } from "@/components/GlobalSearch";
import { Badge } from "@/components/ui/badge";
import { useState, memo, createContext, useContext } from "react";
import { useConnectivity } from "@/hooks/useConnectivity";
import { useAuth } from "@/contexts/AuthContext";
import { useHospital } from "@/contexts/HospitalContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Outlet, useNavigate } from "react-router-dom";
import { MpesaPaymentModal } from "@/components/payments/MpesaPaymentModal";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useToast } from "@/hooks/use-toast";

// Context to detect if we're inside AppShell already
const ShellContext = createContext(false);
export const useIsInShell = () => useContext(ShellContext);

interface AppLayoutProps {
  children?: React.ReactNode;
  title?: string;
}

const ADMIN_ROLES = ["hospital_admin", "super_admin", "platform_admin"];

const HeaderBar = memo(function HeaderBar({ title }: { title?: string }) {
  const { online, pendingCount, syncing, lastSynced, triggerSync } = useConnectivity();
  const { staff } = useAuth();
  const isAdmin = staff?.role ? ADMIN_ROLES.includes(staff.role) : false;
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <>
      <header className="h-12 flex items-center justify-between border-b bg-card px-4 shrink-0">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          {title && <h1 className="text-base font-bold">{title}</h1>}
        </div>
        <div className="flex items-center gap-3">
          <GlobalSearch />
          <div className="flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  {online ? (
                    <Badge variant="secondary" className="text-[10px] gap-1 cursor-default">
                      <Wifi className="h-3 w-3 text-success" /> Online
                      {pendingCount > 0 && (
                        <button onClick={triggerSync} className="ml-1" disabled={syncing}>
                          <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
                        </button>
                      )}
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[10px] gap-1 cursor-default">
                      <WifiOff className="h-3 w-3" /> Offline
                      {pendingCount > 0 && <span className="ml-1">({pendingCount})</span>}
                    </Badge>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="text-xs space-y-1">
                  <p>{online ? '✅ Connected to cloud' : '⚠️ Working offline — changes will sync when connected'}</p>
                  {pendingCount > 0 && <p>{pendingCount} pending sync item(s)</p>}
                  {lastSynced && <p>Last synced: {lastSynced.toLocaleTimeString()}</p>}
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
          {isAdmin && (
            <button
              onClick={() => setAiOpen(!aiOpen)}
              className={`relative p-1.5 rounded-lg transition-colors ${aiOpen ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              title="Brightcare AI Assistant"
            >
              <Bot className={`h-4 w-4 ${aiOpen ? "" : "text-muted-foreground"}`} />
              {online && <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success border-2 border-card" />}
              {!online && <CloudOff className="absolute -top-1 -right-1 h-3 w-3 text-destructive" />}
            </button>
          )}
          <NotificationPopup />
          <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
            AD
          </div>
        </div>
      </header>
      <AIAssistant open={aiOpen} onClose={() => setAiOpen(false)} />
    </>
  );
});

/**
 * Persistent shell — wraps all authenticated pages.
 * Sidebar + header stay mounted; only the <Outlet> swaps.
 */
function GracePeriodBanner() {
  const { isInGracePeriod, graceDaysLeft, expiryReason, licensePackage } = useHospital();
  const navigate = useNavigate();

  if (!isInGracePeriod || graceDaysLeft === null) return null;

  const isTrial = expiryReason === "trial_expired";

  return (
    <div className="bg-gradient-to-r from-amber-500/90 to-orange-500/90 text-white px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <p className="text-sm font-medium truncate">
          <span className="font-bold">Grace Period:</span>{" "}
          {graceDaysLeft} day{graceDaysLeft !== 1 ? "s" : ""} remaining.{" "}
          {isTrial
            ? "Your free trial has ended — activate a license to keep all features."
            : `Your ${licensePackage?.display_name ?? "license"} has expired — renew now to avoid lockout.`
          }
        </p>
      </div>
      <button
        onClick={() => navigate("/upgrade")}
        className="shrink-0 px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-all backdrop-blur"
      >
        {isTrial ? "Activate Now" : "Renew Now"}
      </button>
    </div>
  );
}

function MaintenanceBanner() {
  const { maintenanceWarning, maintenanceDaysLeft, maintenanceDue, licensePackage, hospitalId, refreshHospital } = useHospital();
  const [showMpesa, setShowMpesa] = useState(false);
  const { toast } = useToast();

  if (!maintenanceWarning && !maintenanceDue) return null;

  const fee = licensePackage?.maintenance_monthly ?? 3000;

  const handlePaymentSuccess = async (receipt: string) => {
    // Update maintenance_due_at to 3 days from now, record payment
    const newDue = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from("hospitals").update({
      maintenance_due_at: newDue,
      maintenance_last_paid_at: new Date().toISOString(),
    } as any).eq("id", hospitalId);
    toast({ title: "✅ Maintenance Paid", description: `Receipt: ${receipt}. Next due in 3 days.` });
    refreshHospital();
  };

  if (maintenanceDue) {
    return (
      <>
        <div className="bg-gradient-to-r from-red-600/90 to-red-500/90 text-white px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p className="text-sm font-medium truncate">
              <span className="font-bold">Maintenance Overdue!</span>{" "}
              Pay KES {fee.toLocaleString()} to continue using all features.
            </p>
          </div>
          <button
            onClick={() => setShowMpesa(true)}
            className="shrink-0 px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-all backdrop-blur"
          >
            Pay Now
          </button>
        </div>
        <MpesaPaymentModal
          open={showMpesa}
          onClose={() => setShowMpesa(false)}
          amount={fee}
          reference={`MAINT-${hospitalId?.slice(0, 8)}-${Date.now()}`}
          onSuccess={handlePaymentSuccess}
        />
      </>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-r from-amber-500/90 to-yellow-500/90 text-white px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <p className="text-sm font-medium truncate">
            <span className="font-bold">Maintenance Due Soon:</span>{" "}
            {maintenanceDaysLeft} day{maintenanceDaysLeft !== 1 ? "s" : ""} left. Pay KES {fee.toLocaleString()} to avoid service interruption.
          </p>
        </div>
        <button
          onClick={() => setShowMpesa(true)}
          className="shrink-0 px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-all backdrop-blur"
        >
          Pay Now
        </button>
      </div>
      <MpesaPaymentModal
        open={showMpesa}
        onClose={() => setShowMpesa(false)}
        amount={fee}
        reference={`MAINT-${hospitalId?.slice(0, 8)}-${Date.now()}`}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
}

export function AppShell() {
  return (
    <ShellContext.Provider value={true}>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <GracePeriodBanner />
            <MaintenanceBanner />
            <HeaderBar />
            <main className="flex-1 overflow-auto p-4 md:p-5">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ShellContext.Provider>
  );
}

/**
 * Legacy wrapper — when inside AppShell, just renders children (no double sidebar).
 * When standalone, renders the full layout.
 */
export function AppLayout({ children, title }: AppLayoutProps) {
  const isInShell = useIsInShell();
  
  // Inside AppShell — just render children, no wrapper needed
  if (isInShell) {
    return <>{children}</>;
  }

  // Standalone fallback (shouldn't happen with new routing but keeps compatibility)
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <HeaderBar title={title} />
          <main className="flex-1 overflow-auto p-4 md:p-5">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
