import crypto from "crypto";

const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";
const STEAM_API_BASE = "https://api.steampowered.com";

export interface SteamOpenIDParams {
  "openid.ns": string;
  "openid.mode": string;
  "openid.return_to": string;
  "openid.realm": string;
  "openid.identity": string;
  "openid.claimed_id": string;
}

export interface SteamUser {
  steamid: string;
  personaname: string;
  avatarfull: string;
  profileurl: string;
}

export function generateSteamLoginUrl(
  returnUrl: string,
  realm: string,
): string {
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": returnUrl,
    "openid.realm": realm,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });

  return `${STEAM_OPENID_URL}?${params.toString()}`;
}

export async function validateSteamLogin(
  params: Record<string, string>,
): Promise<string | null> {
  try {
    if (
      !params["openid.claimed_id"] ||
      !params["openid.sig"] ||
      !params["openid.signed"]
    ) {
      console.error("Missing required OpenID parameters");
      return null;
    }

    const steamIdMatch = params["openid.claimed_id"].match(
      /^https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/,
    );

    if (!steamIdMatch) {
      console.error("Invalid claimed_id format");
      return null;
    }

    const steamId = steamIdMatch[1];

    const verificationParams = new URLSearchParams();
    verificationParams.set("openid.mode", "check_authentication");

    Object.entries(params).forEach(([key, value]) => {
      if (key.startsWith("openid.") && key !== "openid.mode") {
        verificationParams.set(key, value);
      }
    });

    const verifyResponse = await fetch(STEAM_OPENID_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: verificationParams.toString(),
    });

    const verifyText = await verifyResponse.text();

    if (!verifyText.includes("is_valid:true")) {
      console.error("Steam OpenID validation failed");
      return null;
    }

    return steamId;
  } catch (error) {
    console.error("Error validating Steam login:", error);
    return null;
  }
}

export async function getSteamUserDetails(
  steamId: string,
): Promise<SteamUser | null> {
  try {
    const apiKey = process.env.STEAM_API_KEY;
    if (!apiKey) {
      console.error("STEAM_API_KEY not configured");
      return null;
    }

    const url = new URL(`${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/`);
    url.searchParams.append("key", apiKey);
    url.searchParams.append("steamids", steamId);

    const response = await fetch(url.toString());
    const data = await response.json();

    const player = data?.response?.players?.[0];
    if (!player) {
      return null;
    }

    return {
      steamid: player.steamid,
      personaname: player.personaname,
      avatarfull: player.avatarfull,
      profileurl: player.profileurl,
    };
  } catch (error) {
    console.error("Error fetching Steam user details:", error);
    return null;
  }
}

export function generateState(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function verifyState(
  providedState: string,
  sessionState: string,
): boolean {
  return providedState === sessionState;
}
