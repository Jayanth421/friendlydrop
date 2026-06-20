import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import {
  appendSupportTicketMessage,
  createSupportTicket,
  getSupportTicketById,
  getSupportTicketsByUser,
  updateSupportTicket,
} from "@/lib/firebase/firestore";
import { SupportChatAttachment, SupportTicket } from "@/types";
import { buildBotReply, classifySupportCategory } from "@/lib/support-bot";
import { assertRateLimit, buildRateLimitKey } from "@/lib/security/rate-limit";
import { assertTrustedMutationRequest, toGuardErrorResponse } from "@/lib/security/request-guards";

export const runtime = "nodejs";

function normalizeAttachments(value: unknown): SupportChatAttachment[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const attachments = value
    .map((item) => {
      const candidate = item as Partial<SupportChatAttachment>;
      if (!candidate?.url || typeof candidate.url !== "string") {
        return null;
      }
      return {
        url: candidate.url,
        type: candidate.type ?? "file",
        name: candidate.name,
        sizeBytes: typeof candidate.sizeBytes === "number" ? candidate.sizeBytes : undefined,
      } as SupportChatAttachment;
    })
    .filter((item): item is SupportChatAttachment => Boolean(item));

  return attachments.length ? attachments : undefined;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    assertRateLimit({
      key: buildRateLimitKey({ request, scope: "support:read", actorId: user.uid }),
      max: 90,
      windowMs: 60_000,
    });
    if (user.role !== "user") {
      return NextResponse.json({ error: "Support chat is only available to customers" }, { status: 403 });
    }
    const tickets = await getSupportTicketsByUser(user.uid);
    const ticketId = request.nextUrl.searchParams.get("ticketId");

    if (ticketId) {
      const ticket = tickets.find((item) => item.id === ticketId) ?? null;
      return NextResponse.json({ ticket, tickets }, { headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json({ tickets }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const guardError = toGuardErrorResponse(error);
    if (guardError) {
      return guardError;
    }
    return NextResponse.json({ error: "Could not load support chats" }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    assertTrustedMutationRequest(request);
    assertRateLimit({
      key: buildRateLimitKey({ request, scope: "support:create", actorId: user.uid }),
      max: 15,
      windowMs: 60_000,
    });
    if (user.role !== "user") {
      return NextResponse.json({ error: "Support chat is only available to customers" }, { status: 403 });
    }
    const payload = (await request.json()) as {
      subject?: string;
      message?: string;
      category?: SupportTicket["category"];
      attachments?: unknown;
    };

    const message = payload.message?.trim();
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const category = payload.category ?? classifySupportCategory(message);
    const now = new Date().toISOString();
    const ticket = await createSupportTicket({
      userId: user.uid,
      subject: payload.subject?.trim() || `Support request - ${category}`,
      category,
      status: "open",
      assignedTo: "",
      agentConnected: false,
      customerTyping: false,
      staffTyping: false,
      lastCustomerSeenAt: now,
      messages: [
        {
          id: `msg-${Date.now()}`,
          by: user.uid,
          byRole: "customer",
          message,
          at: now,
          attachments: normalizeAttachments(payload.attachments),
        },
        {
          id: `bot-${Date.now()}`,
          by: "support-bot",
          byRole: "assistant_bot",
          message: buildBotReply(message),
          at: new Date().toISOString(),
        },
      ],
    });

    return NextResponse.json({ ok: true, ticket });
  } catch (error) {
    const guardError = toGuardErrorResponse(error);
    if (guardError) {
      return guardError;
    }
    console.error(error);
    return NextResponse.json({ error: "Could not create support chat" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    assertTrustedMutationRequest(request);
    assertRateLimit({
      key: buildRateLimitKey({ request, scope: "support:update", actorId: user.uid }),
      max: 25,
      windowMs: 60_000,
    });
    if (user.role !== "user") {
      return NextResponse.json({ error: "Support chat is only available to customers" }, { status: 403 });
    }
    const payload = (await request.json()) as {
      ticketId?: string;
      message?: string;
      attachments?: unknown;
      connectAgent?: boolean;
    };

    if (!payload.ticketId) {
      return NextResponse.json({ error: "ticketId is required" }, { status: 400 });
    }

    const ticket = await getSupportTicketById(payload.ticketId);
    if (!ticket || ticket.userId !== user.uid) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (payload.message?.trim()) {
      await appendSupportTicketMessage({
        ticketId: payload.ticketId,
        by: user.uid,
        byRole: "customer",
        message: payload.message.trim(),
        attachments: normalizeAttachments(payload.attachments),
      });
    }

    await updateSupportTicket(payload.ticketId, {
      customerTyping: false,
      lastCustomerSeenAt: new Date().toISOString(),
      ...(payload.connectAgent ? { agentConnected: true, status: "in_progress" } : {}),
    });

    const updated = await getSupportTicketById(payload.ticketId);
    return NextResponse.json({ ok: true, ticket: updated });
  } catch (error) {
    const guardError = toGuardErrorResponse(error);
    if (guardError) {
      return guardError;
    }
    console.error(error);
    return NextResponse.json({ error: "Could not update support chat" }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    assertTrustedMutationRequest(request);
    assertRateLimit({
      key: buildRateLimitKey({ request, scope: "support:typing", actorId: user.uid }),
      max: 120,
      windowMs: 60_000,
    });
    if (user.role !== "user") {
      return NextResponse.json({ error: "Support chat is only available to customers" }, { status: 403 });
    }
    const payload = (await request.json()) as { ticketId?: string; typing?: boolean };

    if (!payload.ticketId) {
      return NextResponse.json({ error: "ticketId is required" }, { status: 400 });
    }

    const ticket = await getSupportTicketById(payload.ticketId);
    if (!ticket || ticket.userId !== user.uid) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    await updateSupportTicket(payload.ticketId, {
      customerTyping: Boolean(payload.typing),
      lastCustomerSeenAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const guardError = toGuardErrorResponse(error);
    if (guardError) {
      return guardError;
    }
    console.error(error);
    return NextResponse.json({ error: "Could not update typing state" }, { status: 400 });
  }
}

