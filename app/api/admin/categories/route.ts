import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { categorySchema } from "@/lib/validators";
import { createCatalogCategory, getCatalogCategories } from "@/lib/enterprise";
import { publishSystemEvent } from "@/lib/system-events";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireApiPermission(request, "catalog:manage");
    const categories = await getCatalogCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not fetch categories" }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireApiPermission(request, "catalog:manage");
    const payload = categorySchema.parse(await request.json());
    const category = await createCatalogCategory(payload);

    await publishSystemEvent({
      type: "automation_rule_executed",
      module: "catalog",
      source: "api:admin-categories",
      actorId: admin.uid,
      payload: {
        action: "category_upserted",
        categoryId: category.id,
      },
    });

    return NextResponse.json({ ok: true, category });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not save category" }, { status: 400 });
  }
}
