import { useState } from "react";
import { useHospital } from "@/contexts/HospitalContext";
import { useFacility } from "@/hooks/useFacility";
import { isModuleInProfile, HERBAL_EXCLUDED_MODULES, CLINIC_EXCLUDED_MODULES } from "@/config/facilityPackages";
import { useModuleSettings } from "@/hooks/useModuleSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Leaf, Stethoscope, Bed, AlertTriangle, Check, Lock } from "lucide-react";

/**
 * ModuleConsentPanel — admin UI for overriding facility package exclusions.
 *
 * By default, clinic and herbal packages exclude hospital-specific modules
 * (inpatient, wards, theatre, mortality review, etc.). This panel lets a
 * platform or hospital admin consent to enabling those modules for a specific
 * facility — e.g. a clinic that wants to add a small inpatient wing, or a
 * herbal clinic that wants mortality review for compliance.
 *
 * The override is stored as a module_settings row (is_enabled: true) that
 * takes precedence over the facility package default in useFacility().
 */

const EXCLUDED_BY_PACKAGE: Record<string, { icon: typeof Bed; label: string; excluded: string[]; description: string }> = {
  clinic: {
    icon: Stethoscope,
    label: "Medical Clinic",
    excluded: CLINIC_EXCLUDED_MODULES,
    description: "Outpatient-focused care. These hospital modules are excluded by default to keep the clinic lightweight.",
  },
  herbal: {
    icon: Leaf,
    label: "Herbal Clinic",
    excluded: HERBAL_EXCLUDED_MODULES,
    description: "Fast, multi-branch herbal care. These hospital-specific modules are excluded to keep the herbal workflow compressed.",
  },
};

export function ModuleConsentPanel() {
  const { hospitalId } = useHospital();
  const { facilityType, pkg } = useFacility();
  const { modules, setModule } = useModuleSettings();
  const [saving, setSaving] = useState<string | null>(null);

  // Only clinic and herbal packages have exclusions to consent to.
  const consentInfo = EXCLUDED_BY_PACKAGE[facilityType] ?? null;
  if (!consentInfo || facilityType === "hospital") {
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Check className="h-5 w-5" /> No Exclusions to Consent To
          </CardTitle>
          <CardDescription>
            The <strong>Hospital</strong> package includes all modules by default.
            Module consent is only relevant for Clinic and Herbal packages that
            exclude hospital-specific modules.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const excludedModules = consentInfo.excluded;

  const handleToggle = async (moduleKey: string, current: boolean) => {
    if (!hospitalId) return;
    if (current) {
      // Already enabled — no action needed (would have been overridden already)
      return;
    }
    setSaving(moduleKey);
    try {
      await setModule(moduleKey, true);
    } finally {
      setSaving(null);
    }
  };

  const enabledOverrides = excludedModules.filter((mk) => modules[mk] === true);
  const remainingExcluded = excludedModules.filter((mk) => modules[mk] !== true);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <consentInfo.icon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <CardTitle>Module Consent — {consentInfo.label}</CardTitle>
        </div>
        <CardDescription>
          {consentInfo.description}
          {remainingExcluded.length > 0 && (
            <span className="block mt-1 text-amber-600 dark:text-amber-400">
              {remainingExcluded.length} module{remainingExcluded.length !== 1 ? "s" : ""} currently excluded.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary badges */}
        <div className="flex gap-2 flex-wrap">
          {remainingExcluded.length > 0 && (
            <Badge variant="outline" className="gap-1 border-amber-500/30 text-amber-600 dark:text-amber-400">
              <Lock className="h-3 w-3" /> {remainingExcluded.length} excluded
            </Badge>
          )}
          {enabledOverrides.length > 0 && (
            <Badge variant="outline" className="gap-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              <Check className="h-3 w-3" /> {enabledOverrides.length} consented
            </Badge>
          )}
        </div>

        {/* Excluded modules that can be consented to */}
        {excludedModules.length === 0 ? (
          <p className="text-sm text-muted-foreground">No modules are excluded from this package.</p>
        ) : (
          <div className="grid gap-2">
            {excludedModules.map((moduleKey) => {
              const currentlyEnabled = modules[moduleKey] === true;
              const moduleName = moduleKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
              return (
                <div
                  key={moduleKey}
                  className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
                    currentlyEnabled
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {currentlyEnabled ? (
                      <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                    )}
                    <div>
                      <p className={`text-sm font-medium ${currentlyEnabled ? "text-emerald-700 dark:text-emerald-300" : "text-foreground"}`}>
                        {moduleName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {currentlyEnabled
                          ? "Consented — this module is now enabled for your facility"
                          : "Excluded by default for this facility type"}
                      </p>
                    </div>
                  </div>
                  {!currentlyEnabled && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                      onClick={() => handleToggle(moduleKey, currentlyEnabled)}
                      disabled={saving === moduleKey}
                    >
                      {saving === moduleKey ? "Saving..." : "Consent to Enable"}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {enabledOverrides.length > 0 && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-1">
              ⚠ Modules enabled via consent bypass the facility package default.
            </p>
            <p className="text-xs text-muted-foreground">
              These modules will appear in the sidebar and are accessible per role permissions.
              Disable them again from this panel to revert to the package default.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
