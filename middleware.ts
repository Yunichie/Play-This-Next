import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isLoggedIn = !!req.auth?.user;
  const isOnLogin = pathname === "/login";

  console.log("Middleware check:", { pathname, isLoggedIn, isOnLogin });

  if (isLoggedIn && isOnLogin) {
    console.log("Redirecting logged-in user from /login to /");
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  if (!isLoggedIn && !isOnLogin) {
    console.log("Redirecting non-logged-in user to /login");
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
