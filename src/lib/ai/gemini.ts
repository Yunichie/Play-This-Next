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
        temperature: 0.8,
        topP: 0.9,
        maxOutputTokens: 2048,
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

    const favoriteGenres = topGenres
      .slice(0, 5)
      .map((g) => `${g.genre} (${Math.round(g.playtime / 60)}h)`)
      .join(", ");

    const likedAspects = userGames
      .flatMap((g) => g.liked_aspects || [])
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 10)
      .join(", ");

    const dislikedAspects = userGames
      .flatMap((g) => g.disliked_aspects || [])
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 10)
      .join(", ");

    const backlogGames = userGames
      .filter((g) => g.status === "backlog" || g.playtime < 60)
      .map((g) => ({
        name: g.name,
        appid: g.appid,
        hltb: g.hltb_main || 0,
      }));

    const prompt = `You are an expert game recommendation assistant for Steam libraries.

USER'S GAMING PROFILE:
- Most Played Games: ${mostPlayedGames || "None yet"}
- Favorite Genres: ${favoriteGenres || "Not enough data"}
- Liked Aspects: ${likedAspects || "Not specified"}
- Disliked Aspects: ${dislikedAspects || "Not specified"}
- Total Games in Library: ${userGames.length}

USER'S REQUEST: "${userQuery}"

AVAILABLE BACKLOG GAMES (games user owns but hasn't played much):
${backlogGames.map((g) => `- ${g.name} (appid: ${g.appid}, ~${g.hltb || "?"}h to beat)`).join("\n")}

TASK: Recommend 3-5 games from the user's backlog that best match their request. Consider:
1. The user's query (mood, time available, preferred genre, etc.)
2. Their favorite genres and most played games
3. What they liked/disliked in other games
4. Estimated playtime (HLTB data provided)

Return ONLY valid JSON in this exact format (no codeblock, no extra text):
{
  "recommendations": [
    {
      "appid": 123456,
      "name": "Game Name",
      "reasoning": "Why this game fits the request (2-3 sentences)",
      "estimatedPlaytime": "10-15 hours",
      "matchScore": 95
    }
  ]
}

CRITICAL: Only recommend games from the backlog list above. Match score should be 0-100.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid JSON response from AI");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.recommendations || [];
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
