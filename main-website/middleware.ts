import { NextRequest, NextResponse } from "next/server";

// Auth-protected paths for main website (customer routes only)
const AUTH_PREFIXES = ["/cart", "/checkout", "/orders", "/wishlist", "/account"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if user needs authentication for customer routes
  const needsAuth = AUTH_PREFIXES.some((p) => pathname.startsWith(p));
  const session = request.cookies.get("friendlydrop_session")?.value;

  let response: NextResponse;

  if (needsAuth && !session) {
    // Redirect to login with return URL
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    response = NextResponse.redirect(loginUrl);
  } else {
    response = NextResponse.next();
  }

  // Security headers
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};