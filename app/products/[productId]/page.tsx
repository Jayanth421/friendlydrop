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
    <main className="space-y-10 px-4 pb-12 pt-6 md:px-10 md:pt-10">
      <section className="mx-auto w-full max-w-[1400px]">
        <TrackProductView productId={product.id} />
        <div className="grid gap-8 lg:grid-cols-[1.75fr_1fr]">
          <ProductGallery images={product.images} title={product.name} />

          <div className="space-y-6">
            <div className="space-y-3 border-b border-[#ecebeb] pb-5">
              <p className="text-[12px] uppercase tracking-[0.08em] text-[#737373]">
                {product.category.replace("-", " ")}
              </p>
              <h1 className="text-3xl leading-tight text-[#262626] md:text-5xl">{product.name}</h1>
              <div className="flex flex-wrap items-end gap-3">
                <p className="text-3xl leading-none text-[#262626] md:text-[44px]">
                  {formatCurrency(discountedPrice)}
                </p>
                {product.discountPercent ? (
                  <>
                    <p className="text-base text-[#8a8a8a] line-through">{formatCurrency(product.price)}</p>
                    <p className="bg-[#b3ef00] px-2 py-1 text-xs uppercase tracking-[0.1em] text-[#262626]">
                      {product.discountPercent}% Off
                    </p>
                  </>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-[#737373]">
                <span>{typeof product.rating === "number" ? `${product.rating.toFixed(1)} / 5` : "No ratings yet"}</span>
                <span>{product.reviewCount ?? 0} reviews</span>
                <span className={product.stock > 0 ? "text-[#262626]" : "text-red-600"}>
                  {product.stock > 0 ? "In stock" : "Out of stock"}
                </span>
              </div>
            </div>

            <AddToCartSection product={product} />

            <section className="space-y-3 border border-[#dddbdc] p-4">
              <h2 className="text-[12px] uppercase tracking-[0.08em] text-[#737373]">Share</h2>
              <div className="flex flex-wrap gap-2 text-sm">
                <a href={shareLinks.whatsapp} target="_blank" rel="noreferrer" className="border border-[#dddbdc] px-3 py-1.5 text-[#262626] hover:bg-[#f8f8f8]">WhatsApp</a>
                <a href={shareLinks.facebook} target="_blank" rel="noreferrer" className="border border-[#dddbdc] px-3 py-1.5 text-[#262626] hover:bg-[#f8f8f8]">Facebook</a>
                <a href={shareLinks.twitter} target="_blank" rel="noreferrer" className="border border-[#dddbdc] px-3 py-1.5 text-[#262626] hover:bg-[#f8f8f8]">X</a>
                <a href={productUrl} target="_blank" rel="noreferrer" className="border border-[#dddbdc] px-3 py-1.5 text-[#262626] hover:bg-[#f8f8f8]">Copy Link</a>
              </div>
            </section>

            <section className="space-y-4 border border-[#dddbdc] p-4">
              <div className="flex items-start gap-3">
                <span className="mt-1 inline-block h-3 w-3 rounded-full bg-[#262626]" />
                <div>
                  <h3 className="text-sm uppercase tracking-[0.08em] text-[#262626]">Free Shipping</h3>
                  <p className="mt-1 text-sm text-[#737373]">
                    On all orders over 2,500 INR.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-1 inline-block h-3 w-3 rounded-full bg-[#262626]" />
                <div>
                  <h3 className="text-sm uppercase tracking-[0.08em] text-[#262626]">Easy Returns</h3>
                  <p className="mt-1 text-sm text-[#737373]">
                    7-day return window for eligible products.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-1 inline-block h-3 w-3 rounded-full bg-[#262626]" />
                <div>
                  <h3 className="text-sm uppercase tracking-[0.08em] text-[#262626]">Gift Option</h3>
                  <p className="mt-1 text-sm text-[#737373]">
                    Add a personalized note during checkout.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1400px] border border-[#dddbdc] bg-white p-5 md:p-8">
        <h2 className="text-2xl text-[#262626]">Product Details</h2>
        <p className="mt-4 text-sm leading-7 text-[#555]">{product.description}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border border-[#ecebeb] p-4">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#737373]">Brand</p>
            <p className="mt-1 text-sm text-[#262626]">{product.brand ?? "FriendlyDrop"}</p>
          </div>
          <div className="border border-[#ecebeb] p-4">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#737373]">SKU</p>
            <p className="mt-1 text-sm text-[#262626]">{product.sku ?? "N/A"}</p>
          </div>
          <div className="border border-[#ecebeb] p-4">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#737373]">Weight</p>
            <p className="mt-1 text-sm text-[#262626]">{product.weightGrams ? `${product.weightGrams} g` : "Standard"}</p>
          </div>
          <div className="border border-[#ecebeb] p-4">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#737373]">Category</p>
            <p className="mt-1 text-sm text-[#262626]">{product.category.replace("-", " ")}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1400px] space-y-4">
        <h2 className="text-2xl text-[#262626]">Reviews</h2>
        <ReviewForm productId={product.id} />
        <ReviewList reviews={reviews} />
      </section>

      <section className="mx-auto w-full max-w-[1400px]">
        <RecommendedProducts title="You may also like" products={recommendedProducts} />
      </section>
    </main>
  );
}
