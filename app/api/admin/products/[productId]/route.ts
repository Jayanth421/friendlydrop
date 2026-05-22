import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { createSlug } from "@/lib/utils";
import { productSchema } from "@/lib/validators";
import { deleteProduct, getProductById, updateProduct, upsertProductPageBuilderOverride } from "@/lib/firebase/firestore";
import { logAdminActivity, logAdminAudit } from "@/lib/admin/logs";
import { buildAutoProductSyncDraft } from "@/lib/product-page-builder";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, { params }: { params: { productId: string } }) {
  try {
    const admin = await requireApiPermission(request, "products:manage");
    const before = await getProductById(params.productId);
    const parsed = productSchema.partial().parse(await request.json());
    const autoDraft = buildAutoProductSyncDraft({
      ...before,
      ...parsed,
    });

    await updateProduct(params.productId, {
      ...parsed,
      ...(parsed.name ? { slug: createSlug(parsed.name) } : {}),
      subtitle: parsed.subtitle ?? autoDraft.subtitle,
      shortDescription: parsed.shortDescription ?? autoDraft.shortDescription,
      tags: parsed.tags ?? autoDraft.tags,
      seo: {
        ...(autoDraft.seo ?? {}),
        ...(parsed.seo ?? {}),
      },
    });

    await upsertProductPageBuilderOverride({
      productId: params.productId,
      actorId: admin.uid,
    });

    const after = await getProductById(params.productId);

    await Promise.all([
      logAdminActivity({
        actorId: admin.uid,
        actorName: admin.name,
        actorRole: admin.role,
        action: "product_updated",
        targetType: "product",
        targetId: params.productId,
      }),
      logAdminAudit({
        actorId: admin.uid,
        actorRole: admin.role,
        module: "products",
        action: "update",
        before: (before ?? null) as unknown as Record<string, unknown> | null,
        after: (after ?? null) as unknown as Record<string, unknown> | null,
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not update product" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { productId: string } }) {
  try {
    const admin = await requireApiPermission(request, "products:manage");
    const before = await getProductById(params.productId);
    await deleteProduct(params.productId);

    await Promise.all([
      logAdminActivity({
        actorId: admin.uid,
        actorName: admin.name,
        actorRole: admin.role,
        action: "product_deleted",
        targetType: "product",
        targetId: params.productId,
      }),
      logAdminAudit({
        actorId: admin.uid,
        actorRole: admin.role,
        module: "products",
        action: "delete",
        before: (before ?? null) as unknown as Record<string, unknown> | null,
        after: null,
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not delete product" }, { status: 400 });
  }
}
