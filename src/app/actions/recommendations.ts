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

    const { data: games } = await supabase
      .from("user_games")
      .select("*")
      .eq("user_id", session.user.id)
      .order("playtime_forever", { ascending: false });

    if (!games || games.length === 0) {
      return {
        recommendations: [],
        error: "No games in library. Please sync your Steam library first.",
      };
    }

    const completedGames = games.filter((g) => g.status === "completed");
    const droppedGames = games.filter((g) => g.status === "dropped");
    const playingGames = games.filter((g) => g.status === "playing");
    const backlogGames = games.filter(
      (g) => g.status === "backlog" && g.playtime_forever < 60,
    );
    const highRatedGames = games.filter(
      (g) => g.user_rating && g.user_rating >= 8,
    );
    const lowRatedGames = games.filter(
      (g) => g.user_rating && g.user_rating <= 5,
    );

    if (backlogGames.length === 0) {
      return {
        recommendations: [],
        error: "No games in backlog to recommend.",
      };
    }

    const userContext = {
      totalGames: games.length,
      completedCount: completedGames.length,
      droppedCount: droppedGames.length,
      playingCount: playingGames.length,
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
          review: g.user_review,
        })),

      dislikedGames: droppedGames.slice(0, 5).map((g) => ({
        name: g.name,
        rating: g.user_rating,
        disliked: g.disliked_aspects || [],
        review: g.user_review,
      })),

      currentlyPlaying: playingGames.slice(0, 3).map((g) => ({
        name: g.name,
        hours: Math.round(g.playtime_forever / 60),
      })),
    };

    const availableGames = backlogGames.slice(0, 30).map((g) => ({
      appid: g.appid,
      name: g.name,
      hltb_main: g.hltb_main,
      hltb_completionist: g.hltb_completionist,
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

    const prompt = `You are an expert game recommendation assistant. Analyze the user's gaming profile and recommend exactly 3 games from their backlog.

USER GAMING PROFILE:
- Total Library: ${userContext.totalGames} games
- Completed: ${userContext.completedCount} | Dropped: ${userContext.droppedCount} | Playing: ${userContext.playingCount} | Backlog: ${userContext.backlogCount}

TOP PLAYED GAMES:
${userContext.topPlayed.map((g) => `- ${g.name}: ${g.hours}h played${g.rating ? `, rated ${g.rating}/10` : ""}, ${g.status}`).join("\n")}

LOVED GAMES (High Rated & Completed):
${userContext.lovedGames.length > 0 ? userContext.lovedGames.map((g) => `- ${g.name} (${g.rating}/10)${g.liked.length > 0 ? `\n  Liked: ${g.liked.join(", ")}` : ""}${g.review ? `\n  Review: ${g.review.substring(0, 150)}` : ""}`).join("\n") : "None yet"}

DROPPED/DISLIKED GAMES:
${userContext.dislikedGames.length > 0 ? userContext.dislikedGames.map((g) => `- ${g.name}${g.rating ? ` (${g.rating}/10)` : ""}${g.disliked.length > 0 ? `\n  Disliked: ${g.disliked.join(", ")}` : ""}`).join("\n") : "None"}

CURRENTLY PLAYING:
${userContext.currentlyPlaying.length > 0 ? userContext.currentlyPlaying.map((g) => `- ${g.name} (${g.hours}h)`).join("\n") : "None"}

AVAILABLE BACKLOG GAMES:
${availableGames.map((g) => `- ${g.name} (ID: ${g.appid})${g.hltb_main ? `, ~${g.hltb_main}h to beat` : ""}${g.playtime_hours > 0 ? `, ${g.playtime_hours}h played` : ", unplayed"}`).join("\n")}

TASK:
1. Analyze the user's preferences based on their loved games and what they enjoy
2. Avoid recommending games similar to their dropped/disliked games
3. Consider their current gaming habits and time availability
4. Recommend EXACTLY 3 games from the backlog above
5. Rank them by match quality - the first one should be THE BEST match (highest priority)

Return ONLY valid JSON in this exact format:
{
  "recommendations": [
    {
      "appid": 123456,
      "name": "Game Name",
      "reasoning": "Clear explanation of why this is the BEST match (2-3 sentences). Reference specific games they loved and why this is similar or what need it fills.",
      "matchScore": 95,
      "estimatedPlaytime": "15-20 hours",
      "isBestPick": true
    },
    {
      "appid": 234567,
      "name": "Second Game",
      "reasoning": "Why this is also a great choice (2 sentences)",
      "matchScore": 88,
      "estimatedPlaytime": "25-30 hours",
      "isBestPick": false
    },
    {
      "appid": 345678,
      "name": "Third Game",
      "reasoning": "Why this rounds out the top 3 (2 sentences)",
      "matchScore": 82,
      "estimatedPlaytime": "10-12 hours",
      "isBestPick": false
    }
  ]
}

IMPORTANT:
- Only the FIRST recommendation should have "isBestPick": true
- Match scores should be realistic (75-95 range) and descending
- Use actual hours from hltb_main if available, otherwise estimate
- Only recommend games from the backlog list provided
- Be specific in reasoning - reference actual games they enjoyed`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    try {
      const parsed = JSON.parse(response);

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
            typeof rec.matchScore === "number" &&
            typeof rec.isBestPick === "boolean",
        )
        .slice(0, 3);

      if (validRecs.length === 0) {
        return { recommendations: [], error: "No valid recommendations found" };
      }

      validRecs.forEach((rec: any, idx: number) => {
        rec.isBestPick = idx === 0;
      });

      return { recommendations: validRecs };
    } catch (parseError) {
      console.error("Failed to parse AI response:", response);
      console.error("Parse error:", parseError);

      const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        const validRecs = (parsed.recommendations || []).slice(0, 3);
        validRecs.forEach((rec: any, idx: number) => {
          rec.isBestPick = idx === 0;
        });
        return { recommendations: validRecs };
      }

      return { recommendations: [], error: "Failed to parse AI response" };
    }
  } catch (error) {
    console.error("Error getting AI recommendations:", error);
    return { recommendations: [], error: "Failed to get recommendations" };
  }
}
