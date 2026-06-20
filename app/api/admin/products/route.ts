import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireApiPermission } from "@/lib/auth/api";
import { createSlug } from "@/lib/utils";
import { productSchema } from "@/lib/validators";
import { createProduct, getProducts, upsertProductPageBuilderOverride } from "@/lib/firebase/firestore";
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

export async function GET(request: NextRequest) {
  await requireApiPermission(request, "products:manage");
  const products = await getProducts();
  return NextResponse.json({ products });
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireApiPermission(request, "products:manage");
    const parsed = productSchema.parse(await request.json());
    const images = parsed.images.map((image) => normalizeMediaReference(image)).filter(Boolean) as string[];
    const primaryImage = normalizeMediaReference(parsed.primaryImage) ?? images[0];
    const videoUrl = normalizeMediaReference(parsed.videoUrl);

    const autoDraft = buildAutoProductSyncDraft(parsed);

    const product = await createProduct({
      ...parsed,
      slug: createSlug(parsed.name),
      featured: parsed.featured ?? false,
      recommended: autoDraft.recommended ?? parsed.recommended ?? false,
      popularity: autoDraft.popularity ?? parsed.popularity ?? 50,
      rating: 0,
      reviewCount: 0,
      primaryImage,
      images,
      videoUrl,
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

    const sideEffects = await Promise.allSettled([
      upsertProductPageBuilderOverride({
        productId: product.id,
        actorId: admin.uid,
      }),
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

    sideEffects.forEach((result) => {
      if (result.status === "rejected") {
        console.warn("Product create side effect failed:", result.reason);
      }
    });

    return NextResponse.json({ ok: true, product });
  } catch (error) {
    console.error(error);
    return toProductErrorResponse(error, "Could not create product");
  }
}

