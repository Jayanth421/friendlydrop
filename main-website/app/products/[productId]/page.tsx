import { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddToCartSection } from "@/components/product/add-to-cart-section";
import { ProductGallery } from "@/components/product/product-gallery";
import { RecommendedProducts } from "@/components/product/recommended-products";
import { ReviewForm } from "@/components/product/review-form";
import { ReviewList } from "@/components/product/review-list";
import { TrackProductView } from "@/components/product/track-product-view";
import Link from "next/link";
import {
  getProductById,
  getRecommendedProducts,
  getReviews,
  resolveProductPageSectionsForProduct,
  getVendorProfile,
} from "@/lib/firebase/firestore";
import { ProductPageSectionId } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/media";

export async function generateMetadata({ params }: { params: { productId: string } }): Promise<Metadata> {
  const product = await getProductById(params.productId);
  if (!product) {
    return {};
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const productUrl = `${appUrl}/products/${product.id}`;
  const title = product.seo?.metaTitle || product.name;
  const description = product.seo?.metaDescription || product.description.slice(0, 160);
  const image = resolveMediaUrl(product.images[0], { width: 1200, quality: 75, format: "webp" });

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
  const primaryImage = resolveMediaUrl(product.images[0], { width: 1200, quality: 75, format: "webp" }) || "/file.svg";
  const encodedUrl = encodeURIComponent(productUrl);
  const encodedText = encodeURIComponent(`${product.name} - ${formatCurrency(product.price)}`);
  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
  };

  const [reviews, recommendedProducts, productPageSections, vendorProfile] = await Promise.all([
    getReviews(product.id),
    getRecommendedProducts({
      productId: product.id,
      category: product.category,
      limit: 8,
    }),
    resolveProductPageSectionsForProduct(product.id),
    product.vendorId ? getVendorProfile(product.vendorId) : Promise.resolve(null),
  ]);

  const enabledSectionIds = new Set(productPageSections.filter((section) => section.enabled).map((section) => section.id));
  const hasSection = (sectionId: ProductPageSectionId) => enabledSectionIds.has(sectionId);

  const discountedPrice = product.discountPercent
    ? Math.max(1, Math.round(product.price - (product.price * product.discountPercent) / 100))
    : product.price;

  const tags = product.tags?.length ? product.tags : [product.category.replace("-", " ")];
  const highlightPoints = product.benefits?.length
    ? product.benefits
    : [
        "Dermatologist-inspired formula",
        "Designed for daily use",
        "Supports healthy skin barrier",
      ];
  const ingredients = product.ingredients?.length ? product.ingredients : ["Niacinamide", "Glycerin", "Panthenol"];
  const usage = product.usageInstructions?.length
    ? product.usageInstructions
    : ["Apply on damp skin", "Massage gently in circular motion", "Rinse thoroughly"];
  const trustBadges = product.trustBadges?.length ? product.trustBadges : ["Fragrance free", "Paraben free", "Hypoallergenic"];

  return (
    <main className="space-y-8 px-4 pb-24 pt-6 md:px-10 md:pt-10">
      {hasSection("announcement_bar") ? (
        <section className="mx-auto w-full max-w-[1400px] rounded-xl border border-[#dddbdc] bg-[#daff3a] px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.1em] text-[#11121c]">
          Free shipping for prepaid orders above ₹999
        </section>
      ) : null}

      {hasSection("breadcrumbs") ? (
        <section className="mx-auto w-full max-w-[1400px] text-xs text-[#737373]">
          Products &gt; {product.category.replace("-", " ")} &gt; {product.name}
        </section>
      ) : null}

      <section className="mx-auto w-full max-w-[1400px]">
        <TrackProductView productId={product.id} />
        <div className="grid gap-8 lg:grid-cols-[1.75fr_1fr]">
          {hasSection("product_gallery") ? (
            <ProductGallery images={product.images} title={product.name} />
          ) : (
            <div className="overflow-hidden rounded-xl border border-[#dddbdc] bg-white p-3">
              <img src={primaryImage} alt={product.name} className="h-auto w-full object-cover" loading="lazy" />
            </div>
          )}

          <div className="space-y-5">
            {hasSection("product_tags") ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-[#dddbdc] px-3 py-1 text-xs text-[#262626]">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="space-y-3 border-[#ecebeb] pb-4">
              <p className="text-[12px] uppercase tracking-[0.08em] text-[#737373]">{product.category.replace("-", " ")}</p>
              <h1 className="text-3xl leading-tight text-[#262626] md:text-5xl">{product.name}</h1>
              {product.shortDescription ? <p className="max-w-xl text-sm text-[#555]">{product.shortDescription}</p> : null}

              {hasSection("ratings") ? (
                <div className="flex flex-wrap items-center gap-4 text-sm text-[#737373]">
                  <span>{typeof product.rating === "number" ? `${product.rating.toFixed(1)} / 5` : "No ratings yet"}</span>
                  <span>{product.reviewCount ?? 0} reviews</span>
                  <span className={product.stock > 0 ? "text-[#262626]" : "text-red-600"}>
                    {product.stock > 0 ? "In stock" : "Out of stock"}
                  </span>
                </div>
              ) : null}

              {hasSection("price") ? (
                <div className="flex flex-wrap items-end gap-3">
                  <p className="text-3xl leading-none text-[#262626] md:text-[44px]">{formatCurrency(discountedPrice)}</p>
                  {product.discountPercent ? (
                    <>
                      <p className="text-base text-[#8a8a8a] line-through">{formatCurrency(product.price)}</p>
                      <p className="bg-[#b3ef00] px-2 py-1 text-xs uppercase tracking-[0.1em] text-[#262626]">
                        {product.discountPercent}% Off
                      </p>
                    </>
                  ) : null}
                </div>
              ) : null}

              {vendorProfile && (
                <p className="text-sm pt-2">
                  <Link href={`/vendors/${vendorProfile.id}`} className="font-medium text-[#007185] hover:text-[#c40000] hover:underline">Visit the {vendorProfile.businessName} Store</Link>
                </p>
              )}
            </div>

            {hasSection("sticky_add_to_cart") ? <AddToCartSection product={product} /> : null}

            {hasSection("coupon_section") ? (
              <section className="space-y-2 border border-[#dddbdc] bg-[#f7f7f7] p-4">
                <h2 className="text-[12px] uppercase tracking-[0.08em] text-[#737373]">Coupon</h2>
                <p className="text-sm text-[#262626]">Use code <span className="font-semibold">SKIN10</span> for extra 10% off.</p>
              </section>
            ) : null}

            {hasSection("subscription_option") ? (
              <section className="space-y-2 border border-[#dddbdc] p-4">
                <h2 className="text-[12px] uppercase tracking-[0.08em] text-[#737373]">Subscription</h2>
                <label className="inline-flex items-center gap-2 text-sm text-[#262626]">
                  <input type="checkbox" />
                  Subscribe & save on recurring deliveries
                </label>
              </section>
            ) : null}

            {hasSection("delivery_information") ? (
              <section className="space-y-3 border border-[#dddbdc] p-4">
                <p className="text-sm text-[#262626]">
                  {product.deliveryTime ?? "Delivers in 24-48 hrs"} | {product.shippingInfo ?? "Free delivery available"}
                </p>
                <p className="text-sm text-[#737373]">Easy returns and secure packaging available for this product.</p>
              </section>
            ) : null}

            {hasSection("icons_features_row") ? (
              <section className="grid grid-cols-2 gap-2 border border-[#dddbdc] p-4 md:grid-cols-4">
                {["Fragrance free", "Paraben free", "Hypoallergenic", "Deep cleans"].map((item) => (
                  <p key={item} className="rounded-lg border border-[#ecebeb] px-2 py-2 text-center text-xs text-[#262626]">{item}</p>
                ))}
              </section>
            ) : null}

            {hasSection("trust_badges") ? (
              <section className="flex flex-wrap gap-2">
                {trustBadges.map((badge) => (
                  <span key={badge} className="rounded-full border border-[#dddbdc] px-3 py-1 text-xs text-[#262626]">{badge}</span>
                ))}
              </section>
            ) : null}

            <section className="space-y-3 border border-[#dddbdc] p-4">
              <h2 className="text-[12px] uppercase tracking-[0.08em] text-[#737373]">Share</h2>
              <div className="flex flex-wrap gap-2 text-sm">
                <a href={shareLinks.whatsapp} target="_blank" rel="noreferrer" className="border border-[#dddbdc] px-3 py-1.5 text-[#262626] hover:bg-[#f8f8f8]">WhatsApp</a>
                <a href={shareLinks.facebook} target="_blank" rel="noreferrer" className="border border-[#dddbdc] px-3 py-1.5 text-[#262626] hover:bg-[#f8f8f8]">Facebook</a>
                <a href={shareLinks.twitter} target="_blank" rel="noreferrer" className="border border-[#dddbdc] px-3 py-1.5 text-[#262626] hover:bg-[#f8f8f8]">X</a>
                <a href={productUrl} target="_blank" rel="noreferrer" className="border border-[#dddbdc] px-3 py-1.5 text-[#262626] hover:bg-[#f8f8f8]">Copy Link</a>
              </div>
            </section>
          </div>
        </div>
      </section>

      {hasSection("feature_highlights") || hasSection("benefits") ? (
        <section className="mx-auto w-full max-w-[1400px] space-y-4 border border-[#dddbdc] bg-white p-5 md:p-8">
          <h2 className="text-2xl text-[#262626]">Why You&apos;ll Love It</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {highlightPoints.map((point) => (
              <div key={point} className="border border-[#ecebeb] p-4 text-sm text-[#262626]">
                {point}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {hasSection("ingredients") || hasSection("usage_instructions") ? (
        <section className="mx-auto grid w-full max-w-[1400px] gap-4 border border-[#dddbdc] bg-white p-5 md:grid-cols-2 md:p-8">
          {hasSection("ingredients") ? (
            <div className="space-y-3">
              <h2 className="text-xl text-[#262626]">Ingredients</h2>
              <ul className="space-y-2 text-sm text-[#555]">
                {ingredients.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {hasSection("usage_instructions") ? (
            <div className="space-y-3">
              <h2 className="text-xl text-[#262626]">How To Use</h2>
              <ul className="space-y-2 text-sm text-[#555]">
                {usage.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="mx-auto w-full max-w-[1400px] border border-[#dddbdc] bg-white p-5 md:p-8">
        <h2 className="text-2xl text-[#262626]">Product Details</h2>
        <p className="mt-4 text-sm leading-7 text-[#555]">{product.description}</p>
      </section>

      {hasSection("reviews") ? (
        <section className="mx-auto w-full max-w-[1400px] space-y-4">
          <h2 className="text-2xl text-[#262626]">Reviews</h2>
          <ReviewForm productId={product.id} />
          <ReviewList reviews={reviews} />
        </section>
      ) : null}

      {hasSection("recommended_products") || hasSection("related_products") || hasSection("frequently_bought_together") ? (
        <section className="mx-auto w-full max-w-[1400px]">
          <RecommendedProducts title="You may also like" products={recommendedProducts} />
        </section>
      ) : null}

      {hasSection("product_routine") || hasSection("combo_products") ? (
        <section className="mx-auto w-full max-w-[1400px] space-y-2 border border-[#dddbdc] bg-white p-5">
          <h2 className="text-xl text-[#262626]">Complete Your Routine</h2>
          <p className="text-sm text-[#555]">
            Curated routine and combo recommendations are automatically generated from category, tags, and customer behavior.
          </p>
        </section>
      ) : null}

      {hasSection("faq") ? (
        <section className="mx-auto w-full max-w-[1400px] space-y-2 border border-[#dddbdc] bg-white p-5">
          <h2 className="text-xl text-[#262626]">FAQ</h2>
          <p className="text-sm text-[#555]">- Is this product suitable for sensitive skin? Yes, it is formulated for gentle daily use.</p>
          <p className="text-sm text-[#555]">- How often can I use this product? Most customers use it once or twice daily.</p>
        </section>
      ) : null}

      {hasSection("recently_viewed_products") ? (
        <section className="mx-auto w-full max-w-[1400px] space-y-2 border border-[#dddbdc] bg-white p-5">
          <h2 className="text-xl text-[#262626]">Recently Viewed</h2>
          <p className="text-sm text-[#555]">Recently viewed products stay synced per customer session.</p>
        </section>
      ) : null}

      {hasSection("floating_buy_button") ? (
        <div className="fixed inset-x-0 bottom-16 z-40 px-4 md:hidden">
          <button type="button" className="w-full rounded-full bg-[#11121c] py-3 text-sm font-semibold uppercase tracking-[0.08em] text-white">
            Buy Now
          </button>
        </div>
      ) : null}
    </main>
  );
}
