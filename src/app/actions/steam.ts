"use server";

import { createClient } from "@/lib/supabase/server";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function linkSteamAccount(
  steamId: string,
  username: string,
  avatarUrl: string,
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const supabase = await createClient();

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("steamid", steamId)
      .neq("user_id", session.user.id)
      .single();

    if (existingProfile) {
      return { error: "This Steam account is already linked to another user" };
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        steamid: steamId,
        username: username,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Error linking Steam account:", error);
      return { error: "Failed to link Steam account" };
    }

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Steam link error:", error);
    return { error: "Failed to link Steam account" };
  }
}

export async function unlinkSteamAccount() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("profiles")
      .update({
        steamid: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Error unlinking Steam account:", error);
      return { error: "Failed to unlink Steam account" };
    }

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Steam unlink error:", error);
    return { error: "Failed to unlink Steam account" };
  }
}

export async function checkSteamLinkStatus() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { isLinked: false };
    }

    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("steamid")
      .eq("user_id", session.user.id)
      .single();

    return {
      isLinked: !!profile?.steamid,
      steamId: profile?.steamid,
    };
  } catch (error) {
    console.error("Check Steam link error:", error);
    return { isLinked: false };
  }
}
