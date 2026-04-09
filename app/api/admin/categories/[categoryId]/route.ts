import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { categorySchema } from "@/lib/validators";
import { deleteCatalogCategory, updateCatalogCategory } from "@/lib/enterprise";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, { params }: { params: { categoryId: string } }) {
  try {
    await requireApiPermission(request, "catalog:manage");
    const payload = categorySchema.partial().parse(await request.json());
    await updateCatalogCategory(params.categoryId, payload);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not update category" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { categoryId: string } }) {
  try {
    await requireApiPermission(request, "catalog:manage");
    await deleteCatalogCategory(params.categoryId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not delete category" }, { status: 400 });
  }
}
