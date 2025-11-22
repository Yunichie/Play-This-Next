import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface GameRecommendation {
  appid: number;
  name: string;
  reasoning: string;
  estimatedPlaytime: string;
  matchScore: number;
}

export interface UserGameContext {
  name: string;
  appid: number;
  playtime: number;
  rating?: number;
  review?: string;
  liked_aspects?: string[];
  disliked_aspects?: string[];
  status: string;
  hltb_main?: number;
}

export async function getAIRecommendations(
  userQuery: string,
  userGames: UserGameContext[],
  topGenres: { genre: string; playtime: number }[],
): Promise<GameRecommendation[]> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        responseMimeType: "application/json",
      },
    });

    const mostPlayedGames = userGames
      .sort((a, b) => b.playtime - a.playtime)
      .slice(0, 10)
      .map(
        (g) =>
          `${g.name} (${Math.round(g.playtime / 60)}h played${g.rating ? `, rated ${g.rating}/10` : ""})`,
      )
      .join(", ");

    const backlogGames = userGames
      .filter((g) => g.status === "backlog" || g.playtime < 60)
      .map((g) => ({
        name: g.name,
        appid: g.appid,
        hltb: g.hltb_main || 0,
        playtime: Math.round(g.playtime / 60),
      }));

    if (backlogGames.length === 0) {
      return [];
    }

    const prompt = `You are a game recommendation assistant. Analyze the user's gaming profile and recommend games from their backlog.

USER PROFILE:
- Most Played: ${mostPlayedGames || "None"}
- Total Games: ${userGames.length}

USER REQUEST: "${userQuery}"

AVAILABLE BACKLOG (unplayed/barely played games):
${backlogGames
  .slice(0, 20)
  .map(
    (g) =>
      `- ${g.name} (ID: ${g.appid}, ~${g.hltb || "?"}h to beat, ${g.playtime}h played)`,
  )
  .join("\n")}

INSTRUCTIONS:
1. Recommend 3-5 games from the backlog that match the user's request
2. Consider their playtime preferences and request context
3. Return ONLY valid JSON with this structure:

{
  "recommendations": [
    {
      "appid": 123456,
      "name": "Game Name",
      "reasoning": "Brief explanation why this fits (1-2 sentences)",
      "estimatedPlaytime": "10-15 hours",
      "matchScore": 85
    }
  ]
}

Match scores should be realistic (60-95 range). Only recommend from the backlog list above.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    try {
      const parsed = JSON.parse(response);

      if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
        console.error("Invalid response structure:", parsed);
        return [];
      }

      const validRecs = parsed.recommendations.filter(
        (rec: any) =>
          rec.appid &&
          rec.name &&
          rec.reasoning &&
          rec.matchScore >= 0 &&
          rec.matchScore <= 100,
      );

      return validRecs.slice(0, 5);
    } catch (parseError) {
      console.error("Failed to parse AI response:", response);
      console.error("Parse error:", parseError);

      const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        return parsed.recommendations || [];
      }

      return [];
    }
  } catch (error) {
    console.error("Error getting AI recommendations:", error);
    throw error;
  }
}

export async function streamAIChat(
  message: string,
  userGames: UserGameContext[],
  topGenres: { genre: string; playtime: number }[],
): Promise<ReadableStream> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.8,
      topP: 0.9,
    },
  });

  const mostPlayedGames = userGames
    .sort((a, b) => b.playtime - a.playtime)
    .slice(0, 10)
    .map((g) => `${g.name} (${Math.round(g.playtime / 60)}h)`)
    .join(", ");

  const favoriteGenres = topGenres
    .slice(0, 5)
    .map((g) => g.genre)
    .join(", ");

  const prompt = `You are a friendly game recommendation assistant. The user owns ${userGames.length} games.
Their most played: ${mostPlayedGames}
Favorite genres: ${favoriteGenres}

User: ${message}

Provide helpful, conversational recommendations from their library. Be specific about game names and why they'd enjoy them.`;

  const result = await model.generateContentStream(prompt);

  return new ReadableStream({
    async start(controller) {
      for await (const chunk of result.stream) {
        const text = chunk.text();
        controller.enqueue(new TextEncoder().encode(text));
      }
      controller.close();
    },
  });
}
