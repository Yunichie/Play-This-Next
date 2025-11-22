import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    Credentials({
      name: "Email",
      id: "credentials",
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

        if (!parsedCredentials.success) {
          return null;
        }

        const { email, password } = parsedCredentials.data;

        try {
          const supabase = await createClient();
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error || !data.user) {
            console.error("Auth error:", error);
            return null;
          }

          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select()
            .eq("user_id", data.user.id)
            .single();

          if (profileError) {
            await supabase.from("profiles").insert({
              user_id: data.user.id,
              username: email.split("@")[0],
            });
          }

          return {
            id: data.user.id,
            email: data.user.email!,
            name: profile?.username || email.split("@")[0],
            image: profile?.avatar_url,
          };
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }

      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
  debug: true,
});
