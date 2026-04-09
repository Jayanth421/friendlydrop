import { HeroSection } from "@/components/home/hero-section";
import { CategoryStrip } from "@/components/home/category-strip";
import { ProductGrid } from "@/components/product/product-grid";
import { RecentlyViewed } from "@/components/home/recently-viewed";
import { getFeaturedProducts, getProducts } from "@/lib/firebase/firestore";
import { getBanners, getCatalogCategories } from "@/lib/enterprise";

export default async function HomePage() {
  const [featuredProducts, latestProducts, allProducts, banners, categories] = await Promise.all([
    getFeaturedProducts(),
    getProducts({ sort: "newest" }),
    getProducts(),
    getBanners(),
    getCatalogCategories(),
  ]);

  const now = Date.now();
  const activeBanners = banners.filter((banner) => {
    if (!banner.active) {
      return false;
    }

    const startAt = banner.startAt ? new Date(banner.startAt).getTime() : null;
    const endAt = banner.endAt ? new Date(banner.endAt).getTime() : null;
    const startsOk = !startAt || !Number.isFinite(startAt) || now >= startAt;
    const endsOk = !endAt || !Number.isFinite(endAt) || now <= endAt;
    return startsOk && endsOk;
  });

  const activeBanner =
    activeBanners
      .sort((a, b) => a.position - b.position)
      .find((banner) => banner.type === "hero") ??
    activeBanners[0];

  return (
    <main className="space-y-6">
      <HeroSection banner={activeBanner} />
      <CategoryStrip categories={categories} />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold text-black">Featured Products</h2>
          <a href="/products" className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            See all
          </a>
        </div>
        <ProductGrid products={featuredProducts} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold text-black">Latest Products</h2>
          <a href="/products?sort=newest" className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            New arrivals
          </a>
        </div>
        <ProductGrid products={latestProducts.slice(0, 8)} />
      </section>

      <RecentlyViewed products={allProducts} />
    </main>
  );
}
