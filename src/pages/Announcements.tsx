import { AppLayout } from "@/components/AppLayout";
import { AnnouncementManager } from "@/components/AnnouncementManager";
import { Megaphone } from "lucide-react";

export default function Announcements() {
  return (
    <AppLayout title="Announcements">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Manage Announcements</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Create and manage announcements visible across all user dashboards. Target specific roles or broadcast to everyone.
        </p>
        <AnnouncementManager />
      </div>
    </AppLayout>
  );
}
