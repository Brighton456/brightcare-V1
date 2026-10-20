import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBranch } from "@/contexts/BranchContext";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, ShieldAlert } from "lucide-react";

const ADMIN_ROLES = new Set(["admin", "hospital_admin", "platform_admin", "super_admin"]);

export default function Branches() {
  const { staff } = useAuth();
  const { branches, isLoading, canManageBranches, createBranch } = useBranch();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isAdmin = ADMIN_ROLES.has(staff?.role || "");

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    const result = await createBranch({ name, branch_code: code, address, phone });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setName("");
    setCode("");
    setAddress("");
    setPhone("");
  };

  if (!isAdmin || !canManageBranches) {
    return (
      <AppLayout title="Branches">
        <div role="alert" className="flex min-h-[50vh] flex-col items-center justify-center gap-2 p-8 text-center">
          <ShieldAlert className="h-8 w-8 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Administrator access required</h1>
          <p className="text-sm text-muted-foreground">Branch setup and organization-wide branch access are limited to administrators.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Branch Management">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="border-b pb-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Organization / Locations</p>
          <h1 className="mt-1 text-2xl font-semibold">Branches</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage facility locations and switch the active reporting scope.</p>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
          <Card className="rounded-md shadow-none">
            <CardContent className="p-4">
              <h2 className="font-semibold">Add a branch</h2>
              <form className="mt-4 space-y-3" onSubmit={handleCreate}>
                <div className="grid gap-1.5"><Label htmlFor="branch-name">Branch name</Label><Input id="branch-name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={100} placeholder="e.g. Westlands Clinic" /></div>
                <div className="grid gap-1.5"><Label htmlFor="branch-code">Branch code</Label><Input id="branch-code" value={code} onChange={(event) => setCode(event.target.value)} maxLength={20} placeholder="Auto-generated if blank" /></div>
                <div className="grid gap-1.5"><Label htmlFor="branch-address">Address</Label><Input id="branch-address" value={address} onChange={(event) => setAddress(event.target.value)} /></div>
                <div className="grid gap-1.5"><Label htmlFor="branch-phone">Phone</Label><Input id="branch-phone" value={phone} onChange={(event) => setPhone(event.target.value)} /></div>
                {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={saving || !name.trim()}><Plus className="mr-2 h-4 w-4" />{saving ? "Creating..." : "Create branch"}</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-md shadow-none">
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b px-4 py-3"><div><h2 className="font-semibold">Organization locations</h2><p className="text-xs text-muted-foreground">{branches.length} active branches</p></div><Badge variant="outline">{isLoading ? "Loading" : "Connected"}</Badge></div>
              {branches.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">{isLoading ? "Loading branches..." : "No branches are available."}</p> : (
                <div className="divide-y">{branches.map((branch) => <div key={branch.id} className="flex items-center gap-3 px-4 py-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{branch.name}</p><p className="text-xs text-muted-foreground">{branch.branch_code}{branch.address ? ` · ${branch.address}` : ""}</p></div>{branch.is_main && <Badge variant="secondary">Main</Badge>}</div>)}</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
