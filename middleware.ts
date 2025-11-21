import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth?.user;
  const { pathname } = req.nextUrl;

  const isOnLogin = pathname.startsWith("/login");
  const isOnPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api");

  if (isOnPublicRoute && !pathname.startsWith("/api/auth")) {
    if (pathname === "/" && !isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn && !isOnLogin) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isLoggedIn && isOnLogin) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
