import { NextRequest, NextResponse } from "next/server";
import { generateSteamLoginUrl, generateState } from "@/lib/steam/openid";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const callbackUrl = request.nextUrl.searchParams.get("callbackUrl") || "/";
    const isLinking = request.nextUrl.searchParams.get("link") === "true";

    const state = generateState();

    const cookieStore = await cookies();
    cookieStore.set("steam_auth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    cookieStore.set("steam_callback_url", callbackUrl, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });

    if (isLinking) {
      cookieStore.set("steam_is_linking", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600,
        path: "/",
      });
    }

    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
      throw new Error("Base URL not configured");
    }

    const returnUrl = `${baseUrl}/api/auth/steam/callback?state=${state}`;
    const realm = baseUrl;

    const steamLoginUrl = generateSteamLoginUrl(returnUrl, realm);

    return NextResponse.redirect(steamLoginUrl);
  } catch (error) {
    console.error("Error initiating Steam login:", error);
    return NextResponse.redirect(
      new URL("/login?error=steam_init_failed", request.url),
    );
  }
}
