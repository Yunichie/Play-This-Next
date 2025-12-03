"use server";

import { createClient } from "@/lib/supabase/server";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  getGameSchema,
  getGlobalAchievementPercentages,
  getPlayerAchievements,
} from "@/lib/steam/api";

// backward compat

export async function linkSteamAccount(
  steamId: string,
  username: string,
  avatarUrl: string,
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const supabase = await createClient();

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("steamid", steamId)
      .neq("user_id", session.user.id)
      .single();

    if (existingProfile) {
      return { error: "This Steam account is already linked to another user" };
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        steamid: steamId,
        username: username,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Error linking Steam account:", error);
      return { error: "Failed to link Steam account" };
    }

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Steam link error:", error);
    return { error: "Failed to link Steam account" };
  }
}

export async function unlinkSteamAccount() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("profiles")
      .update({
        steamid: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Error unlinking Steam account:", error);
      return { error: "Failed to unlink Steam account" };
    }

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Steam unlink error:", error);
    return { error: "Failed to unlink Steam account" };
  }
}

export async function checkSteamLinkStatus() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { isLinked: false };
    }

    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("steamid")
      .eq("user_id", session.user.id)
      .single();

    return {
      isLinked: !!profile?.steamid,
      steamId: profile?.steamid,
    };
  } catch (error) {
    console.error("Check Steam link error:", error);
    return { isLinked: false };
  }
}

export async function updateProfileViaAPI(data: {
  username?: string;
  avatar_url?: string;
}) {
  try {
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || "Failed to update profile" };
    }

    const result = await response.json();
    revalidatePath("/settings");
    revalidatePath("/");

    return { success: true, data: result.data };
  } catch (error) {
    console.error("Update profile error:", error);
    return { error: "Failed to update profile" };
  }
}

export async function getProfileViaAPI() {
  try {
    const response = await fetch("/api/profile", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || "Failed to get profile" };
    }

    const result = await response.json();
    return { success: true, data: result.data };
  } catch (error) {
    console.error("Get profile error:", error);
    return { error: "Failed to get profile" };
  }
}

export async function deleteAccountViaAPI() {
  try {
    const response = await fetch("/api/profile", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || "Failed to delete account" };
    }

    return { success: true };
  } catch (error) {
    console.error("Delete account error:", error);
    return { error: "Failed to delete account" };
  }
}

export async function syncSteamLibraryViaAPI() {
  try {
    const response = await fetch("/api/sync-steam", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || "Failed to sync library" };
    }

    const result = await response.json();
    revalidatePath("/library");
    revalidatePath("/");
    revalidatePath("/stats");

    return { success: true, count: result.count };
  } catch (error) {
    console.error("Sync library error:", error);
    return { error: "Failed to sync library" };
  }
}

export async function getGameAchievements(appid: number) {
  try {
    const session = await auth();
    let steamid: string | null = null;

    if (session?.user?.id) {
      const supabase = await createClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("steamid")
        .eq("user_id", session.user.id)
        .single();

      steamid = profile?.steamid || null;
    }

    const [schema, percentages, playerAchievements] = await Promise.all([
      getGameSchema(appid),
      getGlobalAchievementPercentages(appid),
      steamid ? getPlayerAchievements(steamid, appid) : Promise.resolve([]),
    ]);

    if (!schema?.game?.availableGameStats?.achievements) {
      return { achievements: [] };
    }

    const achievements = schema.game.availableGameStats.achievements.map(
      (ach) => {
        const percentage = percentages.find((p) => p.name === ach.name);
        const playerAch = playerAchievements.find(
          (p) => p.apiname === ach.name,
        );
        return {
          ...ach,
          percent: percentage ? parseFloat(percentage.percent.toString()) : 0,
          achieved: playerAch ? playerAch.achieved === 1 : false,
          unlocktime: playerAch?.unlocktime || 0,
        };
      },
    );

    return { achievements };
  } catch (error) {
    console.error("Error fetching game achievements:", error);
    return { error: "Failed to fetch achievements" };
  }
}
