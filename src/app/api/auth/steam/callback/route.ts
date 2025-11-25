import { NextRequest, NextResponse } from "next/server";
import {
  validateSteamLogin,
  getSteamUserDetails,
  verifyState,
} from "@/lib/steam/openid";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

function getSteamPassword(steamId: string): string {
  const secret = process.env.AUTH_SECRET;
  return `steam_${steamId}_${secret}`.substring(0, 72);
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
      .maybeSingle();

    if (profileCheckError && profileCheckError.code !== "PGRST116") {
      console.error("Error checking profile:", profileCheckError);
      return NextResponse.redirect(
        new URL("/login?error=profile_check_failed", request.url),
      );
    }

    if (isLinking) {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        return NextResponse.redirect(
          new URL("/login?error=not_authenticated", request.url),
        );
      }

      if (existingProfile && existingProfile.user_id !== currentUser.id) {
        return NextResponse.redirect(
          new URL("/settings?error=steam_already_linked", request.url),
        );
      }

      if (existingProfile && existingProfile.user_id === currentUser.id) {
        return NextResponse.redirect(
          new URL("/settings?error=steam_already_linked_to_you", request.url),
        );
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          steamid: steamId,
          username: steamUser.personaname,
          avatar_url: steamUser.avatarfull,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", currentUser.id);

      if (updateError) {
        console.error("Error linking Steam account:", updateError);
        return NextResponse.redirect(
          new URL("/settings?error=link_failed", request.url),
        );
      }

      return NextResponse.redirect(
        new URL("/settings?steam_link=success", request.url),
      );
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

        if (signInError.message?.includes("already registered")) {
          return NextResponse.redirect(
            new URL("/login?error=account_exists_contact_support", request.url),
          );
        }

        return NextResponse.redirect(
          new URL("/login?error=signin_failed", request.url),
        );
      }

      if (!signInData.session) {
        console.error("No session created for existing user");
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
    }

    console.log("Creating new account for Steam user:", steamId);

    const email = `steam_${steamId}@playthisnext.app`;
    const password = getSteamPassword(steamId);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      {
        email: email,
        password: password,
        options: {
          data: {
            username: steamUser.personaname,
            avatar_url: steamUser.avatarfull,
          },
        },
      },
    );

    if (signUpError) {
      console.error("Sign up error:", signUpError);

      if (
        signUpError.message?.includes("already registered") ||
        signUpError.message?.includes("already been registered")
      ) {
        console.log("Auth user exists, attempting to sign in instead");

        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: email,
            password: password,
          });

        if (signInError || !signInData.session) {
          console.error("Sign in error after failed signup:", signInError);
          return NextResponse.redirect(
            new URL("/login?error=account_exists_signin_failed", request.url),
          );
        }

        const { data: existingProfileCheck } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("user_id", signInData.user.id)
          .maybeSingle();

        if (!existingProfileCheck) {
          await supabase.from("profiles").insert({
            user_id: signInData.user.id,
            steamid: steamId,
            username: steamUser.personaname,
            avatar_url: steamUser.avatarfull,
            total_games: 0,
            total_playtime: 0,
          });
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
      }

      return NextResponse.redirect(
        new URL("/login?error=signup_failed", request.url),
      );
    }

    if (!signUpData.user) {
      console.error("No user returned from signup");
      return NextResponse.redirect(
        new URL("/login?error=signup_failed", request.url),
      );
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      user_id: signUpData.user.id,
      steamid: steamId,
      username: steamUser.personaname,
      avatar_url: steamUser.avatarfull,
      total_games: 0,
      total_playtime: 0,
    });

    if (profileError) {
      console.error("Error creating profile:", profileError);
    }

    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

    if (signInError || !signInData.session) {
      console.error("Sign in error after signup:", signInError);
      return NextResponse.redirect(
        new URL("/login?message=account_created_please_signin", request.url),
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
  } catch (error) {
    console.error("Error in Steam callback:", error);
    return NextResponse.redirect(
      new URL("/login?error=callback_failed", request.url),
    );
  }
}
