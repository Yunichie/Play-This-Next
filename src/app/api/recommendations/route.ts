import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auth } from "@/lib/auth";
import { getAIRecommendations, UserGameContext } from "@/lib/ai/gemini";
import { z } from "zod";

const recommendationRequestSchema = z.object({
  query: z.string().optional(),
  limit: z.number().min(1).max(10).optional(),
  includeBacklogOnly: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "What should I play next?";
    const limit = parseInt(searchParams.get("limit") || "5");
    const backlogOnly = searchParams.get("backlogOnly") === "true";

    const supabase = await createClient();

    const { data: games } = await supabase
      .from("user_games")
      .select("*")
      .eq("user_id", session.user.id)
      .order("playtime_forever", { ascending: false });

    if (!games || games.length === 0) {
      return NextResponse.json(
        { error: "No games in library" },
        { status: 404 },
      );
    }

    // Build genre map placeholder
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

    const recommendations = await getAIRecommendations(
      query,
      backlogOnly
        ? userGamesContext.filter(
            (g) => g.status === "backlog" || g.playtime < 60,
          )
        : userGamesContext,
      topGenres,
    );

    return NextResponse.json({
      data: recommendations.slice(0, limit),
      query,
      totalGames: games.length,
    });
  } catch (error) {
    console.error("Recommendations error:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = recommendationRequestSchema.parse(body);

    const supabase = await createClient();

    const { data: games } = await supabase
      .from("user_games")
      .select("*")
      .eq("user_id", session.user.id)
      .order("playtime_forever", { ascending: false });

    if (!games || games.length === 0) {
      return NextResponse.json(
        { error: "No games in library" },
        { status: 404 },
      );
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

    let gamesToAnalyze = games;
    if (validated.includeBacklogOnly) {
      gamesToAnalyze = games.filter(
        (g) => g.status === "backlog" || g.playtime_forever < 60,
      );
    }

    const userGamesContext: UserGameContext[] = gamesToAnalyze.map((g) => ({
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
      validated.query || "What should I play next?",
      userGamesContext,
      topGenres,
    );

    return NextResponse.json({
      data: recommendations.slice(0, validated.limit || 5),
      query: validated.query,
      totalGames: games.length,
      analyzedGames: gamesToAnalyze.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 },
    );
  }
}
