import { NextRequest } from "next/server";

function normalizeBaseUrl(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed).origin;
  } catch {
    return null;
  }
}

export function getRequestBaseUrl(request: NextRequest) {
  const configuredUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL);
  if (configuredUrl) {
    return configuredUrl;
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const host = forwardedHost ?? request.headers.get("host");

  if (host) {
    return `${forwardedProto ?? request.nextUrl.protocol.replace(":", "")}://${host}`;
  }

  return request.nextUrl.origin;
}

export function getCashfreeReturnBaseUrl(request: NextRequest) {
  const baseUrl = getRequestBaseUrl(request);
  const parsed = new URL(baseUrl);
  const isLocalhost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";

  if (parsed.protocol !== "https:" || isLocalhost) {
    throw new Error("Cashfree requires NEXT_PUBLIC_APP_URL to be a public HTTPS URL, for example https://friendlydrop.in.");
  }

  return parsed.origin;
}
