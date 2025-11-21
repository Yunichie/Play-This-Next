import { auth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, TrendingUp, Target, Award } from "lucide-react";
import { formatPlaytime, formatHours } from "@/lib/utils";
import { StatsCharts } from "@/components/stats/stats-charts";

export default async function StatsPage() {
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

  const { data: games } = await supabase
    .from("user_games")
    .select("*")
    .eq("user_id", session.user.id)
    .order("playtime_forever", { ascending: false });

  const totalGames = games?.length || 0;
  const totalPlaytime =
    games?.reduce((sum, g) => sum + g.playtime_forever, 0) || 0;
  const averageRating =
    games && games.length > 0
      ? games
          .filter((g) => g.user_rating !== null)
          .reduce(
            (sum, g, _, arr) => sum + (g.user_rating || 0) / arr.length,
            0,
          )
      : 0;

  const completedGames =
    games?.filter((g) => g.status === "completed").length || 0;
  const completionRate =
    totalGames > 0 ? (completedGames / totalGames) * 100 : 0;

  const mostPlayed = games?.slice(0, 10) || [];

  const statusDistribution =
    games?.reduce(
      (acc, game) => {
        acc[game.status] = (acc[game.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ) || {};

  const reviewedGames = games?.filter((g) => g.user_review).length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Your Gaming Statistics</h1>
        <p className="text-muted-foreground mt-1">
          Insights into your gaming journey
        </p>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              Total Playtime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatHours(totalPlaytime)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {totalGames} games
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4 text-green-500" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {completionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {completedGames} of {totalGames} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              Average Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {averageRating.toFixed(1)}/10
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {reviewedGames} reviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-500" />
              Library Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalGames}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Games in collection
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <StatsCharts
        statusDistribution={statusDistribution}
        mostPlayed={mostPlayed}
      />

      {/* Most Played Games */}
      <Card>
        <CardHeader>
          <CardTitle>Most Played Games</CardTitle>
          <CardDescription>Your top 10 by playtime</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mostPlayed.map((game, index) => (
              <div
                key={game.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{game.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatPlaytime(game.playtime_forever)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {game.user_rating && (
                    <div className="text-sm font-medium text-yellow-500">
                      ⭐ {game.user_rating}/10
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
