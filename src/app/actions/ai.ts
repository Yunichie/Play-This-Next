// src/app/actions/ai.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { auth } from "@/lib/auth";
import {
  getAIRecommendations,
  streamAIChat,
  UserGameContext,
} from "@/lib/ai/gemini";

// NOTE: These server actions are kept for backward compatibility
// New code should use the API endpoints directly via /api/recommendations

export async function getRecommendations(
  userQuery: string = "What should I play next?",
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const supabase = await createClient();

    const { data: games } = await supabase
      .from("user_games")
      .select("*")
      .eq("user_id", session.user.id)
      .order("playtime_forever", { ascending: false });

    if (!games || games.length === 0) {
      return {
        error: "No games in library. Please sync your Steam library first.",
        recommendations: [],
      };
    }

    const genreMap = new Map<string, number>();

    // For now, use playtime as a proxy for preference
    games.forEach((game) => {
      if (game.playtime_forever > 0) {
        genreMap.set(
          "Action",
          (genreMap.get("Action") || 0) + game.playtime_forever,
        );
      }
    });

    const topGenres = Array.from(genreMap.entries())
      .map(([genre, playtime]) => ({ genre, playtime }))
      .sort((a, b) => b.playtime - a.playtime);

    const userGamesContext: UserGameContext[] = games.map((g) => ({
      name: g.name,
      appid: g.appid,
      playtime: g.playtime_forever,
      rating: g.user_rating || undefined,
      review: g.user_review || undefined,
      liked_aspects: g.liked_aspects || undefined,
      disliked_aspects: g.disliked_aspects || undefined,
      status: g.status,
      hltb_main: g.hltb_main || undefined,
    }));

    const recommendations = await getAIRecommendations(
      userQuery,
      userGamesContext,
      topGenres,
    );

    return { success: true, recommendations: recommendations || [] };
  } catch (error) {
    console.error("Recommendation error:", error);
    return { error: "Failed to get recommendations", recommendations: [] };
  }
}

export async function getChatStream(message: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const supabase = await createClient();

    const { data: games } = await supabase
      .from("user_games")
      .select("*")
      .eq("user_id", session.user.id)
      .order("playtime_forever", { ascending: false });

    if (!games || games.length === 0) {
      throw new Error("No games in library");
    }

    const genreMap = new Map<string, number>();
    games.forEach((game) => {
      if (game.playtime_forever > 0) {
        genreMap.set(
          "Action",
          (genreMap.get("Action") || 0) + game.playtime_forever,
        );
      }
    });

    const topGenres = Array.from(genreMap.entries())
      .map(([genre, playtime]) => ({ genre, playtime }))
      .sort((a, b) => b.playtime - a.playtime);

    const userGamesContext: UserGameContext[] = games.map((g) => ({
      name: g.name,
      appid: g.appid,
      playtime: g.playtime_forever,
      rating: g.user_rating || undefined,
      review: g.user_review || undefined,
      liked_aspects: g.liked_aspects || undefined,
      disliked_aspects: g.disliked_aspects || undefined,
      status: g.status,
      hltb_main: g.hltb_main || undefined,
    }));

    return await streamAIChat(message, userGamesContext, topGenres);
  } catch (error) {
    console.error("Chat stream error:", error);
    throw error;
  }
}

// New utility function for direct API usage
export async function getRecommendationsFromAPI(
  query?: string,
  limit?: number,
  backlogOnly?: boolean,
) {
  try {
    const params = new URLSearchParams();
    if (query) params.append("query", query);
    if (limit) params.append("limit", limit.toString());
    if (backlogOnly) params.append("backlogOnly", "true");

    const response = await fetch(
      `/api/recommendations${params.toString() ? `?${params.toString()}` : ""}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || "Failed to get recommendations" };
    }

    const data = await response.json();
    return { success: true, ...data };
  } catch (error) {
    console.error("Recommendations API error:", error);
    return { error: "Failed to get recommendations" };
  }
}

export async function generateCustomRecommendations(
  query: string,
  limit?: number,
  includeBacklogOnly?: boolean,
) {
  try {
    const response = await fetch("/api/recommendations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        limit,
        includeBacklogOnly,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || "Failed to generate recommendations" };
    }

    const data = await response.json();
    return { success: true, ...data };
  } catch (error) {
    console.error("Generate recommendations error:", error);
    return { error: "Failed to generate recommendations" };
  }
}
