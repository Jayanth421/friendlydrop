import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import {
  getProductPageBuilderTemplates,
  saveProductPageBuilderTemplate,
} from "@/lib/firebase/firestore";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  await requireApiPermission(request, "products:manage");
  const templates = await getProductPageBuilderTemplates();
  return NextResponse.json({ templates });
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireApiPermission(request, "products:manage");
    const payload = (await request.json()) as {
      id?: string;
      name?: string;
      description?: string;
      sections?: unknown;
    };

    if (!payload.name?.trim()) {
      return NextResponse.json({ error: "Template name is required" }, { status: 400 });
    }

    if (!Array.isArray(payload.sections)) {
      return NextResponse.json({ error: "Sections are required" }, { status: 400 });
    }

    const template = await saveProductPageBuilderTemplate({
      id: payload.id,
      name: payload.name,
      description: payload.description,
      sections: payload.sections,
      actorId: admin.uid,
    });

    return NextResponse.json({ ok: true, template });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not save template" }, { status: 400 });
  }
}

