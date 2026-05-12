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
          ? "grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 lg:grid-cols-4"
          : "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
      }
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} variant={variant} />
      ))}
    </div>
  );
}
