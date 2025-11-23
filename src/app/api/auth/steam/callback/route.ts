import { NextRequest, NextResponse } from "next/server";
import {
  validateSteamLogin,
  getSteamUserDetails,
  verifyState,
} from "@/lib/steam/openid";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

function getSteamPassword(steamId: string): string {
  const secret =
    process.env.NEXTAUTH_SECRET || "fallback-secret-change-in-production";
  return `steam_${steamId}_${secret}`.substring(0, 72); // PostgreSQL max password length
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cookieStore = await cookies();

    const sessionState = cookieStore.get("steam_auth_state")?.value;
    const urlState = searchParams.get("state");

    if (!sessionState || !urlState || !verifyState(urlState, sessionState)) {
      console.error("State verification failed");
      return NextResponse.redirect(
        new URL("/login?error=invalid_state", request.url),
      );
    }

    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const steamId = await validateSteamLogin(params);

    if (!steamId) {
      console.error("Steam validation failed");
      return NextResponse.redirect(
        new URL("/login?error=steam_validation_failed", request.url),
      );
    }

    const steamUser = await getSteamUserDetails(steamId);

    if (!steamUser) {
      console.error("Failed to fetch Steam user details");
      return NextResponse.redirect(
        new URL("/login?error=steam_user_fetch_failed", request.url),
      );
    }

    const isLinking = cookieStore.get("steam_is_linking")?.value === "true";

    cookieStore.delete("steam_auth_state");
    cookieStore.delete("steam_callback_url");
    cookieStore.delete("steam_is_linking");

    const supabase = await createClient();

    const { data: existingProfile, error: profileCheckError } = await supabase
      .from("profiles")
      .select("user_id, username")
      .eq("steamid", steamId)
      .single();

    if (profileCheckError && profileCheckError.code !== "PGRST116") {
      console.error("Error checking profile:", profileCheckError);
      return NextResponse.redirect(
        new URL("/login?error=profile_check_failed", request.url),
      );
    }

    if (isLinking) {
      if (existingProfile) {
        console.log(
          "Steam account already linked to user:",
          existingProfile.user_id,
        );
        return NextResponse.redirect(
          new URL("/settings?error=steam_already_linked", request.url),
        );
      }

      return NextResponse.redirect(new URL("/settings", request.url));
    }

    if (existingProfile) {
      console.log(
        "Steam login - existing user found:",
        existingProfile.user_id,
      );

      const email = `steam_${steamId}@playthisnext.app`;
      const password = getSteamPassword(steamId);

      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

      if (signInError) {
        console.error("Sign in error for existing user:", signInError);
        return NextResponse.redirect(
          new URL("/login?error=signin_failed", request.url),
        );
      }

      if (!signInData.session) {
        return NextResponse.redirect(
          new URL("/login?error=no_session", request.url),
        );
      }

      const response = NextResponse.redirect(new URL("/", request.url));

      response.cookies.set({
        name: "sb-access-token",
        value: signInData.session.access_token,
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      });

      response.cookies.set({
        name: "sb-refresh-token",
        value: signInData.session.refresh_token,
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      });

      return response;
    } else {
      console.log(
        "Steam account not linked. Redirecting to manual account creation.",
      );

      return NextResponse.redirect(
        new URL(
          `/login?error=steam_not_linked&steam_name=${encodeURIComponent(steamUser.personaname)}`,
          request.url,
        ),
      );
    }
  } catch (error) {
    console.error("Error in Steam callback:", error);
    return NextResponse.redirect(
      new URL("/login?error=callback_failed", request.url),
    );
  }
}
