import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { uploadModerationSchema } from "@/lib/validators";
import { updateUploadModeration } from "@/lib/firebase/firestore";
import { logAdminActivity } from "@/lib/admin/logs";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, { params }: { params: { uploadId: string } }) {
  try {
    const admin = await requireApiPermission(request, "orders:manage");
    const payload = uploadModerationSchema.parse(await request.json());

    await updateUploadModeration(params.uploadId, payload);

    await logAdminActivity({
      actorId: admin.uid,
      actorName: admin.name,
      actorRole: admin.role,
      action: "upload_moderated",
      targetType: "upload",
      targetId: params.uploadId,
      details: payload as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not moderate upload" }, { status: 400 });
  }
}
