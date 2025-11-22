import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers";

interface SteamProfile {
  steamid: string;
  personaname: string;
  avatarfull: string;
  profileurl: string;
}

declare function Steam(
  options?: Partial<OAuthUserConfig<SteamProfile>>,
): OAuthConfig<SteamProfile>;

export default Steam;
export type { SteamProfile };
