"use server";

import { createClient } from "@/lib/supabase/server";
import { auth } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface TopRecommendation {
  appid: number;
  name: string;
  reasoning: string;
  matchScore: number;
  estimatedPlaytime: string;
  isBestPick: boolean;
}

async function generateRecommendations(
  games: any[],
): Promise<{ recommendations: TopRecommendation[]; error?: string }> {
  if (!games || games.length === 0) {
    return { recommendations: [], error: "No games in library" };
  }

  const completedGames = games.filter((g) => g.status === "completed");
  const droppedGames = games.filter((g) => g.status === "dropped");
  const backlogGames = games.filter(
    (g) => g.status === "backlog" && g.playtime_forever < 60,
  );
  const highRatedGames = games.filter(
    (g) => g.user_rating && g.user_rating >= 8,
  );

  if (backlogGames.length === 0) {
    return { recommendations: [], error: "No games in backlog" };
  }

  const userContext = {
    totalGames: games.length,
    completedCount: completedGames.length,
    backlogCount: backlogGames.length,
    topPlayed: games.slice(0, 10).map((g) => ({
      name: g.name,
      hours: Math.round(g.playtime_forever / 60),
      rating: g.user_rating,
      status: g.status,
    })),
    lovedGames: highRatedGames
      .filter((g) => g.status === "completed")
      .slice(0, 5)
      .map((g) => ({
        name: g.name,
        rating: g.user_rating,
        liked: g.liked_aspects || [],
      })),
    dislikedGames: droppedGames.slice(0, 3).map((g) => ({
      name: g.name,
      disliked: g.disliked_aspects || [],
    })),
  };

  const availableGames = backlogGames.slice(0, 20).map((g) => ({
    appid: g.appid,
    name: g.name,
    hltb_main: g.hltb_main,
    playtime_hours: Math.round(g.playtime_forever / 60),
  }));

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.8,
      topP: 0.95,
      responseMimeType: "application/json",
    },
  });

  const prompt = `Recommend 3 games from backlog based on user profile.

TOP PLAYED: ${userContext.topPlayed.map((g) => g.name).join(", ")}
LOVED: ${userContext.lovedGames.map((g) => g.name).join(", ")}
AVOIDED: ${userContext.dislikedGames.map((g) => g.name).join(", ")}

BACKLOG: ${availableGames.map((g) => `${g.name} (${g.appid}, ${g.hltb_main || "?"}h)`).join(", ")}

Return JSON:
{
  "recommendations": [
    {"appid": 123, "name": "Game", "reasoning": "2 sentences", "matchScore": 90, "estimatedPlaytime": "10-15h", "isBestPick": true},
    {"appid": 456, "name": "Game2", "reasoning": "2 sentences", "matchScore": 85, "estimatedPlaytime": "20h", "isBestPick": false},
    {"appid": 789, "name": "Game3", "reasoning": "2 sentences", "matchScore": 80, "estimatedPlaytime": "15h", "isBestPick": false}
  ]
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    let cleanResponse = response.trim();
    if (cleanResponse.startsWith("```json")) {
      cleanResponse = cleanResponse
        .replace(/```json\n?/, "")
        .replace(/```\n?$/, "")
        .trim();
    }

    const parsed = JSON.parse(cleanResponse);

    if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
      console.error("Invalid AI response structure:", parsed);
      return { recommendations: [], error: "Invalid AI response" };
    }

    const validRecs = parsed.recommendations
      .filter(
        (rec: any) =>
          rec.appid &&
          rec.name &&
          rec.reasoning &&
          typeof rec.matchScore === "number",
      )
      .slice(0, 3);

    validRecs.forEach((rec: any, idx: number) => {
      rec.isBestPick = idx === 0;
    });

    return { recommendations: validRecs, error: undefined };
  } catch (error) {
    console.error("AI error:", error);
    return {
      recommendations: [],
      error: "Failed to generate recommendations",
    };
  }
}

export async function getTop3Recommendations(): Promise<{
  recommendations: TopRecommendation[];
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { recommendations: [], error: "Unauthorized" };
    }

    const supabase = await createClient();

    const { data: games, error: gamesError } = await supabase
      .from("user_games")
      .select(
        "name, appid, playtime_forever, user_rating, status, user_review, liked_aspects, disliked_aspects, hltb_main",
      )
      .eq("user_id", session.user.id)
      .order("playtime_forever", { ascending: false });

    if (gamesError || !games) {
      return { recommendations: [], error: "Failed to fetch games" };
    }

    return await generateRecommendations(games);
  } catch (error) {
    console.error("Error getting recommendations:", error);
    return { recommendations: [], error: "Failed to get recommendations" };
  }
}

let cachedRecommendations: {
  data: { recommendations: TopRecommendation[]; error?: string };
  timestamp: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getCachedTop3Recommendations(): Promise<{
  recommendations: TopRecommendation[];
  error?: string;
}> {
  if (
    cachedRecommendations &&
    Date.now() - cachedRecommendations.timestamp < CACHE_DURATION
  ) {
    return cachedRecommendations.data;
  }

  const result = await getTop3Recommendations();

  cachedRecommendations = {
    data: result,
    timestamp: Date.now(),
  };

  return result;
}
