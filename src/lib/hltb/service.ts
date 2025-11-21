import { HowLongToBeatService, HowLongToBeatEntry } from "howlongtobeat";

const hltbService = new HowLongToBeatService();

export interface HLTBData {
  main: number;
  completionist: number;
  name: string;
}

export async function getGamePlaytime(
  gameName: string,
): Promise<HLTBData | null> {
  try {
    const cleanName = gameName
      .replace(/[™®©]/g, "")
      .replace(/\s*:\s*/g, " ")
      .trim();

    const results = await hltbService.search(cleanName);

    if (!results || results.length === 0) {
      return null;
    }

    const bestMatch = results[0];

    return {
      main: Math.round(bestMatch.gameplayMain || 0),
      completionist: Math.round(bestMatch.gameplayCompletionist || 0),
      name: bestMatch.name,
    };
  } catch (error) {
    console.error(`Error fetching HLTB data for ${gameName}:`, error);
    return null;
  }
}

export async function batchGetGamePlaytimes(
  gameNames: string[],
): Promise<Map<string, HLTBData>> {
  const results = new Map<string, HLTBData>();

  const batchSize = 5;
  for (let i = 0; i < gameNames.length; i += batchSize) {
    const batch = gameNames.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (name) => {
        const data = await getGamePlaytime(name);
        if (data) {
          results.set(name, data);
        }
      }),
    );

    if (i + batchSize < gameNames.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return results;
}
