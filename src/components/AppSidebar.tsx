import {
  LayoutDashboard, ShoppingCart, Package, Pill, BarChart3, Shield, Settings, LogOut,
  History, Calendar, Users, Truck, Stethoscope, FlaskConical, CreditCard, CalendarCheck,
  UserPlus, Heart, Bed, FileText, ClipboardList, Scissors, Siren, Video, Dumbbell,
  Droplet, Image, Apple, Archive, Award, Activity, Clock, AlertTriangle, Utensils,
  DollarSign, RotateCcw, ChevronDown, Star, Wrench, Receipt, Bell, UserCheck, Wallet,
  MessageSquare, Calculator, BookOpen, ArrowRightLeft, Pill as PillIcon, Bug, FileSignature,
  Timer, Layers, Phone, MessageCircle, Brain, Gauge,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import brightcareLogo from "@/assets/brightcare-logo.png";
import { usePermissions } from "@/hooks/usePermissions";
import { useModuleSettings } from "@/hooks/useModuleSettings";
import { canAccessRoute } from "@/lib/routePermissions";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const sections = [
  {
    label: "Hospital", items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Patients", url: "/patients", icon: Heart },
      { title: "Appointments", url: "/appointments", icon: CalendarCheck },
      { title: "Patient History", url: "/patient-history", icon: Archive },
      { title: "Medical Records", url: "/medical-records", icon: FileText },
      { title: "Wait Times", url: "/wait-times", icon: Timer },
      { title: "Patient Education", url: "/patient-education", icon: BookOpen },
      { title: "Patient Feedback", url: "/patient-feedback", icon: Star },
    ],
  },
  {
    label: "Doctor & Consultation", items: [
      { title: "Doctor Console", url: "/doctor", icon: Stethoscope },
      { title: "Patient Queue", url: "/patient-queue", icon: Users },
      { title: "Prescriptions", url: "/prescriptions", icon: Pill },
      { title: "Clinical Notes", url: "/clinical-notes", icon: FileText },
      { title: "Treatment Plans", url: "/treatment-plans", icon: ClipboardList },
      { title: "Follow-up", url: "/follow-up", icon: CalendarCheck },
      { title: "Drug Interactions", url: "/drug-interactions", icon: AlertTriangle },
      { title: "Referrals", url: "/referrals", icon: ArrowRightLeft },
      { title: "Consent Forms", url: "/consent-management", icon: FileSignature },
      { title: "Consultation Analytics", url: "/consultation-analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Laboratory", items: [
      { title: "Lab Dashboard", url: "/laboratory", icon: FlaskConical },
      { title: "Pending Tests", url: "/lab-pending", icon: Clock },
      { title: "Enter Results", url: "/lab-results", icon: FlaskConical },
      { title: "Lab Consumables", url: "/lab-consumables", icon: Package },
      { title: "Service Bundles", url: "/lab-service-bundles", icon: FlaskConical },
      { title: "Quality Control", url: "/lab-quality", icon: Shield },
    ],
  },
  {
    label: "Billing & Payments", items: [
      { title: "Billing", url: "/billing", icon: CreditCard },
      { title: "Create Bill", url: "/create-bill", icon: Receipt },
      { title: "Process Payment", url: "/process-payment", icon: DollarSign },
      { title: "Insurance Claims", url: "/insurance-claims", icon: Shield },
      { title: "Refunds", url: "/refunds", icon: RotateCcw },
      { title: "Outstanding", url: "/outstanding-balances", icon: AlertTriangle },
      { title: "Credit Sales", url: "/credit-sales", icon: CreditCard },
      { title: "Billing Analytics", url: "/billing-analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Pharmacy POS", items: [
      { title: "Pharmacy POS", url: "/pos", icon: ShoppingCart },
      { title: "Sales History", url: "/sales-history", icon: History },
      { title: "Medicines", url: "/medicines", icon: Pill },
      { title: "Inventory", url: "/inventory", icon: Package },
      { title: "Inventory Analytics", url: "/inventory-analytics", icon: BarChart3 },
      { title: "Purchase Orders", url: "/purchase-orders", icon: ShoppingCart },
      { title: "Purchase Invoices", url: "/invoices", icon: FileText },
      { title: "Supply Chain", url: "/supply-chain", icon: Truck },
      { title: "Stock Reconciliation", url: "/stock-reconciliation", icon: ClipboardList },
      { title: "Controlled Drugs", url: "/controlled-drugs", icon: Shield },
      { title: "Expiry Alerts", url: "/expiry-alerts", icon: AlertTriangle },
      { title: "Customers", url: "/customers", icon: Users },
      { title: "Suppliers", url: "/suppliers", icon: Truck },
    ],
  },
  {
    label: "Inpatient & Ward", items: [
      { title: "Ward Overview", url: "/inpatient", icon: Bed },
      { title: "Bed Allocation", url: "/bed-allocation", icon: Bed },
      { title: "Bed Occupancy", url: "/bed-occupancy", icon: Layers },
      { title: "Nurse Console", url: "/nurse-console", icon: Stethoscope },
      { title: "Medication Admin", url: "/medication-administration", icon: PillIcon },
      { title: "Vitals Recording", url: "/vitals", icon: Activity },
      { title: "Nursing Notes", url: "/nursing-notes", icon: FileText },
      { title: "Ward Rounds", url: "/ward-rounds", icon: ClipboardList },
      { title: "Handover Board", url: "/handover", icon: MessageSquare },
      { title: "Diet Plans", url: "/diet-plans", icon: Utensils },
      { title: "Surgery", url: "/surgery", icon: Scissors },
      { title: "ICU Monitoring", url: "/icu", icon: Activity },
      { title: "Discharge Checklist", url: "/discharge-checklist", icon: ClipboardList },
      { title: "Discharge", url: "/discharge", icon: LogOut },
    ],
  },
  {
    label: "Departments", items: [
      { title: "Emergency", url: "/emergency", icon: Siren },
      { title: "Emergency Protocols", url: "/emergency-protocols", icon: AlertTriangle },
      { title: "OPD", url: "/opd", icon: Users },
      { title: "Radiology", url: "/radiology", icon: Image },
      { title: "Blood Bank", url: "/blood-bank", icon: Droplet },
      { title: "Operation Theatre", url: "/operation-theatre", icon: Scissors },
      { title: "Nutrition", url: "/nutrition", icon: Apple },
      { title: "Physiotherapy", url: "/physiotherapy", icon: Dumbbell },
      { title: "Telemedicine", url: "/telemedicine", icon: Video },
      { title: "Infection Control", url: "/infection-control", icon: Bug },
      { title: "Quality Assurance", url: "/quality-assurance", icon: Award },
    ],
  },
  {
    label: "Clinical Tools", items: [
      { title: "Medical Calculators", url: "/clinical-tools", icon: Calculator },
    ],
  },
  {
    label: "Administration", items: [
      { title: "Staff Management", url: "/staff", icon: UserPlus },
      { title: "Staff Directory", url: "/staff-directory", icon: Phone },
      { title: "Staff Workload", url: "/staff-workload", icon: Gauge },
      { title: "Staff Check-In", url: "/staff-checkin", icon: UserCheck },
      { title: "HR & Payroll", url: "/hr-payroll", icon: DollarSign },
      { title: "Attendance", url: "/attendance", icon: Clock },
      { title: "Performance", url: "/performance", icon: Star },
      { title: "Assets", url: "/assets", icon: Wrench },
      { title: "Compliance", url: "/compliance", icon: Shield },
      { title: "Incidents", url: "/incidents", icon: AlertTriangle },
      { title: "Mortality Review", url: "/mortality-review", icon: FileText },
      { title: "Audit Trail", url: "/audit-trail", icon: Shield },
      { title: "Reports", url: "/reports", icon: BarChart3 },
      { title: "End of Day", url: "/end-of-day", icon: Calendar },
      { title: "Reconciliation", url: "/financial-reconciliation", icon: Wallet },
      { title: "Business Hours", url: "/business-hours", icon: Clock },
      { title: "Role Permissions", url: "/role-permissions", icon: Shield },
      { title: "Notifications", url: "/notifications", icon: Bell },
      { title: "Admin Panel", url: "/admin", icon: Shield },
      { title: "Documentation", url: "/documentation", icon: FileText },
      { title: "Settings", url: "/settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { staff, signOut } = useAuth();
  const { permissions } = usePermissions();
  const { isEnabled } = useModuleSettings();
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ Hospital: true, "Pharmacy POS": true });

  const toggle = (label: string) => setOpenSections(prev => ({ ...prev, [label]: !prev[label] }));
  const handleLogout = async () => { await signOut(); navigate("/login"); };

  const userInitials = staff ? `${staff.first_name[0]}${staff.last_name[0]}` : "U";
  const displayName = staff ? `${staff.first_name} ${staff.last_name}` : "User";
  const userRole = staff?.role || "";

  // Filter out disabled modules, mark locked ones for permission
  const enrichedSections = sections.map(section => ({
    ...section,
    items: section.items
      .filter(item => isEnabled(item.url)) // Hide disabled modules entirely
      .map(item => ({
        ...item,
        locked: !canAccessRoute(item.url, userRole, permissions),
      })),
  })).filter(section => section.items.length > 0); // Hide empty sections

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <img src={brightcareLogo} alt="Brightcare" className="h-9 w-9 shrink-0 rounded-lg object-contain" />
          {!collapsed && <div className="animate-slide-in"><p className="text-sm font-bold text-sidebar-accent-foreground">Brightcare</p><p className="text-[10px] text-sidebar-foreground">Hospital Management & POS</p></div>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {enrichedSections.map((section) => (
          <Collapsible key={section.label} open={openSections[section.label] !== false} onOpenChange={() => toggle(section.label)}>
            <SidebarGroup>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="cursor-pointer flex items-center justify-between hover:bg-sidebar-accent/30 rounded px-2">
                  {section.label}
                  {!collapsed && <ChevronDown className={`h-3 w-3 transition-transform ${openSections[section.label] !== false ? "rotate-180" : ""}`} />}
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            end={item.url === "/"}
                            className={`hover:bg-sidebar-accent/60 ${item.locked ? "opacity-45 grayscale" : ""}`}
                            activeClassName={item.locked ? "" : "bg-sidebar-accent text-sidebar-primary font-semibold"}
                          >
                            <item.icon className="mr-2 h-4 w-4" />
                            {!collapsed && (
                              <span className="flex items-center gap-1.5">
                                {item.title}
                                {item.locked && <span className="text-[10px]">🔒</span>}
                              </span>
                            )}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {!collapsed && (
          <div className="flex items-center gap-3 animate-slide-in">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-bold text-sidebar-accent-foreground">{userInitials}</div>
            <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-sidebar-accent-foreground truncate">{displayName}</p><p className="text-[10px] text-sidebar-foreground truncate">{userRole}</p></div>
            <LogOut className="h-4 w-4 shrink-0 text-sidebar-foreground hover:text-sidebar-accent-foreground cursor-pointer" onClick={handleLogout} />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
