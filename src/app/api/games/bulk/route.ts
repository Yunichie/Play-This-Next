import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auth } from "@/lib/auth";
import { z } from "zod";

const bulkUpdateSchema = z.object({
  gameIds: z.array(z.string().uuid()),
  updates: z.object({
    status: z
      .enum(["backlog", "playing", "completed", "dropped", "shelved"])
      .optional(),
    is_favorite: z.boolean().optional(),
  }),
});

const bulkDeleteSchema = z.object({
  gameIds: z.array(z.string().uuid()),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = bulkUpdateSchema.parse(body);

    if (validated.gameIds.length === 0) {
      return NextResponse.json(
        { error: "No games specified" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data: games, error } = await supabase
      .from("user_games")
      .update({
        ...validated.updates,
        updated_at: new Date().toISOString(),
      })
      .in("id", validated.gameIds)
      .eq("user_id", session.user.id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: games,
      updated: games?.length || 0,
      message: `Updated ${games?.length || 0} games`,
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

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = bulkDeleteSchema.parse(body);

    if (validated.gameIds.length === 0) {
      return NextResponse.json(
        { error: "No games specified" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("user_games")
      .delete()
      .in("id", validated.gameIds)
      .eq("user_id", session.user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      deleted: validated.gameIds.length,
      message: `Deleted ${validated.gameIds.length} games`,
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
