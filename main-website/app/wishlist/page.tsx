"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductGrid } from "@/components/product/product-grid";
import { useWishlistStore } from "@/store/use-wishlist-store";
import { Product } from "@/types";

export default function WishlistPage() {
  const productIds = useWishlistStore((state) => state.productIds);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!productIds.length) {
      setProducts([]);
      return;
    }

    fetch(`/api/products?ids=${productIds.join(",")}`)
      .then((res) => res.json())
      .then((data) => setProducts(data.products ?? []));
  }, [productIds]);

  const content = useMemo(() => {
    if (!productIds.length) {
      return (
        <EmptyState
          title="No wishlist items"
          description="Save products you love and find them quickly."
          action={
            <Link href="/products" className="text-accent">
              Browse products
            </Link>
          }
        />
      );
    }

    return <ProductGrid products={products} />;
  }, [productIds, products]);

  return (
    <main className="space-y-6">
      <h1 className="font-display text-4xl font-bold text-ink">Wishlist</h1>
      {content}
    </main>
  );
}
