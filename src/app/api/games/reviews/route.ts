import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const minRating = searchParams.get("minRating");
    const maxRating = searchParams.get("maxRating");

    const supabase = await createClient();

    let query = supabase
      .from("user_games")
      .select("*")
      .eq("user_id", session.user.id)
      .not("user_review", "is", null);

    if (minRating) {
      query = query.gte("user_rating", parseInt(minRating));
    }
    if (maxRating) {
      query = query.lte("user_rating", parseInt(maxRating));
    }

    const { data: games, error } = await query.order("updated_at", {
      ascending: false,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: games,
      count: games?.length || 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
