import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { saveUploadRecord } from "@/lib/firebase/firestore";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    const { imageUrl } = (await request.json()) as { imageUrl?: string };

    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
    }

    await saveUploadRecord(user.uid, imageUrl);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Upload record save failed" }, { status: 400 });
  }
}
