import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { saveUploadRecord } from "@/lib/firebase/firestore";

export const runtime = "nodejs";

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
}

function isJsonRequest(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  return contentType.includes("application/json");
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(request);

    if (isJsonRequest(request)) {
      const { imageUrl } = (await request.json()) as { imageUrl?: string };

      if (!imageUrl) {
        return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
      }

      await saveUploadRecord(user.uid, imageUrl);
      return NextResponse.json({ ok: true, imageUrl });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const folder = String(formData.get("folder") ?? "uploads").trim() || "uploads";
    const shouldRecord = String(formData.get("record") ?? "false").toLowerCase() === "true";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "uploads";
    const authKey = supabaseServiceRoleKey ?? supabaseKey;

    if (!supabaseUrl || !supabaseKey || !authKey) {
      return NextResponse.json({ error: "Supabase env is not configured" }, { status: 400 });
    }

    const safeName = sanitizeFilename(file.name || "file");
    const objectPath = `${folder}/${user.uid}/${Date.now()}-${safeName}`;
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${objectPath}`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${authKey}`,
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "false",
      },
      body: bytes,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      return NextResponse.json(
        {
          error: "Supabase upload failed",
          details: errorText.slice(0, 300),
        },
        { status: 400 },
      );
    }

    const imageUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${objectPath}`;

    if (shouldRecord) {
      await saveUploadRecord(user.uid, imageUrl);
    }

    return NextResponse.json({
      ok: true,
      imageUrl,
      path: objectPath,
    });
  } catch {
    return NextResponse.json({ error: "Upload record save failed" }, { status: 400 });
  }
}
