import { HeroSection } from "@/components/home/hero-section";
import { CategoryStrip } from "@/components/home/category-strip";
import { ProductGrid } from "@/components/product/product-grid";
import { RecentlyViewed } from "@/components/home/recently-viewed";
import { getFeaturedProducts, getProducts } from "@/lib/firebase/firestore";

export default async function HomePage() {
  const [featuredProducts, allProducts] = await Promise.all([getFeaturedProducts(), getProducts()]);

  return (
    <main className="space-y-6">
      <HeroSection />
      <CategoryStrip />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold text-black">Featured Products</h2>
          <a href="/products" className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            See all
          </a>
        </div>
        <ProductGrid products={featuredProducts} />
      </section>

      <RecentlyViewed products={allProducts} />
    </main>
  );
}
