import { Product } from "@/types";
import { ProductGrid } from "@/components/product/product-grid";

export function RecommendedProducts({ title, products }: { title?: string; products: Product[] }) {
  if (!products.length) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h2 className="font-display text-2xl font-semibold text-ink">{title ?? "Recommended Products"}</h2>
      <ProductGrid products={products} />
    </section>
  );
}
