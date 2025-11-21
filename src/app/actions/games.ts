"use server";

import { createClient } from "@/lib/supabase/server";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  getOwnedGames,
  getPlayerSummary,
  getSteamHeaderUrl,
} from "@/lib/steam/api";
import { getGamePlaytime } from "@/lib/hltb/service";
import { z } from "zod";

const updateGameSchema = z.object({
  id: z.string().uuid(),
  status: z
    .enum(["backlog", "playing", "completed", "dropped", "shelved"])
    .optional(),
  is_favorite: z.boolean().optional(),
  user_rating: z.number().min(0).max(10).nullable().optional(),
  user_review: z.string().nullable().optional(),
  liked_aspects: z.array(z.string()).nullable().optional(),
  disliked_aspects: z.array(z.string()).nullable().optional(),
});

export async function syncSteamLibrary() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("steamid")
      .eq("user_id", session.user.id)
      .single();

    if (!profile?.steamid) {
      return { error: "No Steam account linked" };
    }

    const games = await getOwnedGames(profile.steamid);

    if (!games || games.length === 0) {
      return { error: "No games found or Steam profile is private" };
    }

    const { data: existingGames } = await supabase
      .from("user_games")
      .select("appid")
      .eq("user_id", session.user.id);

    const existingAppIds = new Set(existingGames?.map((g) => g.appid) || []);

    const gamesToUpsert = await Promise.all(
      games.map(async (game) => {
        let hltbData = null;

        if (!existingAppIds.has(game.appid) || game.playtime_forever > 60) {
          try {
            hltbData = await getGamePlaytime(game.name);
          } catch (e) {
            console.error(`Failed to get HLTB for ${game.name}`);
          }
        }

        return {
          user_id: session.user.id,
          appid: game.appid,
          name: game.name,
          img_url: getSteamHeaderUrl(game.appid),
          playtime_forever: game.playtime_forever || 0,
          playtime_2weeks: game.playtime_2weeks || 0,
          last_played: game.rtime_last_played
            ? new Date(game.rtime_last_played * 1000).toISOString()
            : null,
          hltb_main: hltbData?.main || null,
          hltb_completionist: hltbData?.completionist || null,
        };
      }),
    );

    const { error: upsertError } = await supabase
      .from("user_games")
      .upsert(gamesToUpsert, {
        onConflict: "user_id,appid",
        ignoreDuplicates: false,
      });

    if (upsertError) {
      console.error("Upsert error:", upsertError);
      return { error: "Failed to sync games" };
    }

    const totalPlaytime = games.reduce(
      (sum, g) => sum + (g.playtime_forever || 0),
      0,
    );
    await supabase
      .from("profiles")
      .update({
        total_games: games.length,
        total_playtime: totalPlaytime,
      })
      .eq("user_id", session.user.id);

    revalidatePath("/library");
    revalidatePath("/");

    return { success: true, count: games.length };
  } catch (error) {
    console.error("Sync error:", error);
    return { error: "Failed to sync library" };
  }
}

export async function updateGame(data: z.infer<typeof updateGameSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const validated = updateGameSchema.parse(data);
    const supabase = await createClient();

    const { error } = await supabase
      .from("user_games")
      .update(validated)
      .eq("id", validated.id)
      .eq("user_id", session.user.id);

    if (error) {
      return { error: "Failed to update game" };
    }

    revalidatePath("/library");
    return { success: true };
  } catch (error) {
    console.error("Update error:", error);
    return { error: "Failed to update game" };
  }
}

export async function toggleFavorite(gameId: string, isFavorite: boolean) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("user_games")
      .update({ is_favorite: isFavorite })
      .eq("id", gameId)
      .eq("user_id", session.user.id);

    if (error) {
      return { error: "Failed to update favorite" };
    }

    revalidatePath("/library");
    return { success: true };
  } catch (error) {
    return { error: "Failed to update favorite" };
  }
}

export async function deleteGame(gameId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("user_games")
      .delete()
      .eq("id", gameId)
      .eq("user_id", session.user.id);

    if (error) {
      return { error: "Failed to delete game" };
    }

    revalidatePath("/library");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete game" };
  }
}

export async function addGameToLibrary(appid: number, name: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const supabase = await createClient();

    const hltbData = await getGamePlaytime(name);

    const { error } = await supabase.from("user_games").insert({
      user_id: session.user.id,
      appid,
      name,
      img_url: getSteamHeaderUrl(appid),
      playtime_forever: 0,
      playtime_2weeks: 0,
      status: "backlog",
      hltb_main: hltbData?.main || null,
      hltb_completionist: hltbData?.completionist || null,
    });

    if (error) {
      if (error.code === "23505") {
        return { error: "Game already in library" };
      }
      return { error: "Failed to add game" };
    }

    revalidatePath("/library");
    return { success: true };
  } catch (error) {
    console.error("Add game error:", error);
    return { error: "Failed to add game" };
  }
}
