import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export interface Session {
  user: {
    id: string;
    email: string;
    username?: string;
    avatar_url?: string;
    steamid?: string;
  };
}

export async function auth(): Promise<Session | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url, steamid")
    .eq("user_id", user.id)
    .single();

  return {
    user: {
      id: user.id,
      email: user.email || "",
      username: profile?.username,
      avatar_url: profile?.avatar_url,
      steamid: profile?.steamid,
    },
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const cookieStore = await cookies();
  cookieStore.delete("sb-access-token");
  cookieStore.delete("sb-refresh-token");
}

export async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id || null;
}

export async function requireAuth(): Promise<Session> {
  const session = await auth();

  if (!session) {
    throw new Error("Unauthorized");
  }

  return session;
}
