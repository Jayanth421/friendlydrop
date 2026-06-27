import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireApiVendorOrAdmin } from "@/lib/auth/api";
import { createSlug } from "@/lib/utils";
import { productSchema } from "@/lib/validators";
import { deleteProduct, getProductById, updateProduct, upsertProductPageBuilderOverride } from "@/lib/firebase/firestore";
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
  const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : message === "NOT_FOUND" ? 404 : 500;
  return NextResponse.json({ error: fallback, details: message }, { status });
}

async function requireOwnedProduct(request: NextRequest, productId: string) {
  const user = await requireApiVendorOrAdmin(request);
  const product = await getProductById(productId);

  if (!product) {
    throw new Error("NOT_FOUND");
  }

  if (!isAdminRole(user.role) && product.vendorId !== user.uid) {
    throw new Error("FORBIDDEN");
  }

  return { user, product };
}

export async function PATCH(request: NextRequest, { params }: { params: { productId: string } }) {
  try {
    const { user, product } = await requireOwnedProduct(request, params.productId);
    assertTrustedMutationRequest(request);

    const parsed = productSchema.partial().parse(await request.json());
    const images = parsed.images?.map((image) => normalizeMediaReference(image)).filter(Boolean) as string[] | undefined;
    const primaryImage = normalizeMediaReference(parsed.primaryImage) ?? (images?.[0] ? images[0] : undefined);
    const videoUrl = normalizeMediaReference(parsed.videoUrl);
    const autoDraft = buildAutoProductSyncDraft({ ...product, ...parsed });

    await updateProduct(params.productId, {
      ...parsed,
      vendorId: product.vendorId ?? user.uid,
      ...(images ? { images } : {}),
      ...(primaryImage ? { primaryImage } : {}),
      ...(videoUrl ? { videoUrl } : {}),
      ...(parsed.name ? { slug: createSlug(parsed.name) } : {}),
      featured: product.featured ?? false,
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
      actorId: user.uid,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return toProductErrorResponse(error, "Could not update vendor product");
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { productId: string } }) {
  try {
    await requireOwnedProduct(request, params.productId);
    assertTrustedMutationRequest(request);
    await deleteProduct(params.productId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return toProductErrorResponse(error, "Could not delete vendor product");
  }
}
