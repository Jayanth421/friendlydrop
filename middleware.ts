import { NextRequest, NextResponse } from "next/server";

// ─── Subdomain detection ────────────────────────────────────────────────────

/**
 * Returns which subdomain the request is for, or null for the main domain.
 *
 * Production:
 *   admin.friendlydrop.in  → "admin"
 *   vendor.friendlydrop.in → "vendor"
 *   friendlydrop.in        → null
 *
 * Local dev (add to /etc/hosts or use subdomains via env):
 *   admin.localhost:3000   → "admin"
 *   vendor.localhost:3000  → "vendor"
 *   localhost:3000         → null
 */
function detectSubdomain(request: NextRequest): "admin" | "vendor" | null {
  const host = (request.headers.get("host") ?? "").toLowerCase();
  const hostname = host.split(":")[0]; // strip port

  if (hostname === "admin.friendlydrop.in" || hostname === "admin.localhost") {
    return "admin";
  }
  if (hostname === "vendor.friendlydrop.in" || hostname === "vendor.localhost") {
    return "vendor";
  }
  return null;
}

// ─── Auth-protected paths on the main domain ────────────────────────────────

const AUTH_PREFIXES = ["/cart", "/checkout", "/orders", "/wishlist", "/account", "/admin-2fa"];

// ─── Middleware ──────────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const subdomain = detectSubdomain(request);

  // ── Skip static / Next internals ──────────────────────────────────────────
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname === "/favicon.ico"
  ) {
    return addSecurityHeaders(NextResponse.next());
  }

  // ── ADMIN subdomain (admin.friendlydrop.in) ───────────────────────────────
  if (subdomain === "admin") {
    const session = request.cookies.get("friendlydrop_session")?.value;

    // Serve login / public pages as-is (no rewrite needed)
    if (pathname === "/login" || pathname.startsWith("/api/")) {
      return addSecurityHeaders(NextResponse.next());
    }

    // Already prefixed by client-side Link (e.g. /admin/dashboard) — pass through
    // Only add /admin prefix for clean paths like /dashboard, /orders, /
    const internalPath = pathname.startsWith("/admin")
      ? pathname
      : pathname === "/"
      ? "/admin/control-tower"
      : `/admin${pathname}`;

    const rewriteUrl = new URL(internalPath, request.url);

    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return addSecurityHeaders(NextResponse.redirect(loginUrl));
    }

    return addSecurityHeaders(NextResponse.rewrite(rewriteUrl));
  }

  // ── VENDOR subdomain (vendor.friendlydrop.in) ─────────────────────────────
  if (subdomain === "vendor") {
    const session = request.cookies.get("friendlydrop_session")?.value;

    // Serve login / public pages as-is
    if (pathname === "/login" || pathname.startsWith("/api/")) {
      return addSecurityHeaders(NextResponse.next());
    }

    // Already prefixed by client-side Link (e.g. /vendor/dashboard) — pass through
    const internalPath = pathname.startsWith("/vendor")
      ? pathname
      : pathname === "/"
      ? "/vendor/dashboard"
      : `/vendor${pathname}`;

    const rewriteUrl = new URL(internalPath, request.url);

    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return addSecurityHeaders(NextResponse.redirect(loginUrl));
    }

    return addSecurityHeaders(NextResponse.rewrite(rewriteUrl));
  }

  // ── MAIN domain (friendlydrop.in) ─────────────────────────────────────────

  // Redirect /admin/* to admin subdomain
  if (pathname.startsWith("/admin")) {
    const adminBase =
      process.env.NEXT_PUBLIC_ADMIN_URL ??
      (request.nextUrl.hostname.includes("localhost")
        ? `http://admin.localhost:${request.nextUrl.port || 3000}`
        : "https://admin.friendlydrop.in");

    const subPath = pathname.replace(/^\/admin/, "") || "/";
    const destination = new URL(subPath, adminBase);
    destination.search = request.nextUrl.search;
    return addSecurityHeaders(NextResponse.redirect(destination));
  }

  // Redirect /vendor/* to vendor subdomain
  if (pathname.startsWith("/vendor")) {
    const vendorBase =
      process.env.NEXT_PUBLIC_VENDOR_URL ??
      (request.nextUrl.hostname.includes("localhost")
        ? `http://vendor.localhost:${request.nextUrl.port || 3000}`
        : "https://vendor.friendlydrop.in");

    const subPath = pathname.replace(/^\/vendor/, "") || "/";
    const destination = new URL(subPath, vendorBase);
    destination.search = request.nextUrl.search;
    return addSecurityHeaders(NextResponse.redirect(destination));
  }

  // Normal main-domain auth guard for customer pages
  const session = request.cookies.get("friendlydrop_session")?.value;
  const needsAuth = AUTH_PREFIXES.some((p) => pathname.startsWith(p));

  if (needsAuth && !session) {
    const loginUrl = new URL("/login", request.nextUrl.origin);
    loginUrl.searchParams.set("redirect", pathname);
    return addSecurityHeaders(NextResponse.redirect(loginUrl));
  }

  return addSecurityHeaders(NextResponse.next());
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "origin-when-cross-origin");
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT _next/static, _next/image, favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
