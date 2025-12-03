import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auth } from "@/lib/auth";
import { z } from "zod";

const gameSchema = z.object({
  appid: z.number(),
  name: z.string(),
  status: z
    .enum(["backlog", "playing", "completed", "dropped", "shelved"])
    .optional(),
  user_rating: z.number().min(0).max(10).nullable().optional(),
  user_review: z.string().nullable().optional(),
  liked_aspects: z.array(z.string()).nullable().optional(),
  disliked_aspects: z.array(z.string()).nullable().optional(),
  is_favorite: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "name";
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    const supabase = await createClient();
    let query = supabase
      .from("user_games")
      .select("*", { count: "exact" })
      .eq("user_id", session.user.id);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    switch (sort) {
      case "playtime":
        query = query.order("playtime_forever", { ascending: false });
        break;
      case "rating":
        query = query.order("user_rating", {
          ascending: false,
          nullsFirst: false,
        });
        break;
      case "recent":
        query = query.order("last_played", {
          ascending: false,
          nullsFirst: false,
        });
        break;
      default:
        query = query.order("name", { ascending: true });
    }

    query = query.range(offset, offset + limit - 1);

    const { data: games, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: games,
      count,
      limit,
      offset,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
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
    const validated = gameSchema.parse(body);

    const supabase = await createClient();

    const { data: existing } = await supabase
      .from("user_games")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("appid", validated.appid)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Game already in library" },
        { status: 409 },
      );
    }

    const { data: game, error } = await supabase
      .from("user_games")
      .insert({
        user_id: session.user.id,
        appid: validated.appid,
        name: validated.name,
        status: validated.status || "backlog",
        user_rating: validated.user_rating,
        user_review: validated.user_review,
        liked_aspects: validated.liked_aspects,
        disliked_aspects: validated.disliked_aspects,
        is_favorite: validated.is_favorite || false,
        playtime_forever: 0,
        playtime_2weeks: 0,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: game }, { status: 201 });
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
