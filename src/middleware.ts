import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const secureCookie = req.nextUrl.protocol === "https:";
  const cookieName = secureCookie
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie,
    cookieName,
    salt: cookieName,
  });
  const isLoggedIn = !!token;

  const { pathname } = req.nextUrl;

  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  const isPublicApi =
    pathname.startsWith("/api/auth") ||
    pathname === "/api/register" ||
    pathname === "/api/debug-env";
  const isPublicPage = pathname === "/";
  const isApi = pathname.startsWith("/api/");

  if (isPublicApi) return NextResponse.next();

  if (isAuthPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn && !isPublicPage) {
    if (isApi) {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|static|favicon.ico|uploads|manifest.webmanifest|sw.js|icon-|apple-touch-icon|favicon-).*)"],
};
