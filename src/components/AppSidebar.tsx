import { LogOut, ChevronDown } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import brightcareLogo from "@/assets/brightcare-logo.png";
import { usePermissions } from "@/hooks/usePermissions";
import { useFacility } from "@/hooks/useFacility";
import { canAccessRoute } from "@/lib/routePermissions";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

/**
 * Sidebar renders the navigation tree of the active facility package
 * (hospital / clinic / herbal) from src/config/navigation.ts.
 * Disabled modules are hidden; permission-locked items are greyed out.
 */
export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { staff, signOut } = useAuth();
  const { permissions } = usePermissions();
  const { nav, tagline, isModuleEnabled } = useFacility();
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ Hospital: true, Clinic: true, "Pharmacy POS": true });

  const toggle = (label: string) => setOpenSections(prev => ({ ...prev, [label]: !prev[label] }));
  const handleLogout = async () => { await signOut(); navigate("/login"); };

  const userInitials = staff ? `${staff.first_name[0]}${staff.last_name[0]}` : "U";
  const displayName = staff ? `${staff.first_name} ${staff.last_name}` : "User";
  const userRole = staff?.role || "";

  // Filter out disabled modules, mark locked ones for permission
  const enrichedSections = nav.map(section => ({
    ...section,
    items: section.items
      .filter(item => isModuleEnabled(item.url)) // Hide disabled modules entirely
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
          {!collapsed && <div className="animate-slide-in"><p className="text-sm font-bold text-sidebar-accent-foreground">Brightcare</p><p className="text-[10px] text-sidebar-foreground">{tagline}</p></div>}
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
