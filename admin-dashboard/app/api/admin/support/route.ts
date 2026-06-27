import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { createSupportTicket, getSupportTickets } from "@/lib/firebase/firestore";
import { supportTicketSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  await requireApiPermission(request, "support:manage");
  const tickets = await getSupportTickets();
  return NextResponse.json(
    { tickets },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireApiPermission(request, "support:manage");
    const payload = supportTicketSchema.parse(await request.json());

    const ticket = await createSupportTicket({
      userId: payload.userId,
      subject: payload.subject,
      category: payload.category,
      status: "open",
      agentConnected: true,
      assignedTo: admin.uid,
      messages: [
        {
          id: `msg-${Date.now()}`,
          by: payload.userId,
          byRole: "customer",
          message: payload.message,
          at: new Date().toISOString(),
          attachments: payload.attachments,
        },
      ],
    });

    return NextResponse.json({ ok: true, ticket });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not create ticket" }, { status: 400 });
  }
}

