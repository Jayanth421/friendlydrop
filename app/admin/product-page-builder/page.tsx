import { requireAdminPermission } from "@/lib/auth/session";
import {
  getProductPageBuilderGlobalConfig,
  getProductPageBuilderTemplates,
  getProducts,
} from "@/lib/firebase/firestore";
import { ProductPageBuilderStudio } from "@/components/admin/product-page-builder-studio";

export default async function ProductPageBuilderPage() {
  await requireAdminPermission("products:manage");

  const [products, globalConfig, templates] = await Promise.all([
    getProducts(),
    getProductPageBuilderGlobalConfig(),
    getProductPageBuilderTemplates(),
  ]);

  return (
    <ProductPageBuilderStudio
      products={products.map((product) => ({ id: product.id, name: product.name }))}
      initialGlobalSections={globalConfig.sections}
      initialTemplates={templates}
    />
  );
}
