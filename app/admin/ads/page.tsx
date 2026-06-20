import { MetaAdsManager } from "@/components/admin/meta-ads-manager";
import { requireAdminPermission } from "@/lib/auth/session";
import { getMetaAdsCampaigns, getMetaAdsConfig, getProducts } from "@/lib/firebase/firestore";

export default async function AdminAdsPage() {
  await requireAdminPermission("marketing:manage");
  const [config, campaigns, products] = await Promise.all([
    getMetaAdsConfig(),
    getMetaAdsCampaigns(),
    getProducts(),
  ]);

  return (
    <MetaAdsManager
      initialConfig={config}
      initialCampaigns={campaigns}
      products={products.map((product) => ({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
      }))}
    />
  );
}

