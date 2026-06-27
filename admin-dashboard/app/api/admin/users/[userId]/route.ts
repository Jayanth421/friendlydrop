import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { adminRoleSchema } from "@/lib/validators";
import { updateUserRole } from "@/lib/firebase/firestore";
import { getAdminAuth } from "@/lib/firebase/admin";
import { logAdminActivity, logAdminAudit } from "@/lib/admin/logs";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const admin = await requireApiPermission(request, "users:manage");
    const payload = adminRoleSchema.parse(await request.json());

    await updateUserRole(params.userId, payload.role);
    await getAdminAuth().setCustomUserClaims(params.userId, { role: payload.role });

    await Promise.all([
      logAdminActivity({
        actorId: admin.uid,
        actorName: admin.name,
        actorRole: admin.role,
        action: "user_role_updated",
        targetType: "user",
        targetId: params.userId,
        details: { role: payload.role },
      }),
      logAdminAudit({
        actorId: admin.uid,
        actorRole: admin.role,
        module: "team",
        action: "update",
        after: { userId: params.userId, role: payload.role },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not update role" }, { status: 400 });
  }
}
