import { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddToCartSection } from "@/components/product/add-to-cart-section";
import { ProductGallery } from "@/components/product/product-gallery";
import { ReviewForm } from "@/components/product/review-form";
import { ReviewList } from "@/components/product/review-list";
import { TrackProductView } from "@/components/product/track-product-view";
import { getProductById, getReviews } from "@/lib/firebase/firestore";
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

        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Share</h2>
          <div className="flex flex-wrap gap-2 text-sm">
            <a href={shareLinks.whatsapp} target="_blank" rel="noreferrer" className="rounded border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50">WhatsApp</a>
            <a href={shareLinks.facebook} target="_blank" rel="noreferrer" className="rounded border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50">Facebook</a>
            <a href={shareLinks.twitter} target="_blank" rel="noreferrer" className="rounded border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50">X</a>
            <a href={productUrl} target="_blank" rel="noreferrer" className="rounded border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50">Copy Link</a>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl font-semibold text-ink">Reviews</h2>
          <ReviewForm productId={product.id} />
          <ReviewList reviews={reviews} />
        </section>
      </div>
    </main>
  );
}
