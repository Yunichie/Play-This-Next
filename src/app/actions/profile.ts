"use server";

import { createClient } from "@/lib/supabase/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function deleteAccount() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();

  try {
    const { error: gamesError } = await supabase
      .from("user_games")
      .delete()
      .eq("user_id", session.user.id);

    if (gamesError) throw gamesError;

    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("user_id", session.user.id);

    if (profileError) throw profileError;

    await supabase.auth.signOut();
  } catch (error) {
    console.error("Delete account error:", error);
    return { error: "Failed to delete account" };
  }

  redirect("/login");
}
