import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { getAdminAuth, getUserDisplayName, isFirebaseReady } from "@/lib/firebase/admin";
import { upsertUserProfile } from "@/lib/firebase/firestore";
import { trackAdminSession } from "@/lib/admin/logs";
import { UserRole } from "@/types";
import { assertRateLimit, buildRateLimitKey } from "@/lib/security/rate-limit";
import { assertTrustedMutationRequest, toGuardErrorResponse } from "@/lib/security/request-guards";

export const runtime = "nodejs";

function normalizePhone(phone?: string) {
  if (!phone) {
    return undefined;
  }

  const cleaned = phone.replace(/[^\d+]/g, "").trim();

  if (cleaned.length < 8 || cleaned.length > 16) {
    return undefined;
  }

  return cleaned;
}

function getEmails(envKey: string) {
  return (process.env[envKey] ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function getPatterns(envKey: string) {
  return (process.env[envKey] ?? "")
    .split(",")
    .map((pattern) => pattern.trim().toLowerCase())
    .filter(Boolean);
}

function matchesPattern(email: string, pattern: string) {
  if (!pattern) {
    return false;
  }

  if (pattern.startsWith("@")) {
    return email.endsWith(pattern);
  }

  return email.includes(pattern);
}

function matchesAnyPattern(email: string, envKey: string) {
  return getPatterns(envKey).some((pattern) => matchesPattern(email, pattern));
}

function resolveRole(email: string): UserRole {
  const normalized = email.toLowerCase();

  if (getEmails("SUPER_ADMIN_EMAILS").includes(normalized)) {
    return "super_admin";
  }

  if (getEmails("ADMIN_EMAILS").includes(normalized)) {
    return "admin";
  }

  if (matchesAnyPattern(normalized, "ADMIN_EMAIL_PATTERNS")) {
    return "admin";
  }

  if (getEmails("MANAGER_EMAILS").includes(normalized)) {
    return "manager";
  }

  if (matchesAnyPattern(normalized, "MANAGER_EMAIL_PATTERNS")) {
    return "manager";
  }

  if (getEmails("STAFF_EMAILS").includes(normalized)) {
    return "staff";
  }

  if (matchesAnyPattern(normalized, "STAFF_EMAIL_PATTERNS")) {
    return "staff";
  }

  if (getEmails("VENDOR_EMAILS").includes(normalized)) {
    return "vendor";
  }

  if (matchesAnyPattern(normalized, "VENDOR_EMAIL_PATTERNS")) {
    return "vendor";
  }

  return "user";
}

export async function POST(request: NextRequest) {
  try {
    assertTrustedMutationRequest(request);
    assertRateLimit({
      key: buildRateLimitKey({ request, scope: "auth:create-session" }),
      max: 20,
      windowMs: 60_000,
    });

    if (!isFirebaseReady()) {
      return NextResponse.json(
        {
          error: "Missing Firebase admin env vars. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.local",
        },
        { status: 500 },
      );
    }

    const { idToken, phone } = (await request.json()) as { idToken?: string; phone?: string };

    if (!idToken) {
      return NextResponse.json({ error: "idToken is required" }, { status: 400 });
    }

    const decoded = await getAdminAuth().verifyIdToken(idToken, true);
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, { expiresIn });

    const email = decoded.email ?? "";
    const role = resolveRole(email);

    await upsertUserProfile({
      id: decoded.uid,
      name: getUserDisplayName({ name: decoded.name, email }),
      email,
      phone: normalizePhone(phone),
      role,
      status: "active",
      twoFactorEnabled: false,
      lastLoginAt: new Date().toISOString(),
    });

    await getAdminAuth().setCustomUserClaims(decoded.uid, { role });

    if (role !== "user") {
      await trackAdminSession({ userId: decoded.uid, email });
    }

    const response = NextResponse.json({ ok: true, role });
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionCookie,
      maxAge: expiresIn / 1000,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return response;
  } catch (error) {
    const guardError = toGuardErrorResponse(error);
    if (guardError) {
      return guardError;
    }
    console.error(error);
    const message = error instanceof Error ? error.message : "Could not create session";
    return NextResponse.json({ error: `Could not create session: ${message}` }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    assertTrustedMutationRequest(request);
    assertRateLimit({
      key: buildRateLimitKey({ request, scope: "auth:clear-session" }),
      max: 30,
      windowMs: 60_000,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: "",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    const guardError = toGuardErrorResponse(error);
    if (guardError) {
      return guardError;
    }
    return NextResponse.json({ error: "Could not clear session" }, { status: 400 });
  }
}
