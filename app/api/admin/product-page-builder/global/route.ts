import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import {
  getProductPageBuilderGlobalConfig,
  upsertProductPageBuilderGlobalConfig,
} from "@/lib/firebase/firestore";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  await requireApiPermission(request, "products:manage");
  const config = await getProductPageBuilderGlobalConfig();
  return NextResponse.json({ config });
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireApiPermission(request, "products:manage");
    const payload = (await request.json()) as {
      sections?: unknown;
      reusableTemplateIds?: unknown;
      globalFlags?: unknown;
    };

    const config = await upsertProductPageBuilderGlobalConfig(
      {
        sections: Array.isArray(payload.sections) ? payload.sections : undefined,
        reusableTemplateIds: Array.isArray(payload.reusableTemplateIds) ? payload.reusableTemplateIds : undefined,
        globalFlags: payload.globalFlags && typeof payload.globalFlags === "object" ? payload.globalFlags : undefined,
      },
      admin.uid,
    );

    return NextResponse.json({ ok: true, config });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not update product page builder config" }, { status: 400 });
  }
}
