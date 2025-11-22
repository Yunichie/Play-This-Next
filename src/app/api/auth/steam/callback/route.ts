// src/app/api/auth/steam/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  validateSteamLogin,
  getSteamUserDetails,
  verifyState,
} from "@/lib/steam/openid";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { auth, signIn } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cookieStore = await cookies();

    // Get state from cookie and URL
    const sessionState = cookieStore.get("steam_auth_state")?.value;
    const urlState = searchParams.get("state");

    // Verify CSRF state
    if (!sessionState || !urlState || !verifyState(urlState, sessionState)) {
      console.error("State verification failed");
      return NextResponse.redirect(
        new URL("/login?error=invalid_state", request.url),
      );
    }

    // Convert search params to a plain object
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    // Validate Steam OpenID response
    const steamId = await validateSteamLogin(params);

    if (!steamId) {
      console.error("Steam validation failed");
      return NextResponse.redirect(
        new URL("/login?error=steam_validation_failed", request.url),
      );
    }

    // Get Steam user details
    const steamUser = await getSteamUserDetails(steamId);

    if (!steamUser) {
      console.error("Failed to fetch Steam user details");
      return NextResponse.redirect(
        new URL("/login?error=steam_user_fetch_failed", request.url),
      );
    }

    // Check if this is a linking operation
    const isLinking = cookieStore.get("steam_is_linking")?.value === "true";
    const callbackUrl = cookieStore.get("steam_callback_url")?.value || "/";

    // Clean up cookies
    cookieStore.delete("steam_auth_state");
    cookieStore.delete("steam_callback_url");
    cookieStore.delete("steam_is_linking");

    const supabase = await createClient();

    if (isLinking) {
      // Link Steam account to existing user
      const session = await auth();

      if (!session?.user?.id) {
        return NextResponse.redirect(
          new URL("/login?error=not_authenticated", request.url),
        );
      }

      // Check if Steam ID is already linked to another account
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("steamid", steamId)
        .single();

      if (existingProfile && existingProfile.user_id !== session.user.id) {
        return NextResponse.redirect(
          new URL("/settings?error=steam_already_linked", request.url),
        );
      }

      // Update user's profile with Steam ID
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          steamid: steamId,
          username: steamUser.personaname,
          avatar_url: steamUser.avatarfull,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", session.user.id);

      if (updateError) {
        console.error("Error linking Steam account:", updateError);
        return NextResponse.redirect(
          new URL("/settings?error=link_failed", request.url),
        );
      }

      return NextResponse.redirect(
        new URL("/settings?success=steam_linked", request.url),
      );
    } else {
      // Regular Steam login
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("steamid", steamId)
        .single();

      if (existingProfile) {
        // User exists, sign them in
        // We'll use a custom credential flow
        const response = NextResponse.redirect(
          new URL(callbackUrl, request.url),
        );

        // Store Steam auth data in a temporary cookie for the auth callback
        cookieStore.set(
          "steam_auth_data",
          JSON.stringify({
            steamid: steamId,
            username: steamUser.personaname,
            avatar: steamUser.avatarfull,
          }),
          {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60, // 1 minute
            path: "/",
          },
        );

        return NextResponse.redirect(
          new URL("/api/auth/steam/signin", request.url),
        );
      } else {
        // New user, create profile
        // First, create or get Supabase auth user
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email: `steam_${steamId}@playthisnext.app`,
            password: crypto.randomUUID(),
            options: {
              data: {
                steamid: steamId,
                username: steamUser.personaname,
              },
            },
          },
        );

        if (authError || !authData.user) {
          // Try to sign in if user already exists
          const { data: signInData, error: signInError } =
            await supabase.auth.signInWithPassword({
              email: `steam_${steamId}@playthisnext.app`,
              password: crypto.randomUUID(),
            });

          if (signInError) {
            console.error("Error creating/signing in user:", signInError);
            return NextResponse.redirect(
              new URL("/login?error=auth_failed", request.url),
            );
          }
        }

        const userId = authData?.user?.id;

        if (!userId) {
          return NextResponse.redirect(
            new URL("/login?error=user_creation_failed", request.url),
          );
        }

        // Create profile
        const { error: profileError } = await supabase.from("profiles").insert({
          user_id: userId,
          steamid: steamId,
          username: steamUser.personaname,
          avatar_url: steamUser.avatarfull,
        });

        if (profileError) {
          console.error("Error creating profile:", profileError);
        }

        // Store Steam auth data for signin
        cookieStore.set(
          "steam_auth_data",
          JSON.stringify({
            steamid: steamId,
            username: steamUser.personaname,
            avatar: steamUser.avatarfull,
          }),
          {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60,
            path: "/",
          },
        );

        return NextResponse.redirect(
          new URL("/api/auth/steam/signin", request.url),
        );
      }
    }
  } catch (error) {
    console.error("Error in Steam callback:", error);
    return NextResponse.redirect(
      new URL("/login?error=callback_failed", request.url),
    );
  }
}
