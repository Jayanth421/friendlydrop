import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { customerNotifySchema } from "@/lib/validators";
import { getUserById } from "@/lib/firebase/firestore";
import { getResendClient } from "@/lib/resend";
import { publishSystemEvent } from "@/lib/system-events";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const admin = await requireApiPermission(request, "users:manage");
    const payload = customerNotifySchema.parse(await request.json());
    const user = await getUserById(params.userId);

    if (!user) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    if (payload.channel === "email" && user.email && process.env.RESEND_API_KEY) {
      await getResendClient().emails.send({
        from: process.env.EMAIL_FROM ?? "noreply@friendlydrop.in",
        to: user.email,
        subject: payload.subject ?? "FriendlyDrop Notification",
        html: `<div style="font-family:Arial,sans-serif"><p>${payload.message}</p></div>`,
      });
    }

    await publishSystemEvent({
      type: "automation_rule_executed",
      module: "customers",
      source: "api:customer-notify",
      actorId: admin.uid,
      userId: user.id,
      payload: {
        channel: payload.channel,
        message: payload.message,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not send customer notification" }, { status: 400 });
  }
}
