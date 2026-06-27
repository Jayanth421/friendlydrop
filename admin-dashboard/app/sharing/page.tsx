import { SocialShareManager } from "@/components/admin/social-share-manager";
import { requireAdminPermission } from "@/lib/auth/session";
import { getProducts, getSocialShareConfig, getSocialShareLinks } from "@/lib/firebase/firestore";

export default async function AdminSharingPage() {
  await requireAdminPermission("marketing:manage");
  const [config, links, products] = await Promise.all([
    getSocialShareConfig(),
    getSocialShareLinks(120),
    getProducts(),
  ]);

  return (
    <SocialShareManager
      initialConfig={config}
      initialLinks={links}
      products={products.map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price,
      }))}
    />
  );
}

