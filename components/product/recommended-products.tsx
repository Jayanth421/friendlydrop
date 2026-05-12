import { Product } from "@/types";
import { ProductGrid } from "@/components/product/product-grid";

export function RecommendedProducts({ title, products }: { title?: string; products: Product[] }) {
  if (!products.length) {
    return null;
  }

  return (
    <section className="space-y-4 border-t border-[#dddbdc] pt-8">
      <h2 className="text-2xl text-[#262626]">{title ?? "Recommended Products"}</h2>
      <ProductGrid products={products} />
    </section>
  );
}
