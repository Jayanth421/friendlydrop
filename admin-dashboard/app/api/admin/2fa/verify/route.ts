import { NextRequest, NextResponse } from "next/server";
import { ADMIN_2FA_COOKIE_NAME } from "@/lib/constants";
import { twoFactorVerifySchema } from "@/lib/validators";
import { getRequestUser } from "@/lib/auth/api";
import { isAdminRole } from "@/lib/rbac";
import { getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);

    if (!user || !isAdminRole(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = twoFactorVerifySchema.parse(await request.json());

    const challengeSnapshot = await getAdminDb()
      .collection("admin2faChallenges")
      .where("userId", "==", user.uid)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (challengeSnapshot.empty) {
      return NextResponse.json({ error: "No active challenge" }, { status: 404 });
    }

    const challenge = challengeSnapshot.docs[0].data() as { id: string; code: string; expiresAt: string };

    if (new Date(challenge.expiresAt).getTime() < Date.now()) {
      return NextResponse.json({ error: "Code expired" }, { status: 400 });
    }

    if (challenge.code !== payload.code) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    await getAdminDb().collection("admin2faChallenges").doc(challenge.id).delete();

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: ADMIN_2FA_COOKIE_NAME,
      value: `${user.uid}:${Date.now()}`,
      maxAge: 60 * 60 * 12,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not verify code" }, { status: 400 });
  }
}

