import { GitBranch } from "lucide-react";
import { useBranch, allBranchesValue } from "@/contexts/BranchContext";

export function BranchSwitcher() {
  const { branches, selectedBranchId, canManageBranches, isLoading, selectBranch } = useBranch();
  if (isLoading || branches.length === 0) return null;

  return (
    <label className="flex h-8 max-w-[220px] items-center gap-2 rounded-sm border bg-background px-2 text-xs">
      <GitBranch className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="sr-only">Active branch</span>
      <select
        aria-label="Active branch"
        className="min-w-0 flex-1 bg-transparent text-xs outline-none"
        value={selectedBranchId || (canManageBranches ? allBranchesValue() : branches[0].id)}
        onChange={(event) => selectBranch(event.target.value === allBranchesValue() ? null : event.target.value)}
      >
        {canManageBranches && <option value={allBranchesValue()}>All branches</option>}
        {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}{branch.is_main ? " · Main" : ""}</option>)}
      </select>
    </label>
  );
}
