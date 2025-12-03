import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auth } from "@/lib/auth";

export async function GET_FILTER_OPTIONS(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: games } = await supabase
      .from("user_games")
      .select(
        "status, user_rating, playtime_forever, is_favorite, liked_aspects, disliked_aspects",
      )
      .eq("user_id", session.user.id);

    if (!games) {
      return NextResponse.json({ error: "No games found" }, { status: 404 });
    }

    const statusCounts = games.reduce(
      (acc, game) => {
        acc[game.status] = (acc[game.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const ratings = games
      .filter((g) => g.user_rating !== null)
      .map((g) => g.user_rating!);
    const ratingRange =
      ratings.length > 0
        ? { min: Math.min(...ratings), max: Math.max(...ratings) }
        : { min: 0, max: 10 };

    const playtimes = games.map((g) => g.playtime_forever);
    const playtimeRange = {
      min: Math.min(...playtimes),
      max: Math.max(...playtimes),
    };

    const favoriteCount = games.filter((g) => g.is_favorite).length;

    const allLikedAspects = new Set<string>();
    const allDislikedAspects = new Set<string>();

    games.forEach((game) => {
      game.liked_aspects?.forEach((aspect) => allLikedAspects.add(aspect));
      game.disliked_aspects?.forEach((aspect) =>
        allDislikedAspects.add(aspect),
      );
    });

    return NextResponse.json({
      data: {
        statuses: statusCounts,
        ratingRange,
        playtimeRange,
        favoriteCount,
        totalGames: games.length,
        availableAspects: {
          liked: Array.from(allLikedAspects),
          disliked: Array.from(allDislikedAspects),
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
