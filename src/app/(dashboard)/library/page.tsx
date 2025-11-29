import { auth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { LibraryHeader } from "@/components/library/library-header";
import { GameGrid } from "@/components/library/game-grid";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface SearchParams {
  status?: string;
  search?: string;
  sort?: string;
}

function GameGridLoading() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {[...Array(12)].map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-[16/9] w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

async function LibraryStats({ userId }: { userId: string }) {
  const supabase = await createClient();

  const [
    totalResult,
    backlogResult,
    playingResult,
    completedResult,
    droppedResult,
    favoriteResult,
  ] = await Promise.all([
    supabase
      .from("user_games")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("user_games")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "backlog"),
    supabase
      .from("user_games")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "playing"),
    supabase
      .from("user_games")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed"),
    supabase
      .from("user_games")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "dropped"),
    supabase
      .from("user_games")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_favorite", true),
  ]);

  return (
    <LibraryHeader
      totalGames={totalResult.count || 0}
      backlogCount={backlogResult.count || 0}
      playingCount={playingResult.count || 0}
      completedCount={completedResult.count || 0}
      droppedCount={droppedResult.count || 0}
      favoriteCount={favoriteResult.count || 0}
    />
  );
}

async function GamesSection({
  userId,
  params,
}: {
  userId: string;
  params: SearchParams;
}) {
  const supabase = await createClient();

  let query = supabase.from("user_games").select("*").eq("user_id", userId);

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

  query = query.limit(100);

  const { data: games, error } = await query;

  if (error) {
    console.error("Error fetching games:", error);
    return <div>Error loading games</div>;
  }

  return <GameGrid games={games || []} />;
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

  const params = await searchParams;

  return (
    <div className="space-y-6">
      {}
      <Suspense
        fallback={
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        }
      >
        <LibraryStats userId={session.user.id} />
      </Suspense>

      {}
      <Suspense fallback={<GameGridLoading />}>
        <GamesSection userId={session.user.id} params={params} />
      </Suspense>
    </div>
  );
}

export const dynamic = "force-dynamic";
export const revalidate = 60;
