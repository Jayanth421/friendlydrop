import { NextRequest, NextResponse } from "next/server";

const authRoutes = ["/cart", "/checkout", "/orders", "/wishlist", "/account", "/vendor", "/admin-2fa"];
const adminRoute = "/admin";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("friendlydrop_session")?.value;
  const { pathname } = request.nextUrl;

  const needsAuth = authRoutes.some((route) => pathname.startsWith(route));
  const needsAdminAuth = pathname.startsWith(adminRoute);

  if ((needsAuth || needsAdminAuth) && !session) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
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
