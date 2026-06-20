import { EverlaneHome } from "@/components/home/everlane-home";
import { getCmsPageBySlug, getFeaturedProducts, getProducts } from "@/lib/firebase/firestore";

export default async function HomePage() {
  const [featuredProducts, latestProducts, allProducts, homeCmsPage] = await Promise.all([
    getFeaturedProducts(),
    getProducts({ sort: "newest" }),
    getProducts(),
    getCmsPageBySlug("home"),
  ]);

  return (
    <EverlaneHome
      featuredProducts={featuredProducts}
      latestProducts={latestProducts}
      allProducts={allProducts}
      cmsPage={homeCmsPage?.status === "published" ? homeCmsPage : null}
    />
  );
}

