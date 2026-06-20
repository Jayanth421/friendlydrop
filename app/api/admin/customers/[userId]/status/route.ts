import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { getUserById, updateUserStatus } from "@/lib/firebase/firestore";
import { userStatusSchema } from "@/lib/validators";
import { logAdminActivity, logAdminAudit } from "@/lib/admin/logs";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const admin = await requireApiPermission(request, "users:manage");
    const before = await getUserById(params.userId);
    const { status } = userStatusSchema.parse(await request.json());

    await updateUserStatus(params.userId, status);
    const after = await getUserById(params.userId);

    await Promise.all([
      logAdminActivity({
        actorId: admin.uid,
        actorName: admin.name,
        actorRole: admin.role,
        action: "customer_status_updated",
        targetType: "user",
        targetId: params.userId,
        details: { status },
      }),
      logAdminAudit({
        actorId: admin.uid,
        actorRole: admin.role,
        module: "customers",
        action: "update",
        before: (before ?? null) as unknown as Record<string, unknown> | null,
        after: (after ?? null) as unknown as Record<string, unknown> | null,
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not update status" }, { status: 400 });
  }
}
