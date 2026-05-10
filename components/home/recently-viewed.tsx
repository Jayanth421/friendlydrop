"use client";

import { Product } from "@/types";
import { ProductGrid } from "@/components/product/product-grid";
import { useRecentlyViewedStore } from "@/store/use-recently-viewed-store";

export function RecentlyViewed({ products }: { products: Product[] }) {
  const viewed = useRecentlyViewedStore((state) => state.items);

  const result = products.filter((product) => viewed.includes(product.id)).slice(0, 4);

  if (!result.length) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h2 className="luxury-heading text-3xl font-semibold">Recently Viewed</h2>
      <ProductGrid products={result} />
    </section>
  );
}
