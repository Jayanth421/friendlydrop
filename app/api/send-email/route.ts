import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getResendClient } from "@/lib/resend";
import { requireApiAdmin } from "@/lib/auth/api";

export const runtime = "nodejs";

const schema = z.object({
  to: z.string().email(),
  subject: z.string().min(2),
  html: z.string().min(10),
});

export async function POST(request: NextRequest) {
  try {
    await requireApiAdmin(request);
    const payload = schema.parse(await request.json());

    const result = await getResendClient().emails.send({
      from: process.env.EMAIL_FROM ?? "noreply@friendlydrop.in",
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });

    return NextResponse.json({ ok: true, id: result.data?.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not send email" }, { status: 400 });
  }
}
