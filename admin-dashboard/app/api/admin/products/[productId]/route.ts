import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireApiPermission } from "@/lib/auth/api";
import { createSlug } from "@/lib/utils";
import { productSchema } from "@/lib/validators";
import { deleteProduct, getProductById, updateProduct, upsertProductPageBuilderOverride } from "@/lib/firebase/firestore";
import { logAdminActivity, logAdminAudit } from "@/lib/admin/logs";
import { buildAutoProductSyncDraft } from "@/lib/product-page-builder";
import { normalizeMediaReference } from "@/lib/media";

export const runtime = "nodejs";

function toProductErrorResponse(error: unknown, fallback: string) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Product validation failed",
        details: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const message = error instanceof Error ? error.message : fallback;
  const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500;

  return NextResponse.json(
    {
      error: fallback,
      details: message,
    },
    { status },
  );
}

export async function PATCH(request: NextRequest, { params }: { params: { productId: string } }) {
  try {
    const admin = await requireApiPermission(request, "products:manage");
    const before = await getProductById(params.productId);
    const parsed = productSchema.partial().parse(await request.json());
    const images = parsed.images?.map((image) => normalizeMediaReference(image)).filter(Boolean) as string[] | undefined;
    const primaryImage =
      normalizeMediaReference(parsed.primaryImage) ??
      (images?.[0] ? images[0] : undefined);
    const videoUrl = normalizeMediaReference(parsed.videoUrl);
    const autoDraft = buildAutoProductSyncDraft({
      ...before,
      ...parsed,
    });

    await updateProduct(params.productId, {
      ...parsed,
      ...(images ? { images } : {}),
      ...(primaryImage ? { primaryImage } : {}),
      ...(videoUrl ? { videoUrl } : {}),
      ...(parsed.name ? { slug: createSlug(parsed.name) } : {}),
      subtitle: parsed.subtitle ?? autoDraft.subtitle,
      shortDescription: parsed.shortDescription ?? autoDraft.shortDescription,
      tags: parsed.tags ?? autoDraft.tags,
      seo: {
        ...(autoDraft.seo ?? {}),
        ...(parsed.seo ?? {}),
      },
    });

    const after = await getProductById(params.productId);
    const sideEffects = await Promise.allSettled([
      upsertProductPageBuilderOverride({
        productId: params.productId,
        actorId: admin.uid,
      }),
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

    sideEffects.forEach((result) => {
      if (result.status === "rejected") {
        console.warn("Product update side effect failed:", result.reason);
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return toProductErrorResponse(error, "Could not update product");
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
