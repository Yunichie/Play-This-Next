import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      steamid?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    steamid?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    steamid?: string;
  }
}
