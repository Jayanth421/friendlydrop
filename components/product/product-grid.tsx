import { Product } from "@/types";
import { ProductCard } from "@/components/product/product-card";

export function ProductGrid({
  products,
  variant = "default",
}: {
  products: Product[];
  variant?: "default" | "listing";
}) {
  return (
    <div
      className={
        variant === "listing"
          ? "grid grid-cols-2 gap-0 border-l border-t border-[#e6e7eb] sm:gap-3 sm:border-0 lg:grid-cols-4 lg:gap-4"
          : "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
      }
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} variant={variant} />
      ))}
    </div>
  );
}
