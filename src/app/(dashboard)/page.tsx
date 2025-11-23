import { auth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { QuickStats } from "@/components/home/quick-stats";
import { SmartRecommendationsCarousel } from "@/components/home/smart-recommendations-carousel";

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

  const { data: allGames } = await supabase
    .from("user_games")
    .select("*")
    .eq("user_id", session!.user.id)
    .order("playtime_forever", { ascending: false });

  const { count: backlogCount } = await supabase
    .from("user_games")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session!.user.id)
    .eq("status", "backlog");

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
      <QuickStats
        totalGames={profile?.total_games || 0}
        totalPlaytime={profile?.total_playtime || 0}
        backlogCount={backlogCount || 0}
        completedCount={completedCount || 0}
        playingCount={playingCount || 0}
      />

      {}
      {allGames && allGames.length > 0 && (
        <SmartRecommendationsCarousel initialGames={allGames} />
      )}

      {/* AI Chat CTA */}
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
