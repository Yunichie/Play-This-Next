import { createBrowserClient } from "@supabase/ssr";
import { Database } from "./database.types";

let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null =
  null;

export function createClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  supabaseClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return document.cookie.split("; ").reduce(
            (acc, cookie) => {
              const [name, value] = cookie.split("=");
              if (name && value) {
                acc.push({ name, value: decodeURIComponent(value) });
              }
              return acc;
            },
            [] as { name: string; value: string }[],
          );
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            const cookieOptions = [];
            if (options?.path) cookieOptions.push(`path=${options.path}`);
            if (options?.maxAge)
              cookieOptions.push(`max-age=${options.maxAge}`);
            if (options?.domain) cookieOptions.push(`domain=${options.domain}`);
            if (options?.sameSite)
              cookieOptions.push(`samesite=${options.sameSite}`);
            if (options?.secure) cookieOptions.push("secure");
            if (options?.httpOnly) cookieOptions.push("httponly");

            document.cookie = `${name}=${encodeURIComponent(value)}${cookieOptions.length ? "; " + cookieOptions.join("; ") : ""}`;
          });
        },
      },
    },
  );

  return supabaseClient;
}
