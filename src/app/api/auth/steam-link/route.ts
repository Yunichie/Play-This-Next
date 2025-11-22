import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { linkSteamAccount } from "@/app/actions/steam";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const searchParams = request.nextUrl.searchParams;
    const claimedId = searchParams.get("openid.claimed_id");

    if (!claimedId) {
      return NextResponse.redirect(
        new URL("/settings?error=steam_auth_failed", request.url),
      );
    }

    const steamId = claimedId.split("/").pop();

    if (!steamId) {
      return NextResponse.redirect(
        new URL("/settings?error=invalid_steam_id", request.url),
      );
    }

    const verifyParams = new URLSearchParams();
    searchParams.forEach((value, key) => {
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
      return NextResponse.redirect(
        new URL("/settings?error=steam_verification_failed", request.url),
      );
    }

    const STEAM_API_KEY = process.env.STEAM_API_KEY;
    const profileResponse = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${steamId}`,
    );

    const profileData = await profileResponse.json();
    const player = profileData.response?.players?.[0];

    if (!player) {
      return NextResponse.redirect(
        new URL("/settings?error=steam_profile_fetch_failed", request.url),
      );
    }

    const result = await linkSteamAccount(
      steamId,
      player.personaname,
      player.avatarfull,
    );

    if (result.error) {
      return NextResponse.redirect(
        new URL(
          `/settings?error=${encodeURIComponent(result.error)}`,
          request.url,
        ),
      );
    }

    return NextResponse.redirect(
      new URL("/settings?steam_link=success", request.url),
    );
  } catch (error) {
    console.error("Steam link callback error:", error);
    return NextResponse.redirect(
      new URL("/settings?error=unexpected_error", request.url),
    );
  }
}
