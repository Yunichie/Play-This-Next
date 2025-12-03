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
      .select("status, playtime_forever, user_rating")
      .eq("user_id", session.user.id);

    if (!games) {
      return NextResponse.json({ error: "No games found" }, { status: 404 });
    }

    const statusDistribution = games.reduce(
      (acc, game) => {
        acc[game.status] = (acc[game.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const playtimeRanges = {
      "0-1h": 0,
      "1-5h": 0,
      "5-10h": 0,
      "10-50h": 0,
      "50-100h": 0,
      "100+h": 0,
    };

    games.forEach((game) => {
      const hours = game.playtime_forever / 60;
      if (hours < 1) playtimeRanges["0-1h"]++;
      else if (hours < 5) playtimeRanges["1-5h"]++;
      else if (hours < 10) playtimeRanges["5-10h"]++;
      else if (hours < 50) playtimeRanges["10-50h"]++;
      else if (hours < 100) playtimeRanges["50-100h"]++;
      else playtimeRanges["100+h"]++;
    });

    const ratingDistribution = Array.from({ length: 11 }, (_, i) => ({
      rating: i,
      count: games.filter((g) => g.user_rating === i).length,
    }));

    return NextResponse.json({
      data: {
        statusDistribution,
        playtimeRanges,
        ratingDistribution,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
