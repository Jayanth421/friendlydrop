import { NextRequest, NextResponse } from "next/server";
import { RateLimitError } from "@/lib/security/rate-limit";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function getTrustedOrigins(request: NextRequest) {
  const origins = new Set<string>([request.nextUrl.origin]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) {
    try {
      origins.add(new URL(appUrl).origin);
    } catch {
      // Ignore invalid configuration and keep the request-derived origin only.
    }
  }

  if (process.env.NODE_ENV !== "production") {
    const { protocol, port } = request.nextUrl;
    const devPorts = port ? [`:${port}`] : [""];

    for (const currentPort of devPorts) {
      origins.add(`${protocol}//localhost${currentPort}`);
      origins.add(`${protocol}//127.0.0.1${currentPort}`);
    }
  }

  return origins;
}

function matchesTrustedOrigin(request: NextRequest, candidate: string) {
  try {
    return getTrustedOrigins(request).has(new URL(candidate).origin);
  } catch {
    return false;
  }
}

export function assertTrustedMutationRequest(request: NextRequest) {
  if (SAFE_METHODS.has(request.method.toUpperCase())) {
    return;
  }

  const origin = request.headers.get("origin");
  if (origin && matchesTrustedOrigin(request, origin)) {
    return;
  }

  const referer = request.headers.get("referer");
  if (referer && matchesTrustedOrigin(request, referer)) {
    return;
  }

  throw new Error(origin || referer ? "INVALID_ORIGIN" : "MISSING_ORIGIN");
}

export function toGuardErrorResponse(error: unknown) {
  if (error instanceof RateLimitError) {
    return NextResponse.json(
      { error: "Too many requests. Please retry shortly." },
      {
        status: error.status,
        headers: {
          "Retry-After": String(error.retryAfterSeconds),
        },
      },
    );
  }

  if (error instanceof Error && (error.message === "INVALID_ORIGIN" || error.message === "MISSING_ORIGIN")) {
    return NextResponse.json({ error: "Request origin could not be verified" }, { status: 403 });
  }

  return null;
}
