import { EverlaneHome } from "@/components/home/everlane-home";
import { getFeaturedProducts, getProducts } from "@/lib/firebase/firestore";

export default async function HomePage() {
  const [featuredProducts, latestProducts, allProducts] = await Promise.all([
    getFeaturedProducts(),
    getProducts({ sort: "newest" }),
    getProducts(),
  ]);

  return (
    <EverlaneHome
      featuredProducts={featuredProducts}
      latestProducts={latestProducts}
      allProducts={allProducts}
    />
  );
}
