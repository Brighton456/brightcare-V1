import { Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import type { ComponentProps, ReactNode } from "react";

/**
 * Wraps any content and overlays a translucent lock when the user lacks the required permission.
 * Content is still visible (greyed out) but not interactive.
 */
export function LockedOverlay({
  permissionKey,
  children,
  message,
}: {
  permissionKey: string;
  children: ReactNode;
  message?: string;
}) {
  const { can } = usePermissions();
  const allowed = can(permissionKey);

  if (allowed) return <>{children}</>;

  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-40 grayscale">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 rounded-full bg-muted/80 backdrop-blur-sm border border-border px-4 py-2 shadow-lg cursor-default">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                {message || "You don't have permission for this action"}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Required permission: {permissionKey.replace(/_/g, " ")}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

/**
 * A button that shows as greyed out with a 🔒 icon when the user lacks permission.
 * Accepts all Button props plus a permissionKey.
 */
export function LockedButton({
  permissionKey,
  children,
  ...props
}: ComponentProps<typeof Button> & { permissionKey: string }) {
  const { can } = usePermissions();
  const allowed = can(permissionKey);

  if (allowed) {
    return <Button {...props}>{children}</Button>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          {...props}
          disabled
          variant="outline"
          className={`opacity-50 cursor-not-allowed ${props.className || ""}`}
          onClick={undefined}
        >
          <Lock className="h-3.5 w-3.5 mr-1.5 shrink-0" />
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>🔒 Requires: {permissionKey.replace(/_/g, " ")}</p>
      </TooltipContent>
    </Tooltip>
  );
}
