import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auth } from "@/lib/auth";
import { z } from "zod";

const searchSchema = z.object({
  query: z.string().min(1),
  status: z
    .enum(["backlog", "playing", "completed", "dropped", "shelved", "all"])
    .optional(),
  minRating: z.number().min(0).max(10).optional(),
  maxRating: z.number().min(0).max(10).optional(),
  minPlaytime: z.number().min(0).optional(),
  maxPlaytime: z.number().min(0).optional(),
  isFavorite: z.boolean().optional(),
  hasReview: z.boolean().optional(),
  sortBy: z.enum(["name", "playtime", "rating", "recent", "added"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = searchSchema.parse(body);

    const supabase = await createClient();

    let query = supabase
      .from("user_games")
      .select("*", { count: "exact" })
      .eq("user_id", session.user.id);

    if (validated.query) {
      query = query.ilike("name", `%${validated.query}%`);
    }

    if (validated.status && validated.status !== "all") {
      query = query.eq("status", validated.status);
    }

    if (validated.minRating !== undefined) {
      query = query.gte("user_rating", validated.minRating);
    }
    if (validated.maxRating !== undefined) {
      query = query.lte("user_rating", validated.maxRating);
    }

    if (validated.minPlaytime !== undefined) {
      query = query.gte("playtime_forever", validated.minPlaytime);
    }
    if (validated.maxPlaytime !== undefined) {
      query = query.lte("playtime_forever", validated.maxPlaytime);
    }

    if (validated.isFavorite !== undefined) {
      query = query.eq("is_favorite", validated.isFavorite);
    }
    if (validated.hasReview) {
      query = query.not("user_review", "is", null);
    }

    const sortBy = validated.sortBy || "name";
    const sortOrder = validated.sortOrder || "asc";
    const ascending = sortOrder === "asc";

    switch (sortBy) {
      case "playtime":
        query = query.order("playtime_forever", { ascending });
        break;
      case "rating":
        query = query.order("user_rating", { ascending, nullsFirst: false });
        break;
      case "recent":
        query = query.order("last_played", { ascending, nullsFirst: false });
        break;
      case "added":
        query = query.order("created_at", { ascending });
        break;
      default:
        query = query.order("name", { ascending });
    }

    const limit = validated.limit || 20;
    const offset = validated.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data: games, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: games,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
