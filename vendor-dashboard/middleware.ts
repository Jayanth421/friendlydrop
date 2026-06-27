import { NextRequest, NextResponse } from "next/server";

// All routes in vendor dashboard require vendor authentication
const PROTECTED_PREFIXES = ["/dashboard", "/products", "/orders", "/inventory", "/customers", "/wallet", "/analytics", "/settings"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if user needs authentication (all routes except auth pages)
  const isAuthPage = ["/login", "/signup", "/forgot-password", "/reset-password"].includes(pathname);
  const isApiRoute = pathname.startsWith("/api");
  const isStaticRoute = pathname.startsWith("/_next") || pathname === "/favicon.ico";
  
  const needsAuth = !isAuthPage && !isApiRoute && !isStaticRoute;
  const session = request.cookies.get("friendlydrop_session")?.value;

  let response: NextResponse;

  if (needsAuth && !session) {
    // Redirect to main website login with return URL to vendor subdomain
    const loginUrl = new URL("https://friendlydrop.in/login");
    loginUrl.searchParams.set("redirect", `https://vendor.friendlydrop.in${pathname}`);
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