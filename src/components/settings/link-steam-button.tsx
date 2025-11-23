"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Gamepad2, Unlink, AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface LinkSteamButtonProps {
  steamid: string | null;
}

export function LinkSteamButton({ steamid }: LinkSteamButtonProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [unlinking, setUnlinking] = useState(false);
  const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false);

  useEffect(() => {
    const steamLink = searchParams.get("steam_link");
    const error = searchParams.get("error");

    if (steamLink === "success") {
      toast.success(
        "Steam account linked successfully! Syncing your library...",
      );
      const params = new URLSearchParams(searchParams);
      params.delete("steam_link");
      router.replace(`/settings?${params.toString()}`);

      fetch("/api/sync-steam", { method: "POST" })
        .then(() => {
          toast.success("Library synced successfully!");
          router.refresh();
        })
        .catch(() => {
          toast.info("Please manually sync your library");
        });
    }

    if (error === "steam_already_linked") {
      toast.error("This Steam account is already linked to another user");
      const params = new URLSearchParams(searchParams);
      params.delete("error");
      router.replace(`/settings?${params.toString()}`);
    }

    if (error === "steam_already_linked_to_you") {
      toast.info("This Steam account is already linked to your account");
      const params = new URLSearchParams(searchParams);
      params.delete("error");
      router.replace(`/settings?${params.toString()}`);
    }

    if (error === "link_failed") {
      toast.error("Failed to link Steam account. Please try again.");
      const params = new URLSearchParams(searchParams);
      params.delete("error");
      router.replace(`/settings?${params.toString()}`);
    }

    if (error === "not_authenticated") {
      toast.error("You must be logged in to link a Steam account");
      const params = new URLSearchParams(searchParams);
      params.delete("error");
      router.replace(`/settings?${params.toString()}`);
    }
  }, [searchParams, router]);

  const handleLinkSteam = () => {
    window.location.href = "/api/auth/steam?link=true";
  };

  const handleUnlinkSteam = async () => {
    setUnlinking(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Not authenticated");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          steamid: null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) {
        toast.error("Failed to unlink Steam account");
        return;
      }

      toast.success("Steam account unlinked successfully");
      setUnlinkDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Failed to unlink Steam account");
    } finally {
      setUnlinking(false);
    }
  };

  if (steamid) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <div className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-400 animate-pulse" />
          Steam account connected
        </div>

        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-2 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="font-medium mb-1">Connected Steam Account</p>
              <p className="text-muted-foreground">
                Steam ID: <code className="font-mono text-xs">{steamid}</code>
              </p>
            </div>
          </div>
        </div>

        <Dialog open={unlinkDialogOpen} onOpenChange={setUnlinkDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Unlink className="w-4 h-4 mr-2" />
              Unlink Steam Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Unlink Steam Account?</DialogTitle>
              <DialogDescription className="space-y-2">
                <p>
                  Are you sure you want to unlink your Steam account? This will:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Remove the connection to your Steam profile</li>
                  <li>Disable automatic library syncing</li>
                  <li>Keep your existing game data intact</li>
                  <li>Prevent you from logging in with Steam</li>
                </ul>
                <p className="text-sm font-medium mt-3">
                  You can re-link your Steam account at any time.
                </p>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setUnlinkDialogOpen(false)}
                disabled={unlinking}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleUnlinkSteam}
                disabled={unlinking}
              >
                {unlinking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Unlinking...
                  </>
                ) : (
                  "Unlink Account"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-muted/50 rounded-lg">
        <div className="flex items-start gap-2 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
          <div>
            <p className="font-medium mb-1">Link Your Steam Account</p>
            <p className="text-muted-foreground">
              Connect your Steam account to automatically sync your game library
              and access personalized recommendations.
            </p>
          </div>
        </div>
      </div>

      <Button onClick={handleLinkSteam} className="w-full" size="lg">
        <Gamepad2 className="w-4 h-4 mr-2" />
        Link Steam Account
      </Button>

      <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium mb-1">What we access:</p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>Your public Steam profile information</li>
              <li>Your game library and playtime data</li>
              <li>Recently played games</li>
            </ul>
            <p className="mt-2 font-medium">We never access:</p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>Your Steam password or credentials</li>
              <li>Your payment information</li>
              <li>Your private messages or friends list</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
