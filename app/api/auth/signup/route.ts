import { NextRequest, NextResponse } from "next/server";
import { upsertUserProfile } from "@/lib/firebase/firestore";
import { assertRateLimit, buildRateLimitKey } from "@/lib/security/rate-limit";
import { assertTrustedMutationRequest, toGuardErrorResponse } from "@/lib/security/request-guards";
import { getAdminAuth, getAdminDb, getUserDisplayName, isFirebaseReady } from "@/lib/firebase/admin";
import { UserRole } from "@/types";

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

export async function POST(request: NextRequest) {
  try {
    assertTrustedMutationRequest(request);
    assertRateLimit({
      key: buildRateLimitKey({ request, scope: "auth:create-account" }),
      max: 10,
      windowMs: 60_000,
    });

    if (!isFirebaseReady()) {
      return NextResponse.json(
        { error: "Missing Firebase admin env vars. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.local" },
        { status: 500 },
      );
    }

    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      phone?: string;
      isVendor?: boolean;
      businessName?: string;
    };

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";
    const phone = normalizePhone(body.phone);
    const isVendor = body.isVendor === true;
    const businessName = body.businessName?.trim();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "name, email, and password are required" }, { status: 400 });
    }

    if (isVendor && !businessName) {
      return NextResponse.json({ error: "Business name is required for vendors" }, { status: 400 });
    }

    const userRecord = await getAdminAuth().createUser({
      email,
      password,
      displayName: name,
    });

    const payload = {
      id: userRecord.uid,
      email: userRecord.email ?? email,
      user: {
        id: userRecord.uid,
        email: userRecord.email ?? email,
        user_metadata: {
          name: userRecord.displayName ?? name,
          full_name: userRecord.displayName ?? name,
          phone,
        },
      },
    };

    if (userRecord.uid) {
      await upsertUserProfile({
        id: userRecord.uid,
        name: getUserDisplayName({ name: userRecord.displayName ?? name, email }),
        email,
        phone,
        role: isVendor ? "vendor" : "user",
        status: "active",
        twoFactorEnabled: false,
        lastLoginAt: new Date().toISOString(),
      });

      if (isVendor) {
        const db = getAdminDb();
        await db.collection("vendor_profiles").doc(userRecord.uid).set({
          id: userRecord.uid,
          businessName: businessName || name,
          ownerName: name,
          email,
          phone: phone || "",
          status: "pending",
          commissionPercent: 10,
          kycVerified: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      ok: true,
      id: payload.id,
      email: payload.email,
      user: payload.user,
    });
  } catch (error) {
    const guardError = toGuardErrorResponse(error);
    if (guardError) {
      return guardError;
    }

    console.error(error);
    const message = error instanceof Error ? error.message : "Could not create account";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
