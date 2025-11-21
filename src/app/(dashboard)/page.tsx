import { auth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Clock, Star, TrendingUp, Gamepad2 } from "lucide-react";
import { formatPlaytime } from "@/lib/utils";
import { HeroRecommendation } from "@/components/home/hero-recommendation";
import { QuickStats } from "@/components/home/quick-stats";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", session.user.id)
    .single();

  const { data: recentGames } = await supabase
    .from("user_games")
    .select("*")
    .eq("user_id", session!.user.id)
    .order("last_played", { ascending: false, nullsFirst: false })
    .limit(5);

  const { data: backlogGames, count: backlogCount } = await supabase
    .from("user_games")
    .select("*", { count: "exact", head: false })
    .eq("user_id", session!.user.id)
    .eq("status", "backlog")
    .limit(3);

  const { count: completedCount } = await supabase
    .from("user_games")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session!.user.id)
    .eq("status", "completed");

  const { count: playingCount } = await supabase
    .from("user_games")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session!.user.id)
    .eq("status", "playing");

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">
          Welcome back, {profile?.username || "Player"}!
        </h1>
        <p className="text-muted-foreground text-lg">
          Ready to discover your next gaming adventure?
        </p>
      </div>

      {}
      <QuickStats
        totalGames={profile?.total_games || 0}
        totalPlaytime={profile?.total_playtime || 0}
        backlogCount={backlogCount || 0}
        completedCount={completedCount || 0}
        playingCount={playingCount || 0}
      />

      {}
      <HeroRecommendation />

      {}
      {recentGames && recentGames.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Recently Played</h2>
            <Link href="/library">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentGames.map((game) => (
              <Card
                key={game.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative aspect-video">
                  <img
                    src={game.img_url || "/placeholder-game.jpg"}
                    alt={game.name}
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <h3 className="font-semibold text-white text-sm line-clamp-1">
                      {game.name}
                    </h3>
                  </div>
                </div>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatPlaytime(game.playtime_forever)}</span>
                    </div>
                    {game.user_rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        <span>{game.user_rating}/10</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {}
      {backlogGames && backlogGames.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Your Backlog</h2>
            <Link href="/library?status=backlog">
              <Button variant="ghost" size="sm">
                View All ({backlogCount})
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {backlogGames.map((game) => (
              <Card
                key={game.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative aspect-video">
                  <img
                    src={game.img_url || "/placeholder-game.jpg"}
                    alt={game.name}
                    className="object-cover w-full h-full"
                  />
                </div>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base line-clamp-1">
                    {game.name}
                  </CardTitle>
                  {game.hltb_main && (
                    <CardDescription>
                      ~{game.hltb_main}h to beat
                    </CardDescription>
                  )}
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {}
      <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <CardHeader>
          <CardTitle className="text-2xl">Not sure what to play?</CardTitle>
          <CardDescription className="text-base">
            Let our AI assistant help you find the perfect game based on your
            mood, available time, and preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/chat">
            <Button size="lg" className="gradient-1">
              <Gamepad2 className="w-5 h-5 mr-2" />
              Chat with AI
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
