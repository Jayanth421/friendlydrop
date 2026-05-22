import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { createSlug } from "@/lib/utils";
import { productSchema } from "@/lib/validators";
import { createProduct, getProducts, upsertProductPageBuilderOverride } from "@/lib/firebase/firestore";
import { logAdminActivity, logAdminAudit } from "@/lib/admin/logs";
import { buildAutoProductSyncDraft } from "@/lib/product-page-builder";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  await requireApiPermission(request, "products:manage");
  const products = await getProducts();
  return NextResponse.json({ products });
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireApiPermission(request, "products:manage");
    const parsed = productSchema.parse(await request.json());

    const autoDraft = buildAutoProductSyncDraft(parsed);

    const product = await createProduct({
      ...parsed,
      slug: createSlug(parsed.name),
      featured: parsed.featured ?? false,
      recommended: autoDraft.recommended ?? parsed.recommended ?? false,
      popularity: autoDraft.popularity ?? parsed.popularity ?? 50,
      rating: 0,
      reviewCount: 0,
      tags: autoDraft.tags ?? parsed.tags ?? [],
      status: parsed.status ?? "published",
      visibility: parsed.visibility ?? "public",
      subtitle: parsed.subtitle ?? autoDraft.subtitle,
      shortDescription: parsed.shortDescription ?? autoDraft.shortDescription,
      seo: {
        ...(autoDraft.seo ?? {}),
        ...(parsed.seo ?? {}),
      },
    });

    await upsertProductPageBuilderOverride({
      productId: product.id,
      actorId: admin.uid,
    });

    await Promise.all([
      logAdminActivity({
        actorId: admin.uid,
        actorName: admin.name,
        actorRole: admin.role,
        action: "product_created",
        targetType: "product",
        targetId: product.id,
      }),
      logAdminAudit({
        actorId: admin.uid,
        actorRole: admin.role,
        module: "products",
        action: "create",
        after: product as unknown as Record<string, unknown>,
      }),
    ]);

    return NextResponse.json({ ok: true, product });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not create product" }, { status: 400 });
  }
}
