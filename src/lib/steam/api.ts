const STEAM_API_KEY = process.env.STEAM_API_KEY!;
const STEAM_API_BASE = "https://api.steampowered.com";

export interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number;
  playtime_2weeks?: number;
  img_icon_url?: string;
  img_logo_url?: string;
  rtime_last_played?: number;
}

export interface SteamPlayerSummary {
  steamid: string;
  personaname: string;
  avatarfull: string;
  profileurl: string;
}

export async function getOwnedGames(steamid: string): Promise<SteamGame[]> {
  try {
    const url = new URL(`${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/`);
    url.searchParams.append("key", STEAM_API_KEY);
    url.searchParams.append("steamid", steamid);
    url.searchParams.append("include_appinfo", "true");
    url.searchParams.append("include_played_free_games", "true");
    url.searchParams.append("format", "json");

    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`Steam API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response?.games || [];
  } catch (error) {
    console.error("Error fetching owned games:", error);
    return [];
  }
}

export async function getRecentlyPlayedGames(
  steamid: string,
): Promise<SteamGame[]> {
  try {
    const url = new URL(
      `${STEAM_API_BASE}/IPlayerService/GetRecentlyPlayedGames/v1/`,
    );
    url.searchParams.append("key", STEAM_API_KEY);
    url.searchParams.append("steamid", steamid);
    url.searchParams.append("count", "10");
    url.searchParams.append("format", "json");

    const response = await fetch(url.toString(), {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`Steam API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response?.games || [];
  } catch (error) {
    console.error("Error fetching recently played games:", error);
    return [];
  }
}

export async function getPlayerSummary(
  steamid: string,
): Promise<SteamPlayerSummary | null> {
  try {
    const url = new URL(`${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/`);
    url.searchParams.append("key", STEAM_API_KEY);
    url.searchParams.append("steamids", steamid);
    url.searchParams.append("format", "json");

    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`Steam API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response?.players?.[0] || null;
  } catch (error) {
    console.error("Error fetching player summary:", error);
    return null;
  }
}

export function getSteamImageUrl(
  appid: number,
  hash: string,
  size: "icon" | "logo" = "logo",
): string {
  if (!hash) {
    return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`;
  }
  return `https://media.steampowered.com/steamcommunity/public/images/apps/${appid}/${hash}.jpg`;
}

export function getSteamHeaderUrl(appid: number): string {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`;
}

export interface SteamAchievement {
  name: string;
  defaultvalue: number;
  displayName: string;
  hidden: number;
  description: string;
  icon: string;
  icongray: string;
}

export interface SteamGameSchema {
  game: {
    gameName: string;
    gameVersion: string;
    availableGameStats: {
      achievements: SteamAchievement[];
    };
  };
}

export interface SteamAchievementPercentage {
  name: string;
  percent: number;
}

export async function getGameSchema(
  appid: number,
): Promise<SteamGameSchema | null> {
  try {
    const url = new URL(
      `${STEAM_API_BASE}/ISteamUserStats/GetSchemaForGame/v2/`,
    );
    url.searchParams.append("key", STEAM_API_KEY);
    url.searchParams.append("appid", appid.toString());

    const response = await fetch(url.toString(), {
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching game schema:", error);
    return null;
  }
}

export async function getGlobalAchievementPercentages(
  appid: number,
): Promise<SteamAchievementPercentage[]> {
  try {
    const url = new URL(
      `${STEAM_API_BASE}/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/`,
    );
    url.searchParams.append("gameid", appid.toString());

    const response = await fetch(url.toString(), {
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.achievementpercentages?.achievements || [];
  } catch (error) {
    console.error("Error fetching global achievement percentages:", error);
    return [];
  }
}

export interface PlayerAchievement {
  apiname: string;
  achieved: number;
  unlocktime: number;
}

export interface PlayerAchievementsResponse {
  playerstats: {
    steamID: string;
    gameName: string;
    achievements: PlayerAchievement[];
  };
}

export async function getPlayerAchievements(
  steamid: string,
  appid: number,
): Promise<PlayerAchievement[]> {
  try {
    const url = new URL(
      `${STEAM_API_BASE}/ISteamUserStats/GetPlayerAchievements/v1/`,
    );
    url.searchParams.append("key", STEAM_API_KEY);
    url.searchParams.append("steamid", steamid);
    url.searchParams.append("appid", appid.toString());

    const response = await fetch(url.toString(), {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return [];
    }

    const data: PlayerAchievementsResponse = await response.json();
    return data.playerstats?.achievements || [];
  } catch (error) {
    console.error("Error fetching player achievements:", error);
    return [];
  }
}
