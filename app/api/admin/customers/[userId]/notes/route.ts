import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { addUserInternalNote } from "@/lib/firebase/firestore";
import { userNoteSchema } from "@/lib/validators";
import { logAdminActivity } from "@/lib/admin/logs";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const admin = await requireApiPermission(request, "users:manage");
    const { note } = userNoteSchema.parse(await request.json());

    await addUserInternalNote(params.userId, note);

    await logAdminActivity({
      actorId: admin.uid,
      actorName: admin.name,
      actorRole: admin.role,
      action: "customer_note_added",
      targetType: "user",
      targetId: params.userId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not add note" }, { status: 400 });
  }
}
