import type { LucideIcon } from "lucide-react";
import type { NavSection } from "@/config/navigation";
import type { WorkflowSection } from "@/pages/Dashboard";

/**
 * Dashboard section definitions per facility package.
 *
 * Hospital: full nav, grouped by section label (today's behavior).
 * Clinic:     hospital nav minus inpatient/ward (same as NAV_CLINIC).
 * Herbal:     compressed 3-section layout — Clinic, Medicines & Sales, Business.
 *
 * These mirror NAV_HOSPITAL / NAV_CLINIC / NAV_HERBAL in navigation.ts
 * so the sidebar and dashboard always agree on what a facility type exposes.
 */

/**
 * Convert a NavSection[] into WorkflowSection[] for the dashboard quick-action grid.
 * Color assignment is deterministic per section label so hospital & clinic render
 * the same colors regardless of which package is active.
 */
export function navToWorkflowSections(
  nav: NavSection[],
  pkgKey: "hospital" | "clinic" | "herbal"
): WorkflowSection[] {
  // Herbal: compressed 3-section layout.
  if (pkgKey === "herbal") {
    return [
      {
        title: "CLINIC",
        color: "text-emerald-700 dark:text-emerald-400",
        bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
        borderColor: "border-emerald-200 dark:border-emerald-800",
        iconColor: "text-emerald-600 dark:text-emerald-400",
        actions: [],
      },
      {
        title: "MEDICINES & SALES",
        color: "text-amber-700 dark:text-amber-400",
        bgColor: "bg-amber-50 dark:bg-amber-950/40",
        borderColor: "border-amber-200 dark:border-amber-800",
        iconColor: "text-amber-600 dark:text-amber-400",
        actions: [],
      },
      {
        title: "BUSINESS",
        color: "text-slate-700 dark:text-slate-400",
        bgColor: "bg-slate-50 dark:bg-slate-950/40",
        borderColor: "border-slate-200 dark:border-slate-800",
        iconColor: "text-slate-600 dark:text-slate-400",
        actions: [],
      },
    ];
  }

  // Hospital & clinic: one section per nav group, colored by label.
  const colorMap: Record<string, { color: string; bg: string; border: string; icon: string }> = {
    "Hospital": { color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40", border: "border-blue-200 dark:border-blue-800", icon: "text-blue-600 dark:text-blue-400" },
    "Doctor & Consultation": { color: "text-cyan-700 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-950/40", border: "border-cyan-200 dark:border-cyan-800", icon: "text-cyan-600 dark:text-cyan-400" },
    "Laboratory": { color: "text-purple-700 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-200 dark:border-purple-800", icon: "text-purple-600 dark:text-purple-400" },
    "Billing & Payments": { color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-200 dark:border-emerald-800", icon: "text-emerald-600 dark:text-emerald-400" },
    "Pharmacy POS": { color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40", border: "border-amber-200 dark:border-amber-800", icon: "text-amber-600 dark:text-amber-400" },
    "Inpatient & Ward": { color: "text-rose-700 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/40", border: "border-rose-200 dark:border-rose-800", icon: "text-rose-600 dark:text-rose-400" },
    "Departments": { color: "text-indigo-700 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/40", border: "border-indigo-200 dark:border-indigo-800", icon: "text-indigo-600 dark:text-indigo-400" },
    "Clinical Tools": { color: "text-pink-700 dark:text-pink-400", bg: "bg-pink-50 dark:bg-pink-950/40", border: "border-pink-200 dark:border-pink-800", icon: "text-pink-600 dark:text-pink-400" },
    "Administration": { color: "text-slate-700 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-950/40", border: "border-slate-200 dark:border-slate-800", icon: "text-slate-600 dark:text-slate-400" },
  };

  return nav.map((section) => {
    const colors = colorMap[section.label] ?? {
      color: "text-slate-700 dark:text-slate-400",
      bg: "bg-slate-50 dark:bg-slate-950/40",
      border: "border-slate-200 dark:border-slate-800",
      icon: "text-slate-600 dark:text-slate-400",
    };
    return {
      title: section.label.toUpperCase(),
      color: colors.color,
      bgColor: colors.bg,
      borderColor: colors.border,
      iconColor: colors.icon,
      actions: section.items.map((item) => ({
        label: item.title,
        icon: item.icon as React.ElementType,
        route: item.url,
        onClick: () => {}, // caller attaches navigate
      })),
    };
  });
}

/**
 * Assign navigate closures to a section's actions in place.
 */
export function attachNavigate(
  sections: WorkflowSection[],
  navigate: (path: string) => void
): void {
  for (const section of sections) {
    for (const action of section.actions) {
      if (action.route) {
        action.onClick = () => navigate(action.route);
      }
    }
  }
}
