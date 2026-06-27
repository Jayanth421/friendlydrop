import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { reviewModerationSchema } from "@/lib/validators";
import { moderateReview } from "@/lib/firebase/firestore";
import { logAdminActivity } from "@/lib/admin/logs";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, { params }: { params: { reviewId: string } }) {
  try {
    const admin = await requireApiPermission(request, "reviews:manage");
    const payload = reviewModerationSchema.parse(await request.json());

    await moderateReview(params.reviewId, payload);

    await logAdminActivity({
      actorId: admin.uid,
      actorName: admin.name,
      actorRole: admin.role,
      action: "review_moderated",
      targetType: "review",
      targetId: params.reviewId,
      details: payload as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not moderate review" }, { status: 400 });
  }
}
