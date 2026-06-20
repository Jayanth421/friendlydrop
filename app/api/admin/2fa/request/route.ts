import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { twoFactorRequestSchema } from "@/lib/validators";
import { getRequestUser } from "@/lib/auth/api";
import { isAdminRole } from "@/lib/rbac";
import { getAdminDb } from "@/lib/firebase/admin";
import { getResendClient } from "@/lib/resend";

export const runtime = "nodejs";

function createCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    twoFactorRequestSchema.parse(await request.json().catch(() => ({ purpose: "admin_login" })));

    const user = await getRequestUser(request);

    if (!user || !isAdminRole(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const code = createCode();
    const challengeId = nanoid(12);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await getAdminDb().collection("admin2faChallenges").doc(challengeId).set({
      id: challengeId,
      userId: user.uid,
      code,
      expiresAt,
      createdAt: new Date().toISOString(),
    });

    if (process.env.RESEND_API_KEY) {
      await getResendClient().emails.send({
        from: process.env.EMAIL_FROM ?? "noreply@friendlydrop.in",
        to: user.email,
        subject: "FriendlyDrop Admin Verification Code",
        html: `<div style="font-family:Arial,sans-serif"><h2>Admin Verification</h2><p>Your code is <strong>${code}</strong>. Valid for 10 minutes.</p></div>`,
      });
    } else {
      console.log(`Admin 2FA code for ${user.email}: ${code}`);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not create challenge" }, { status: 400 });
  }
}

