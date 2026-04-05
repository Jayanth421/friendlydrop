import { Metadata } from "next";
import { ProductGrid } from "@/components/product/product-grid";
import { getProducts } from "@/lib/firebase/firestore";
import { CATEGORIES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Shop Products",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string; sort?: "popularity" | "price-asc" | "price-desc"; minPrice?: string; maxPrice?: string };
}) {
  const products = await getProducts({
    category: searchParams.category,
    sort: searchParams.sort,
    minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
  });

  return (
    <main className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="font-display text-4xl font-bold text-ink">Shop Products</h1>
        <p className="mt-2 text-slate-600">Filter by category, price, and popularity to find your perfect custom gift.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <a
              key={category.value}
              href={`/products?category=${category.value}`}
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700"
            >
              {category.label}
            </a>
          ))}
        </div>
      </div>

      <ProductGrid products={products} />
    </main>
  );
}
