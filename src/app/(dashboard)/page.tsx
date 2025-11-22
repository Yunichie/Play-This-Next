import { auth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Clock, Star, Sparkles, ArrowRight } from "lucide-react";
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
    .limit(6);

  const { data: backlogGames, count: backlogCount } = await supabase
    .from("user_games")
    .select("*", { count: "exact", head: false })
    .eq("user_id", session!.user.id)
    .eq("status", "backlog")
    .limit(4);

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
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-5xl font-bold tracking-tight">
          Welcome back, {profile?.username || "Player"}
        </h1>
        <p className="text-lg text-muted-foreground">
          Let's find your next gaming adventure
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
            <h2 className="text-2xl font-semibold tracking-tight">
              Recently Played
            </h2>
            <Link href="/library">
              <Button variant="ghost" size="sm" className="group">
                View All
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentGames.map((game, index) => (
              <Card
                key={game.id}
                className="group overflow-hidden elevated border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all cursor-pointer"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="relative aspect-video overflow-hidden bg-muted">
                  <img
                    src={game.img_url || "/placeholder-game.jpg"}
                    alt={game.name}
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <h3 className="font-semibold text-white text-sm line-clamp-1 drop-shadow-lg">
                      {game.name}
                    </h3>
                  </div>
                </div>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{formatPlaytime(game.playtime_forever)}</span>
                    </div>
                    {game.user_rating && (
                      <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="font-medium">
                          {game.user_rating}/10
                        </span>
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
            <h2 className="text-2xl font-semibold tracking-tight">
              Your Backlog
            </h2>
            <Link href="/library?status=backlog">
              <Button variant="ghost" size="sm" className="group">
                View All ({backlogCount})
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {backlogGames.map((game, index) => (
              <Card
                key={game.id}
                className="group overflow-hidden elevated border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="relative aspect-video overflow-hidden bg-muted">
                  <img
                    src={game.img_url || "/placeholder-game.jpg"}
                    alt={game.name}
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm line-clamp-1">
                    {game.name}
                  </CardTitle>
                  {game.hltb_main && (
                    <p className="text-xs text-muted-foreground">
                      ~{game.hltb_main}h to beat
                    </p>
                  )}
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {}
      <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-primary/5 via-card/50 to-accent/5 backdrop-blur-sm">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-primary/10">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">
                Not sure what to play?
              </CardTitle>
              <p className="text-muted-foreground">
                Let our AI assistant analyze your library and recommend the
                perfect game based on your mood, available time, and
                preferences.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Link href="/chat">
            <Button size="lg" className="group">
              Chat with AI
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
