import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auth } from "@/lib/auth";

export async function GET_RATING_STATS(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: games } = await supabase
      .from("user_games")
      .select("user_rating")
      .eq("user_id", session.user.id)
      .not("user_rating", "is", null);

    if (!games || games.length === 0) {
      return NextResponse.json({
        data: {
          totalRatings: 0,
          averageRating: 0,
          distribution: {},
        },
      });
    }

    const ratings = games.map((g) => g.user_rating!);
    const totalRatings = ratings.length;
    const averageRating = ratings.reduce((sum, r) => sum + r, 0) / totalRatings;

    const distribution = ratings.reduce(
      (acc, rating) => {
        acc[rating] = (acc[rating] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>,
    );

    return NextResponse.json({
      data: {
        totalRatings,
        averageRating: parseFloat(averageRating.toFixed(2)),
        distribution,
        highestRated: Math.max(...ratings),
        lowestRated: Math.min(...ratings),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
