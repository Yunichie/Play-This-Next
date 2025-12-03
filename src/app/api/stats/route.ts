import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: games } = await supabase
      .from("user_games")
      .select("*")
      .eq("user_id", session.user.id);

    if (!games) {
      return NextResponse.json({ error: "No games found" }, { status: 404 });
    }

    const totalGames = games.length;
    const totalPlaytime = games.reduce((sum, g) => sum + g.playtime_forever, 0);

    const statusCounts = {
      backlog: games.filter((g) => g.status === "backlog").length,
      playing: games.filter((g) => g.status === "playing").length,
      completed: games.filter((g) => g.status === "completed").length,
      dropped: games.filter((g) => g.status === "dropped").length,
      shelved: games.filter((g) => g.status === "shelved").length,
    };

    const ratedGames = games.filter((g) => g.user_rating !== null);
    const averageRating =
      ratedGames.length > 0
        ? ratedGames.reduce((sum, g) => sum + (g.user_rating || 0), 0) /
          ratedGames.length
        : 0;

    const favoriteCount = games.filter((g) => g.is_favorite).length;
    const reviewCount = games.filter((g) => g.user_review).length;

    const mostPlayed = games
      .sort((a, b) => b.playtime_forever - a.playtime_forever)
      .slice(0, 10)
      .map((g) => ({
        id: g.id,
        name: g.name,
        appid: g.appid,
        playtime_forever: g.playtime_forever,
        user_rating: g.user_rating,
      }));

    const recentlyPlayed = games
      .filter((g) => g.last_played)
      .sort((a, b) => {
        const dateA = a.last_played ? new Date(a.last_played).getTime() : 0;
        const dateB = b.last_played ? new Date(b.last_played).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5)
      .map((g) => ({
        id: g.id,
        name: g.name,
        appid: g.appid,
        last_played: g.last_played,
      }));

    return NextResponse.json({
      data: {
        overview: {
          totalGames,
          totalPlaytime,
          averageRating: parseFloat(averageRating.toFixed(2)),
          favoriteCount,
          reviewCount,
        },
        statusDistribution: statusCounts,
        mostPlayed,
        recentlyPlayed,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
