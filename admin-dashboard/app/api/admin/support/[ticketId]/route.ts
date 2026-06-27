import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { supportTicketUpdateSchema } from "@/lib/validators";
import { appendSupportTicketMessage, getSupportTicketById, updateSupportTicket } from "@/lib/firebase/firestore";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: { ticketId: string } }) {
  try {
    await requireApiPermission(request, "support:manage");
    const ticket = await getSupportTicketById(params.ticketId);
    return NextResponse.json({ ticket });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not fetch ticket" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { ticketId: string } }) {
  try {
    const admin = await requireApiPermission(request, "support:manage");
    const payload = supportTicketUpdateSchema.parse(await request.json());

    if (payload.message?.trim()) {
      await appendSupportTicketMessage({
        ticketId: params.ticketId,
        by: admin.uid,
        byRole: admin.role,
        message: payload.message.trim(),
        attachments: payload.attachments,
      });
    }

    await updateSupportTicket(params.ticketId, {
      status: payload.status,
      assignedTo: payload.assignedTo === "__me__" ? admin.uid : payload.assignedTo,
      agentConnected: payload.agentConnected,
      staffTyping: false,
      lastStaffSeenAt: new Date().toISOString(),
    });

    const ticket = await getSupportTicketById(params.ticketId);
    return NextResponse.json({ ok: true, ticket });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not update ticket" }, { status: 400 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { ticketId: string } }) {
  try {
    await requireApiPermission(request, "support:manage");
    const payload = (await request.json()) as { typing?: boolean };

    await updateSupportTicket(params.ticketId, {
      staffTyping: Boolean(payload.typing),
      lastStaffSeenAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not update typing state" }, { status: 400 });
  }
}
