import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useHospital } from "@/contexts/HospitalContext";

export interface BranchSummary {
  id: string;
  hospital_id: string;
  branch_code: string;
  name: string;
  is_main: boolean;
  address: string | null;
  phone: string | null;
  is_active: boolean;
}

interface BranchContextValue {
  branches: BranchSummary[];
  selectedBranchId: string | null;
  isLoading: boolean;
  canManageBranches: boolean;
  selectBranch: (branchId: string | null) => void;
  createBranch: (values: { name: string; branch_code?: string; address?: string; phone?: string }) => Promise<{ error?: string }>;
  refreshBranches: () => Promise<void>;
}

const emptyContext: BranchContextValue = {
  branches: [],
  selectedBranchId: null,
  isLoading: false,
  canManageBranches: false,
  selectBranch: () => {},
  createBranch: async () => ({ error: "Branch context is unavailable." }),
  refreshBranches: async () => {},
};

const BranchContext = createContext<BranchContextValue>(emptyContext);
const ALL_BRANCHES = "all";

function getSessionToken() {
  return localStorage.getItem("brightcare_session");
}

export function BranchProvider({ children }: { children: ReactNode }) {
  const { staff } = useAuth();
  const { hospitalId } = useHospital();
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [canManageBranches, setCanManageBranches] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const refreshBranches = useCallback(async () => {
    if (!staff?.id || !hospitalId) {
      setBranches([]);
      setSelectedBranchId(null);
      setCanManageBranches(false);
      return;
    }

    const sessionToken = getSessionToken();
    if (!sessionToken) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("branch-management", {
        body: { action: "list", session_token: sessionToken },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message || "Unable to load branches.");
      const nextBranches = (data?.branches || []) as BranchSummary[];
      setBranches(nextBranches);
      setCanManageBranches(data?.can_manage === true);
      const storedSelection = localStorage.getItem(`brightcare_branch_${hospitalId}`);
      const staffBranchId = data?.assigned_branch_id as string | null;
      if (data?.can_manage) {
        setSelectedBranchId(storedSelection === ALL_BRANCHES ? null : nextBranches.some((branch) => branch.id === storedSelection) ? storedSelection : null);
      } else {
        setSelectedBranchId(nextBranches.some((branch) => branch.id === staffBranchId) ? staffBranchId : nextBranches[0]?.id || null);
      }
    } catch (error) {
      console.error("Branch context could not load:", error);
      setBranches([]);
      setCanManageBranches(false);
    } finally {
      setIsLoading(false);
    }
  }, [staff?.id, hospitalId]);

  useEffect(() => { void refreshBranches(); }, [refreshBranches]);

  const selectBranch = useCallback((branchId: string | null) => {
    if (!canManageBranches && branchId !== selectedBranchId) return;
    if (branchId && !branches.some((branch) => branch.id === branchId)) return;
    setSelectedBranchId(branchId);
    if (hospitalId) localStorage.setItem(`brightcare_branch_${hospitalId}`, branchId || ALL_BRANCHES);
  }, [branches, canManageBranches, hospitalId, selectedBranchId]);

  const createBranch = useCallback(async (values: { name: string; branch_code?: string; address?: string; phone?: string }) => {
    const sessionToken = getSessionToken();
    if (!sessionToken || !canManageBranches) return { error: "Only organization administrators can create branches." };
    const { data, error } = await supabase.functions.invoke("branch-management", {
      body: { action: "create", session_token: sessionToken, ...values },
    });
    if (error || data?.error) return { error: data?.error || error?.message || "Branch creation failed." };
    const branch = data?.branch as BranchSummary | undefined;
    if (branch) {
      setBranches((previous) => [...previous, branch].sort((left, right) => Number(right.is_main) - Number(left.is_main) || left.name.localeCompare(right.name)));
      setSelectedBranchId(branch.id);
      if (hospitalId) localStorage.setItem(`brightcare_branch_${hospitalId}`, branch.id);
    }
    return {};
  }, [canManageBranches, hospitalId]);

  const value = useMemo(() => ({ branches, selectedBranchId, isLoading, canManageBranches, selectBranch, createBranch, refreshBranches }), [branches, selectedBranchId, isLoading, canManageBranches, selectBranch, createBranch, refreshBranches]);
  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useBranch() {
  return useContext(BranchContext);
}

export function allBranchesValue() {
  return ALL_BRANCHES;
}
