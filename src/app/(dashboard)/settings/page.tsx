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
import { LinkSteamButton } from "@/components/settings/link-steam-button";
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

      {/* Account Information */}
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

          {session.user.email && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-lg">{session.user.email}</p>
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

      {/* Steam Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5" />
            Steam Integration
          </CardTitle>
          <CardDescription>
            Connect your Steam account to sync your library
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LinkSteamButton steamid={profile?.steamid || null} />
        </CardContent>
      </Card>

      {/* Library Sync */}
      {profile?.steamid && (
        <Card>
          <CardHeader>
            <CardTitle>Library Sync</CardTitle>
            <CardDescription>
              Sync your Steam games and playtime data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">
                Click below to sync your latest game library from Steam. This
                will:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Update playtime for all games</li>
                <li>Add any new games to your library</li>
                <li>Update recently played information</li>
                <li>Fetch completion time estimates (HLTB)</li>
              </ul>
            </div>
            <SyncLibraryButton />
          </CardContent>
        </Card>
      )}

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
