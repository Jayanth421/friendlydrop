import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { getCatalogCategories } from "@/lib/enterprise";
import { getProducts, getSeoPlatformConfig, getSeoTrafficInsights, updateSeoPlatformConfig } from "@/lib/firebase/firestore";
import { seoPlatformConfigSchema } from "@/lib/validators";
import { publishSystemEvent } from "@/lib/system-events";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  await requireApiPermission(request, "catalog:manage");
  const [config, insights, products, categories] = await Promise.all([
    getSeoPlatformConfig(),
    getSeoTrafficInsights(),
    getProducts(),
    getCatalogCategories(),
  ]);

  return NextResponse.json({
    config,
    insights,
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      category: product.category,
      seo: product.seo ?? {},
      updatedAt: product.updatedAt ?? product.createdAt,
    })),
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      seo: category.seo ?? {},
      updatedAt: category.updatedAt ?? category.createdAt,
    })),
  });
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireApiPermission(request, "catalog:manage");
    const payload = seoPlatformConfigSchema.partial().parse(await request.json());

    await updateSeoPlatformConfig(payload);
    const config = await getSeoPlatformConfig();

    await publishSystemEvent({
      type: "automation_rule_executed",
      module: "catalog",
      source: "api:seo-config",
      actorId: admin.uid,
      payload: {
        sitemapEnabled: config.sitemapEnabled,
        robotsPolicy: config.robotsPolicy,
        pageSpeedMode: config.pageSpeedMode,
        noindexCategories: config.noindexCategorySlugs.length,
      },
    });

    return NextResponse.json({ ok: true, config });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not update SEO settings" }, { status: 400 });
  }
}

