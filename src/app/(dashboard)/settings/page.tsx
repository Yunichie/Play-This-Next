import { auth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SyncLibraryButton } from "@/components/settings/sync-library-button";
import { ExportDataButton } from "@/components/settings/export-data-button";
import { DeleteAccountButton } from "@/components/settings/delete-account-button";
import { Gamepad2 } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", session.user.id)
    .single();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-4xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      {}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your profile details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Username
            </p>
            <p className="text-lg">{profile?.username || "Not set"}</p>
          </div>

          {profile?.steamid && (
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Gamepad2 className="w-4 h-4" />
                Steam ID
              </p>
              <p className="text-lg font-mono">{profile.steamid}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Games
              </p>
              <p className="text-2xl font-bold">{profile?.total_games || 0}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Playtime
              </p>
              <p className="text-2xl font-bold">
                {Math.round((profile?.total_playtime || 0) / 60)}h
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {}
      <Card>
        <CardHeader>
          <CardTitle>Steam Library</CardTitle>
          <CardDescription>Sync your Steam games</CardDescription>
        </CardHeader>
        <CardContent>
          {profile?.steamid ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <div className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-400" />
                Steam account connected
              </div>
              <SyncLibraryButton />
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                No Steam account connected. Link your Steam account to sync your
                library automatically.
              </p>
              {/* TODO: implement Steam OAuth flow */}
              <p className="text-sm text-muted-foreground">
                Steam integration requires Steam Web API authentication.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Export or delete your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Export Data</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Download all your game data, ratings, and reviews as JSON.
            </p>
            <ExportDataButton />
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2 text-destructive">Danger Zone</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Permanently delete your account and all associated data. This
              action cannot be undone.
            </p>
            <DeleteAccountButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
