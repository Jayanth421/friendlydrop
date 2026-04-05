import { notFound } from "next/navigation";
import { AddToCartSection } from "@/components/product/add-to-cart-section";
import { ProductGallery } from "@/components/product/product-gallery";
import { ReviewForm } from "@/components/product/review-form";
import { ReviewList } from "@/components/product/review-list";
import { TrackProductView } from "@/components/product/track-product-view";
import { getProductById, getReviews } from "@/lib/firebase/firestore";
import { formatCurrency } from "@/lib/utils";

export default async function ProductDetailPage({ params }: { params: { productId: string } }) {
  const product = await getProductById(params.productId);

  if (!product) {
    notFound();
  }

  const reviews = await getReviews(product.id);

  return (
    <main className="grid gap-8 lg:grid-cols-2">
      <TrackProductView productId={product.id} />
      <ProductGallery images={product.images} title={product.name} />

      <div className="space-y-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{product.category.replace("-", " ")}</p>
          <h1 className="mt-1 font-display text-4xl font-bold text-ink">{product.name}</h1>
          <p className="mt-2 text-2xl font-semibold text-ink">{formatCurrency(product.price)}</p>
          <p className="mt-3 text-sm text-slate-600">{product.description}</p>
        </div>

        <AddToCartSection product={product} />

        <section className="space-y-4">
          <h2 className="font-display text-2xl font-semibold text-ink">Reviews</h2>
          <ReviewForm productId={product.id} />
          <ReviewList reviews={reviews} />
        </section>
      </div>
    </main>
  );
}
