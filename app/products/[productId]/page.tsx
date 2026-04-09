import { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddToCartSection } from "@/components/product/add-to-cart-section";
import { ProductGallery } from "@/components/product/product-gallery";
import { RecommendedProducts } from "@/components/product/recommended-products";
import { ReviewForm } from "@/components/product/review-form";
import { ReviewList } from "@/components/product/review-list";
import { TrackProductView } from "@/components/product/track-product-view";
import { getProductById, getRecommendedProducts, getReviews } from "@/lib/firebase/firestore";
import { formatCurrency } from "@/lib/utils";

export async function generateMetadata({ params }: { params: { productId: string } }): Promise<Metadata> {
  const product = await getProductById(params.productId);
  if (!product) {
    return {};
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const productUrl = `${appUrl}/products/${product.id}`;
  const title = product.seo?.metaTitle || product.name;
  const description = product.seo?.metaDescription || product.description.slice(0, 160);
  const image = product.images[0];

  return {
    title,
    description,
    keywords: product.seo?.keywords,
    alternates: {
      canonical: product.seo?.canonicalUrl || productUrl,
    },
    robots: {
      index: !product.seo?.noindex,
      follow: !product.seo?.nofollow,
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: productUrl,
      images: image
        ? [
            {
              url: image,
              alt: product.seo?.imageAlt || product.name,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: { params: { productId: string } }) {
  const product = await getProductById(params.productId);

  if (!product) {
    notFound();
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const productUrl = `${appUrl}/products/${product.id}`;
  const encodedUrl = encodeURIComponent(productUrl);
  const encodedText = encodeURIComponent(`${product.name} - ${formatCurrency(product.price)}`);
  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
  };

  const [reviews, recommendedProducts] = await Promise.all([
    getReviews(product.id),
    getRecommendedProducts({
      productId: product.id,
      category: product.category,
      limit: 8,
    }),
  ]);

  const discountedPrice = product.discountPercent
    ? Math.max(1, Math.round(product.price - (product.price * product.discountPercent) / 100))
    : product.price;

  return (
    <main className="space-y-8">
      <section className="grid gap-8 lg:grid-cols-2">
        <TrackProductView productId={product.id} />
        <ProductGallery images={product.images} title={product.name} />

        <div className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">{product.category.replace("-", " ")}</p>
            <h1 className="mt-1 font-display text-4xl font-bold text-ink">{product.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-2xl font-semibold text-ink">{formatCurrency(discountedPrice)}</p>
              {product.discountPercent ? (
                <>
                  <p className="text-sm text-slate-400 line-through">{formatCurrency(product.price)}</p>
                  <p className="text-sm font-semibold text-emerald-600">{product.discountPercent}% OFF</p>
                </>
              ) : null}
            </div>
            <div className="mt-2 flex items-center gap-4 text-sm text-slate-600">
              <span>{typeof product.rating === "number" ? `${product.rating.toFixed(1)} star` : "No ratings yet"}</span>
              <span>{product.reviewCount ?? 0} reviews</span>
              <span className={product.stock > 0 ? "text-emerald-600" : "text-red-600"}>{product.stock > 0 ? "In stock" : "Out of stock"}</span>
            </div>
            <p className="mt-3 text-sm text-slate-600">{product.description}</p>
          </div>

          <AddToCartSection product={product} />

          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Share</h2>
            <div className="flex flex-wrap gap-2 text-sm">
              <a href={shareLinks.whatsapp} target="_blank" rel="noreferrer" className="rounded border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50">WhatsApp</a>
              <a href={shareLinks.facebook} target="_blank" rel="noreferrer" className="rounded border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50">Facebook</a>
              <a href={shareLinks.twitter} target="_blank" rel="noreferrer" className="rounded border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50">X</a>
              <a href={productUrl} target="_blank" rel="noreferrer" className="rounded border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50">Copy Link</a>
            </div>
          </section>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-display text-2xl font-semibold text-ink">Product Details</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{product.description}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Brand</p>
            <p className="mt-1 text-sm font-medium text-slate-800">{product.brand ?? "FriendlyDrop"}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">SKU</p>
            <p className="mt-1 text-sm font-medium text-slate-800">{product.sku ?? "N/A"}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Weight</p>
            <p className="mt-1 text-sm font-medium text-slate-800">{product.weightGrams ? `${product.weightGrams} g` : "Standard"}</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold text-ink">Reviews</h2>
        <ReviewForm productId={product.id} />
        <ReviewList reviews={reviews} />
      </section>

      <RecommendedProducts products={recommendedProducts} />
    </main>
  );
}
