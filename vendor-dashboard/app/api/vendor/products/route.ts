import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireApiVendorOrAdmin } from "@/lib/auth/api";
import { createSlug } from "@/lib/utils";
import { productSchema } from "@/lib/validators";
import { createProduct, getProducts, upsertProductPageBuilderOverride } from "@/lib/firebase/firestore";
import { normalizeMediaReference } from "@/lib/media";
import { buildAutoProductSyncDraft } from "@/lib/product-page-builder";
import { assertTrustedMutationRequest, toGuardErrorResponse } from "@/lib/security/request-guards";
import { isAdminRole } from "@/lib/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toProductErrorResponse(error: unknown, fallback: string) {
  const guardError = toGuardErrorResponse(error);
  if (guardError) {
    return guardError;
  }

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
  return NextResponse.json({ error: fallback, details: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiVendorOrAdmin(request);
    const products = await getProducts({ sort: "newest" });
    const vendorProducts = isAdminRole(user.role)
      ? products.filter((product) => product.vendorId || product.status !== "archived")
      : products.filter((product) => product.vendorId === user.uid);

    return NextResponse.json({ products: vendorProducts });
  } catch (error) {
    return toProductErrorResponse(error, "Could not load vendor products");
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiVendorOrAdmin(request);
    assertTrustedMutationRequest(request);

    const parsed = productSchema.parse(await request.json());
    const images = parsed.images.map((image) => normalizeMediaReference(image)).filter(Boolean) as string[];
    const primaryImage = normalizeMediaReference(parsed.primaryImage) ?? images[0];
    const videoUrl = normalizeMediaReference(parsed.videoUrl);
    const autoDraft = buildAutoProductSyncDraft(parsed);
    const vendorId = isAdminRole(user.role) && parsed.vendorId ? parsed.vendorId : user.uid;

    const product = await createProduct({
      ...parsed,
      vendorId,
      slug: createSlug(parsed.name),
      featured: false,
      recommended: autoDraft.recommended ?? parsed.recommended ?? false,
      popularity: autoDraft.popularity ?? parsed.popularity ?? 50,
      rating: 0,
      reviewCount: 0,
      primaryImage,
      images,
      videoUrl,
      tags: autoDraft.tags ?? parsed.tags ?? [],
      status: parsed.status ?? "draft",
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
      actorId: user.uid,
    });

    return NextResponse.json({ ok: true, product });
  } catch (error) {
    console.error(error);
    return toProductErrorResponse(error, "Could not create vendor product");
  }
}
