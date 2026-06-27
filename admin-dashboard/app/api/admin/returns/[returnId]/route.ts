import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { returnUpdateSchema } from "@/lib/validators";
import { updateReturnRequest } from "@/lib/firebase/firestore";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, { params }: { params: { returnId: string } }) {
  try {
    await requireApiPermission(request, "returns:manage");
    const payload = returnUpdateSchema.parse(await request.json());
    await updateReturnRequest(params.returnId, payload);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not update return" }, { status: 400 });
  }
}
