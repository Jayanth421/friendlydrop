import { NextRequest, NextResponse } from "next/server";

const authRoutes = ["/cart", "/checkout", "/orders", "/wishlist", "/account", "/vendor", "/admin-2fa"];
const adminRoute = "/admin";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("friendlydrop_session")?.value;
  const { pathname } = request.nextUrl;

  const needsAuth = authRoutes.some((route) => pathname.startsWith(route));
  const needsAdminAuth = pathname.startsWith(adminRoute);

  let response: NextResponse;

  if ((needsAuth || needsAdminAuth) && !session) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    response = NextResponse.redirect(url);
  } else {
    response = NextResponse.next();
  }

  // Inject HTTP security headers
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: [
    "/cart/:path*",
    "/checkout/:path*",
    "/orders/:path*",
    "/wishlist/:path*",
    "/account/:path*",
    "/vendor/:path*",
    "/admin/:path*",
    "/admin-2fa/:path*",
  ],
};
