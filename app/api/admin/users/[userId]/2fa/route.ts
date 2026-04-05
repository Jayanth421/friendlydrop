import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { userTwoFactorSchema } from "@/lib/validators";
import { updateUserTwoFactor } from "@/lib/firebase/firestore";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    await requireApiPermission(request, "team:manage");
    const { enabled } = userTwoFactorSchema.parse(await request.json());
    await updateUserTwoFactor(params.userId, enabled);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not update 2FA" }, { status: 400 });
  }
}
