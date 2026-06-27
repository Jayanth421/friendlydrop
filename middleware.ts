import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Subdomain detection
// ---------------------------------------------------------------------------
// Supported subdomains:
//   vendor.friendlydrop.in  → rewrites to /vendor/*
//   admin.friendlydrop.in   → rewrites to /admin/*
//   app.friendlydrop.in     → main storefront (no rewrite)
//
// Local dev (edit /etc/hosts or C:\Windows\System32\drivers\etc\hosts):
//   127.0.0.1  vendor.localhost  admin.localhost  app.localhost
//   Then visit http://vendor.localhost:3000
// ---------------------------------------------------------------------------

type Zone = "vendor" | "admin" | "app" | null;

function getZone(hostname: string): Zone {
  // Strip port
  const host = hostname.split(":")[0].toLowerCase();

  // Local development: *.localhost
  if (host === "vendor.localhost") return "vendor";
  if (host === "admin.localhost") return "admin";
  if (host === "app.localhost" || host === "localhost") return "app";

  // Production: *.friendlydrop.in
  if (host === "vendor.friendlydrop.in") return "vendor";
  if (host === "admin.friendlydrop.in") return "admin";
  if (host === "app.friendlydrop.in" || host === "friendlydrop.in") return "app";

  return null;
}

/** Returns the base URL for the main storefront (used for auth redirects). */
function getMainAppOrigin(request: NextRequest): string {
  const hostname = request.headers.get("host") || "";
  const isLocal = hostname.includes("localhost");
  if (isLocal) {
    const port = hostname.split(":")[1] || "3000";
    return `http://localhost:${port}`;
  }
  return "https://app.friendlydrop.in";
}

// Auth-protected paths (as they appear *after* rewriting)
const AUTH_PREFIXES = ["/cart", "/checkout", "/orders", "/wishlist", "/account", "/vendor", "/admin-2fa"];
const ADMIN_PREFIX = "/admin";

// Paths that should never be rewritten (shared auth pages, API, static)
const PASSTHROUGH_PREFIXES = ["/api", "/login", "/signup", "/forgot-password", "/reset-password", "/_next", "/favicon.ico"];

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const zone = getZone(hostname);
  const { pathname } = request.nextUrl;

  // ------------------------------------------------------------------
  // 1. Compute the internally-rewritten pathname
  // ------------------------------------------------------------------
  let internalPath = pathname;

  if (zone === "vendor" || zone === "admin") {
    const prefix = zone === "vendor" ? "/vendor" : "/admin";
    const isPassthrough = PASSTHROUGH_PREFIXES.some((p) => pathname.startsWith(p));

    if (!isPassthrough && !pathname.startsWith(prefix)) {
      // / → /vendor/dashboard  or  /admin/dashboard
      if (pathname === "/" || pathname === "") {
        internalPath = `${prefix}/dashboard`;
      } else {
        internalPath = `${prefix}${pathname}`;
      }
    }
  }

  // ------------------------------------------------------------------
  // 2. Auth checks (evaluated against the *internal* path)
  // ------------------------------------------------------------------
  const session = request.cookies.get("friendlydrop_session")?.value;
  const needsAuth = AUTH_PREFIXES.some((p) => internalPath.startsWith(p));
  const needsAdminAuth = internalPath.startsWith(ADMIN_PREFIX);

  let response: NextResponse;

  if ((needsAuth || needsAdminAuth) && !session) {
    // For vendor / admin zones redirect to the main app login
    const loginBase =
      zone === "vendor" || zone === "admin"
        ? getMainAppOrigin(request)
        : request.nextUrl.origin;

    const loginUrl = new URL("/login", loginBase);
    // Pass original pathname (pre-rewrite) so the login page can redirect back
    loginUrl.searchParams.set("redirect", pathname);
    response = NextResponse.redirect(loginUrl);
  } else if (internalPath !== pathname) {
    // Rewrite to the correct internal route
    const rewritten = request.nextUrl.clone();
    rewritten.pathname = internalPath;
    response = NextResponse.rewrite(rewritten);
  } else {
    response = NextResponse.next();
  }

  // ------------------------------------------------------------------
  // 3. Security headers
  // ------------------------------------------------------------------
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
     * Match all request paths EXCEPT:
     *  - _next/static (static assets)
     *  - _next/image  (image optimisation)
     *  - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
