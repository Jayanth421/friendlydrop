import { SeoManager } from "@/components/admin/seo-manager";
import { requireAdminPermission } from "@/lib/auth/session";
import { getCatalogCategories } from "@/lib/enterprise";
import { getProducts, getSeoPlatformConfig, getSeoTrafficInsights } from "@/lib/firebase/firestore";

export default async function AdminSeoPage() {
  await requireAdminPermission("catalog:manage");
  const [config, insights, products, categories] = await Promise.all([
    getSeoPlatformConfig(),
    getSeoTrafficInsights(),
    getProducts(),
    getCatalogCategories(),
  ]);

  return (
    <SeoManager
      initialConfig={config}
      initialInsights={insights}
      initialProducts={products.map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        category: product.category,
        seo: product.seo ?? {},
      }))}
      initialCategories={categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        seo: category.seo ?? {},
      }))}
    />
  );
}
