import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/register"];

function isValidJwt(token: string): boolean {
  return token.split(".").length === 3;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect authenticated users away from public pages
  if (PUBLIC_PATHS.includes(pathname)) {
    const token = request.cookies.get("mv_token")?.value;
    if (token && isValidJwt(token)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // For backend proxy paths, inject Authorization header from cookie
  if (pathname.startsWith("/api/backend/")) {
    const token = request.cookies.get("mv_token")?.value;
    if (token) {
      const headers = new Headers(request.headers);
      headers.set("Authorization", `Bearer ${token}`);
      return NextResponse.next({ request: { headers } });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/register", "/api/backend/:path*"],
};
