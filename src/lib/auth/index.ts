import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "Steam",
      id: "steam",
      credentials: {
        steamid: { label: "Steam ID", type: "text" },
        username: { label: "Username", type: "text" },
        avatar: { label: "Avatar", type: "text" },
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({
            steamid: z.string(),
            username: z.string(),
            avatar: z.string().optional(),
          })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { steamid, username, avatar } = parsedCredentials.data;

          const supabase = await createClient();

          const { data: profile } = await supabase
            .from("profiles")
            .select()
            .eq("steamid", steamid)
            .single();

          if (profile) {
            return {
              id: profile.user_id,
              name: username,
              image: avatar,
              steamid,
            };
          }

          return null;
        }
        return null;
      },
    }),
    Credentials({
      name: "Email",
      id: "email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({
            email: z.string().email(),
            password: z.string().min(6),
          })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;

          const supabase = await createClient();
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error || !data.user) {
            return null;
          }

          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.username || email,
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.steamid = (user as any).steamid;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        (session.user as any).steamid = token.steamid;
      }
      return session;
    },
  },
});
