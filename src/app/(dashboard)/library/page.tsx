import { auth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { LibraryHeader } from "@/components/library/library-header";
import { GameGrid } from "@/components/library/game-grid";

interface SearchParams {
  status?: string;
  search?: string;
  sort?: string;
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const supabase = await createClient();
  const params = await searchParams;

  // Build query
  let query = supabase
    .from("user_games")
    .select("*")
    .eq("user_id", session.user.id);

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  if (params.search) {
    query = query.ilike("name", `%${params.search}%`);
  }

  switch (params.sort) {
    case "name":
      query = query.order("name", { ascending: true });
      break;
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

  const { data: games, error } = await query;

  if (error) {
    console.error("Error fetching games:", error);
  }

  const { count: backlogCount } = await supabase
    .from("user_games")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session.user.id)
    .eq("status", "backlog");

  const { count: playingCount } = await supabase
    .from("user_games")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session.user.id)
    .eq("status", "playing");

  const { count: completedCount } = await supabase
    .from("user_games")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session.user.id)
    .eq("status", "completed");

  const { count: droppedCount } = await supabase
    .from("user_games")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session.user.id)
    .eq("status", "dropped");

  const { count: favoriteCount } = await supabase
    .from("user_games")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session.user.id)
    .eq("is_favorite", true);

  return (
    <div className="space-y-6">
      <LibraryHeader
        totalGames={games?.length || 0}
        backlogCount={backlogCount || 0}
        playingCount={playingCount || 0}
        completedCount={completedCount || 0}
        droppedCount={droppedCount || 0}
        favoriteCount={favoriteCount || 0}
      />

      <GameGrid games={games || []} />
    </div>
  );
}
