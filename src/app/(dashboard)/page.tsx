import { auth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import { QuickStats } from "@/components/home/quick-stats";
import { SmartRecommendationsCarousel } from "@/components/home/smart-recommendations-carousel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function QuickStatsLoading() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i} className="glass border-border/50">
          <CardHeader className="pb-2">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-4 w-20 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RecommendationsLoading() {
  return (
    <Card className="p-12 text-center glass border-border/50">
      <Skeleton className="w-8 h-8 mx-auto mb-4 rounded-full" />
      <Skeleton className="h-4 w-64 mx-auto" />
    </Card>
  );
}

async function StatsSection({ userId }: { userId: string }) {
  const supabase = await createClient();

  const [profileResult, backlogResult, completedResult, playingResult] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).single(),
      supabase
        .from("user_games")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "backlog"),
      supabase
        .from("user_games")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "completed"),
      supabase
        .from("user_games")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "playing"),
    ]);

  return (
    <QuickStats
      totalGames={profileResult.data?.total_games || 0}
      totalPlaytime={profileResult.data?.total_playtime || 0}
      backlogCount={backlogResult.count || 0}
      completedCount={completedResult.count || 0}
      playingCount={playingResult.count || 0}
    />
  );
}

async function RecommendationsSection({ userId }: { userId: string }) {
  const supabase = await createClient();

  const { data: games } = await supabase
    .from("user_games")
    .select("*")
    .eq("user_id", userId)
    .order("playtime_forever", { ascending: false })
    .limit(50);

  if (!games || games.length === 0) {
    return null;
  }

  return <SmartRecommendationsCarousel initialGames={games} />;
}

export default async function HomePage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("user_id", session.user.id)
    .single();

  return (
    <div className="space-y-8 animate-fadeIn">
      {}
      <div className="space-y-2">
        <h1 className="text-5xl font-bold tracking-tight">
          Welcome back, {profile?.username || "Player"}
        </h1>
        <p className="text-lg text-muted-foreground">
          Let's find your next gaming adventure
        </p>
      </div>

      {}
      <Suspense fallback={<QuickStatsLoading />}>
        <StatsSection userId={session.user.id} />
      </Suspense>

      {}
      <Suspense fallback={<RecommendationsLoading />}>
        <RecommendationsSection userId={session.user.id} />
      </Suspense>

      {}
      <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-primary/5 via-card/50 to-accent/5 backdrop-blur-sm">
        <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
        <CardHeader className="relative z-10">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-primary/10">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">
                Need more suggestions?
              </CardTitle>
              <p className="text-muted-foreground">
                Chat with our AI assistant for personalized recommendations
                based on your mood, available time, and specific preferences.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
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
