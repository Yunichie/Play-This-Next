import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers";

interface SteamProfile {
  steamid: string;
  personaname: string;
  avatarfull: string;
  profileurl: string;
}

interface SteamTokens {
  access_token?: string;
  token_type?: string;
}

interface TokenRequestContext {
  params: {
    url?: string;
  };
  tokens: SteamTokens;
}

interface UserInfoContext {
  tokens: SteamTokens;
}

export default function Steam(
  options?: Partial<OAuthUserConfig<SteamProfile>>,
): OAuthConfig<SteamProfile> {
  const STEAM_API_KEY = process.env.STEAM_API_KEY;
  const NEXTAUTH_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const config: OAuthConfig<SteamProfile> = {
    id: "steam",
    name: "Steam",
    type: "oauth",
    checks: ["none"],
    wellKnown: undefined,
    authorization: {
      url: "https://steamcommunity.com/openid/login",
      params: {
        "openid.mode": "checkid_setup",
        "openid.ns": "http://specs.openid.net/auth/2.0",
        "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
        "openid.claimed_id":
          "http://specs.openid.net/auth/2.0/identifier_select",
        "openid.return_to": `${NEXTAUTH_URL}/api/auth/callback/steam`,
        "openid.realm": NEXTAUTH_URL,
      },
    },
    token: {
      url: "https://steamcommunity.com/openid/login",
      async request(context: TokenRequestContext) {
        const url = new URL(context.params.url || "");
        const claimedId = url.searchParams.get("openid.claimed_id");

        if (!claimedId) {
          throw new Error("No claimed_id in response");
        }

        const steamId = claimedId.split("/").pop();

        if (!steamId) {
          throw new Error("Could not extract Steam ID");
        }

        const verifyParams = new URLSearchParams();
        url.searchParams.forEach((value, key) => {
          verifyParams.append(key, value);
        });
        verifyParams.set("openid.mode", "check_authentication");

        const verifyResponse = await fetch(
          "https://steamcommunity.com/openid/login",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: verifyParams.toString(),
          },
        );

        const verifyText = await verifyResponse.text();

        if (!verifyText.includes("is_valid:true")) {
          throw new Error("Invalid Steam OpenID response");
        }

        return {
          tokens: {
            access_token: steamId,
            token_type: "Bearer",
          },
        };
      },
    },
    userinfo: {
      url: "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/",
      async request(context: UserInfoContext) {
        const steamId = context.tokens.access_token;

        if (!STEAM_API_KEY) {
          throw new Error("STEAM_API_KEY not configured");
        }

        const response = await fetch(
          `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${steamId}`,
        );

        const data = await response.json();
        const player = data.response?.players?.[0];

        if (!player) {
          throw new Error("Could not fetch Steam profile");
        }

        return player as SteamProfile;
      },
    },
    profile(profile: SteamProfile) {
      return {
        id: profile.steamid,
        name: profile.personaname,
        email: null,
        image: profile.avatarfull,
        steamid: profile.steamid,
      };
    },
    style: {
      logo: "/steam-logo.svg",
      bg: "#000",
      text: "#fff",
    },
  };

  return {
    ...config,
    ...options,
  } as OAuthConfig<SteamProfile>;
}
