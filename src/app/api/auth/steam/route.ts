import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  if (searchParams.get("openid.mode") === "id_res") {
    try {
      const isValid = await verifySteamResponse(searchParams);

      if (!isValid) {
        return NextResponse.redirect(new URL("/login?error=invalid", APP_URL));
      }

      const identity = searchParams.get("openid.identity") || "";
      const steamId = identity.split("/").pop();

      if (!steamId) {
        return NextResponse.redirect(
          new URL("/login?error=no_steam_id", APP_URL),
        );
      }

      const steamData = await fetchSteamUserData(steamId);

      if (!steamData) {
        return NextResponse.redirect(
          new URL("/login?error=steam_api", APP_URL),
        );
      }

      const supabase = await createClient();

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("steamid", steamId)
        .single();

      let userId: string;

      if (existingProfile) {
        userId = existingProfile.user_id;
      } else {
        const dummyEmail = `${steamId}@steam.local`;
        const randomPassword = Math.random().toString(36).slice(-16);

        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email: dummyEmail,
            password: randomPassword,
          },
        );

        if (authError || !authData.user) {
          console.error("Auth error:", authError);
          return NextResponse.redirect(
            new URL("/login?error=auth_failed", APP_URL),
          );
        }

        userId = authData.user.id;

        await supabase.from("profiles").insert({
          user_id: userId,
          steamid: steamId,
          username: steamData.personaname,
          avatar_url: steamData.avatarfull,
        });
      }

      const dummyEmail = `${steamId}@steam.local`;
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: dummyEmail,
        password: steamId,
      });

      if (signInError) {
        const randomPassword = Math.random().toString(36).slice(-16);
        await supabase.auth.admin.updateUserById(userId, {
          password: randomPassword,
        });
      }

      return NextResponse.redirect(new URL("/?steam_login=success", APP_URL));
    } catch (error) {
      console.error("Steam auth error:", error);
      return NextResponse.redirect(new URL("/login?error=unknown", APP_URL));
    }
  }

  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": `${APP_URL}/api/auth/steam`,
    "openid.realm": APP_URL,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });

  return NextResponse.redirect(`${STEAM_OPENID_URL}?${params.toString()}`);
}

async function verifySteamResponse(params: URLSearchParams): Promise<boolean> {
  const verificationParams = new URLSearchParams();

  params.forEach((value, key) => {
    verificationParams.append(key, value);
  });

  verificationParams.set("openid.mode", "check_authentication");

  try {
    const response = await fetch(STEAM_OPENID_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: verificationParams.toString(),
    });

    const text = await response.text();
    return text.includes("is_valid:true");
  } catch (error) {
    console.error("Steam verification error:", error);
    return false;
  }
}

async function fetchSteamUserData(steamId: string) {
  const apiKey = process.env.STEAM_API_KEY;

  if (!apiKey) {
    console.error("Steam API key not configured");
    return null;
  }

  try {
    const response = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId}`,
    );

    const data = await response.json();
    return data.response?.players?.[0] || null;
  } catch (error) {
    console.error("Error fetching Steam user data:", error);
    return null;
  }
}
