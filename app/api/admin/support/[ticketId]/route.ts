import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { supportTicketUpdateSchema } from "@/lib/validators";
import { updateSupportTicket } from "@/lib/firebase/firestore";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, { params }: { params: { ticketId: string } }) {
  try {
    await requireApiPermission(request, "support:manage");
    const payload = supportTicketUpdateSchema.parse(await request.json());
    await updateSupportTicket(params.ticketId, payload);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not update ticket" }, { status: 400 });
  }
}
