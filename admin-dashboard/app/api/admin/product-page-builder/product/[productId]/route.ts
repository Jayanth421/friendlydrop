import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import {
  getProductById,
  getProductPageBuilderOverride,
  resolveProductPageSectionsForProduct,
  upsertProductPageBuilderOverride,
} from "@/lib/firebase/firestore";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } },
) {
  await requireApiPermission(request, "products:manage");
  const [product, override, resolvedSections] = await Promise.all([
    getProductById(params.productId),
    getProductPageBuilderOverride(params.productId),
    resolveProductPageSectionsForProduct(params.productId),
  ]);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({
    product: {
      id: product.id,
      name: product.name,
      slug: product.slug,
      category: product.category,
    },
    override,
    resolvedSections,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { productId: string } },
) {
  try {
    const admin = await requireApiPermission(request, "products:manage");
    const product = await getProductById(params.productId);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const payload = (await request.json()) as {
      sections?: unknown;
      templateId?: unknown;
    };

    const override = await upsertProductPageBuilderOverride({
      productId: params.productId,
      sections: Array.isArray(payload.sections) ? payload.sections : undefined,
      templateId: typeof payload.templateId === "string" ? payload.templateId : undefined,
      actorId: admin.uid,
    });

    const resolvedSections = await resolveProductPageSectionsForProduct(params.productId);

    return NextResponse.json({ ok: true, override, resolvedSections });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not update product page builder override" }, { status: 400 });
  }
}
