import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signIn } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const steamAuthData = cookieStore.get("steam_auth_data")?.value;

    if (!steamAuthData) {
      return NextResponse.redirect(
        new URL("/login?error=auth_data_missing", request.url),
      );
    }

    const { steamid, username, avatar } = JSON.parse(steamAuthData);

    cookieStore.delete("steam_auth_data");

    await signIn("steam", {
      steamid,
      username,
      avatar,
      redirect: false,
    });

    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    console.error("Error signing in with Steam:", error);
    return NextResponse.redirect(
      new URL("/login?error=signin_failed", request.url),
    );
  }
}
