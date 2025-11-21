"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { syncSteamLibrary } from "@/app/actions/games";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function SyncLibraryButton() {
  const [syncing, setSyncing] = useState(false);
  const router = useRouter();

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncSteamLibrary();

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Successfully synced ${result.count} games!`);
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to sync library");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button onClick={handleSync} disabled={syncing}>
      <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
      {syncing ? "Syncing..." : "Sync Now"}
    </Button>
  );
}
