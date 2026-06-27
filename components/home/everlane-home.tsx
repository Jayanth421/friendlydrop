"use client";

import Image from "next/image";
import Link from "next/link";
import { Leaf, MapPin, Package, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { BannerItem, CmsPageConfig, Product } from "@/types";
import { resolveMediaUrl } from "@/lib/media";
import { useEffect, useRef, useState } from "react";

const CATEGORY_ITEMS = [
  {
    label: "Shirts",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=700&q=80",
  },
  {
    label: "Denim",
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=700&q=80",
  },
  {
    label: "Tees",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=700&q=80",
  },
  {
    label: "Pants",
    image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=700&q=80",
  },
  {
    label: "Sweaters",
    image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=700&q=80",
  },
  {
    label: "Outerwear",
    image: "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=700&q=80",
  },
];

const EDITORIAL_BLOCKS = [
  {
    title: "Our Holiday Gift Picks",
    caption: "The best presents for everyone on your list.",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=80",
    cta: "Read More",
  },
  {
    title: "Cleaner Fashion",
    caption: "See the sustainability efforts behind each product we source.",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80",
    cta: "Learn More",
  },
];

const FALLBACK_HERO = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1600&q=80";
const FALLBACK_MISSION = "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=1600&q=80";

const ALLOWED_HOSTS = new Set([
  "images.unsplash.com",
  "firebasestorage.googleapis.com",
  "m.media-amazon.com",
  "api.qrserver.com",
  "i.pinimg.com",
  "mhrkejroymytplmppjep.supabase.co",
]);

function safeImage(input?: string, fallback?: string) {
  if (!input) return fallback ?? FALLBACK_HERO;
  const resolved = resolveMediaUrl(input, { width: 1600, quality: 75, format: "webp" });
  if (!resolved) return fallback ?? FALLBACK_HERO;
  try {
    const url = new URL(resolved);
    if (ALLOWED_HOSTS.has(url.hostname)) return resolved;
  } catch (error) {}
  return fallback ?? FALLBACK_HERO;
}

function firstN(products: Product[], total: number, fallback: string) {
  const resolved = products
    .map((item) => ({
      ...item,
      images: [safeImage(item.images[0], fallback)],
    }))
    .slice(0, total);

  if (resolved.length >= total) return resolved;

  while (resolved.length < total) {
    resolved.push({
      id: `fallback-${resolved.length}`,
      name: "Seasonal Essential",
      slug: "seasonal-essential",
      description: "Limited seasonal collection",
      price: 2499,
      images: [fallback],
      category: "photo-prints",
      stock: 10,
      createdAt: new Date().toISOString(),
    });
  }

  return resolved;
}

// ── Hero Banner Carousel ────────────────────────────────────────────────────

function resolveBannerHref(banner: BannerItem): string {
  if (banner.linkType === "external") return banner.linkTarget;
  if (banner.linkType === "product") return `/products/${banner.linkTarget}`;
  if (banner.linkType === "category") return banner.linkTarget.startsWith("/") ? banner.linkTarget : `/products?category=${banner.linkTarget}`;
  return banner.linkTarget;
}

function HeroBannerCarousel({ banners }: { banners: BannerItem[] }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const prev = () => setCurrent((c) => (c - 1 + banners.length) % banners.length);
  const next = () => setCurrent((c) => (c + 1) % banners.length);

  useEffect(() => {
    if (banners.length <= 1) return;
    timerRef.current = setInterval(() => setCurrent((c) => (c + 1) % banners.length), 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [banners.length]);

  const banner = banners[current];
  const imgSrc = resolveMediaUrl(banner.imageDesktop) || banner.imageDesktop;

  return (
    <section className="relative overflow-hidden">
      <div className="relative h-[480px] w-full md:h-[620px]">
        {/* Slide images — render all, show current via opacity for smooth transition */}
        {banners.map((b, i) => {
          const src = resolveMediaUrl(b.imageDesktop) || b.imageDesktop;
          return (
            <div
              key={b.id}
              className={`absolute inset-0 transition-opacity duration-700 ${i === current ? "opacity-100" : "opacity-0"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={b.title} className="h-full w-full object-cover" />
            </div>
          );
        })}

        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />

        {/* Text overlay */}
        <div className="absolute inset-y-0 left-[8%] flex max-w-xl flex-col justify-center text-white">
          <h1 className="font-sans text-4xl font-medium tracking-[0.02em] md:text-[64px] md:leading-[1.02]">
            {banner.title}
          </h1>
          <Link
            href={resolveBannerHref(banner)}
            className="mt-8 inline-flex w-fit items-center justify-center rounded-[10px] bg-white px-14 py-3 text-sm uppercase tracking-[0.12em] text-[#262626] transition hover:bg-[#efefef]"
          >
            Shop Now
          </Link>
        </div>

        {/* Prev / Next arrows (only if more than one banner) */}
        {banners.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous banner"
              className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/50"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next banner"
              className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/50"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Dot indicators */}
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
              {banners.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrent(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${i === current ? "w-6 bg-white" : "w-2 bg-white/50"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export function EverlaneHome({
  featuredProducts,
  latestProducts,
  allProducts,
  cmsPage,
  heroBanners = [],
}: {
  featuredProducts: Product[];
  latestProducts: Product[];
  allProducts: Product[];
  cmsPage?: CmsPageConfig | null;
  heroBanners?: BannerItem[];
}) {
  const heroImage = safeImage(cmsPage?.heroImageUrl || featuredProducts[0]?.images[0], FALLBACK_HERO);
  const categoryFallbacks = firstN(featuredProducts, 6, FALLBACK_HERO);
  const featuredRow = firstN(latestProducts, 5, FALLBACK_HERO);
  const socialStrip = firstN(allProducts, 5, FALLBACK_HERO);
  const storyImage = safeImage(allProducts[1]?.images[0], FALLBACK_MISSION);

  return (
    <main className="figma-home pb-20">
      {heroBanners.length > 0 ? (
        <HeroBannerCarousel banners={heroBanners} />
      ) : (
        <section className="relative overflow-hidden">
          <div className="relative h-[480px] w-full md:h-[620px]">
            <Image src={heroImage} alt="Seasonal collection" fill className="object-cover" sizes="100vw" priority />
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />
            <div className="absolute inset-y-0 left-[8%] flex max-w-xl flex-col justify-center text-white">
              <h1 className="font-sans text-4xl font-medium tracking-[0.02em] md:text-[64px] md:leading-[1.02]">
                {cmsPage?.title || "Your Cozy Era"}
              </h1>
              <p className="mt-4 text-xl font-light md:text-[34px] md:leading-[1.35]">
                {cmsPage?.excerpt || "Get peak comfy-chic with new winter essentials."}
              </p>
              <Link
                href="/products"
                className="mt-8 inline-flex w-fit items-center justify-center rounded-[10px] bg-white px-14 py-3 text-sm uppercase tracking-[0.12em] text-[#262626] transition hover:bg-[#efefef]"
              >
                Shop Now
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-[1400px] px-4 py-12 md:px-10 md:py-16">
        <h2 className="text-center text-xl text-[#262626] md:text-[28px]">Shop by Category</h2>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORY_ITEMS.map((category, index) => (
            <Link key={category.label} href="/products" className="group block">
              <div className="relative aspect-[4/5] overflow-hidden bg-[#f3f3f3]">
                <Image
                  src={safeImage(categoryFallbacks[index]?.images[0], category.image)}
                  alt={category.label}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="(max-width: 1024px) 33vw, 16vw"
                />
              </div>
              <p className="pt-3 text-center text-xs uppercase tracking-[0.14em] text-[#262626]">{category.label}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 pb-12 md:px-10">
        <div className="grid gap-5 md:grid-cols-3">
          {featuredRow.slice(0, 3).map((product) => (
            <article key={product.id} className="group relative overflow-hidden">
              <div className="relative aspect-[4/5]">
                <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                <div className="absolute inset-0 bg-black/30 transition group-hover:bg-black/40" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <p className="text-2xl leading-tight">{product.name}</p>
                <Link href={`/products/${product.id}`} className="mt-2 inline-block border-b border-white pb-0.5 text-xs uppercase tracking-[0.16em]">
                  Shop Now
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 pb-12 md:px-10">
        <div className="relative overflow-hidden">
          <div className="relative h-[200px] w-full md:h-[280px]">
            <Image src={storyImage} alt="Mission statement" fill className="object-cover" sizes="100vw" />
            <div className="absolute inset-0 bg-black/35" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
            <p className="text-xl md:text-[30px]">We&apos;re on a Mission to Clean Up the Industry</p>
            <Link href="/about-brand" className="mt-4 inline-flex border border-white px-10 py-2 text-xs uppercase tracking-[0.16em]">
              Read More
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 pb-12 md:px-10">
        <div className="border-t border-black/80 pt-10 text-center">
          <h2 className="text-2xl text-[#262626] md:text-[36px]">FriendlyDrop Favorites</h2>
          <p className="mt-3 text-sm tracking-[0.12em] text-[#737373]">
            Beautifully functional. Purposefully designed.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {featuredRow.map((product) => (
            <article key={`fav-${product.id}`} className="group">
              <Link href={`/products/${product.id}`} className="block">
                <div className="relative aspect-[3/4] overflow-hidden bg-[#f5f5f5]">
                  <Image src={product.images[0]} alt={product.name} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(max-width: 1024px) 50vw, 20vw" />
                </div>
                <div className="space-y-1 pt-3 text-[#262626]">
                  <div className="flex items-start justify-between gap-2 text-xs tracking-[0.06em]">
                    <p className="line-clamp-2">{product.name}</p>
                    <p className="whitespace-nowrap">{formatCurrency(product.price)}</p>
                  </div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[#737373]">{(product.subcategory ?? product.category).replace("-", " ")}</p>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 pb-14 md:px-10">
        <div className="grid items-center gap-8 bg-[#f5f4f4] p-6 md:grid-cols-2 md:p-14">
          <div className="space-y-6">
            <p className="text-base tracking-[0.08em] text-[#262626]">People Are Talking</p>
            <p className="text-xl leading-[1.5] text-[#262626] md:text-3xl">
              &quot;Love this shirt. Fits perfectly and the fabric is thick without being stiff.&quot;
            </p>
            <p className="text-sm uppercase tracking-[0.12em] text-[#737373]">
              JonSnSF, The Heavyweight Overshirt
            </p>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden">
            <Image src={safeImage(allProducts[2]?.images[0], FALLBACK_HERO)} alt="Customer look" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 pb-16 md:px-10">
        <div className="grid gap-6 md:grid-cols-2">
          {EDITORIAL_BLOCKS.map((story) => (
            <article key={story.title} className="flex flex-col items-center gap-5 text-center">
              <h3 className="text-3xl text-[#262626]">{story.title}</h3>
              <div className="relative aspect-[4/5] w-full overflow-hidden">
                <Image src={story.image} alt={story.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
              </div>
              <p className="text-sm uppercase tracking-[0.12em] text-[#737373]">{story.caption}</p>
              <Link href="/about-brand" className="border-b border-[#262626] pb-0.5 text-xs uppercase tracking-[0.16em] text-[#262626]">
                {story.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 pb-12 md:px-10">
        <div className="border-t border-black/80 pt-10 text-center">
          <h3 className="text-[32px] text-[#262626]">FriendlyDrop On You</h3>
          <p className="mt-3 text-sm tracking-[0.12em] text-[#737373]">
            Share your latest look for a chance to be featured.
          </p>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {socialStrip.map((item) => (
            <article key={`social-${item.id}`} className="group relative">
              <div className="relative aspect-square overflow-hidden bg-[#ececec]">
                <Image src={item.images[0]} alt={item.name} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(max-width: 1024px) 33vw, 20vw" />
              </div>
              <Link
                href={`/products/${item.id}`}
                className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/80 text-white"
                aria-label={`Open ${item.name}`}
              >
                <ShoppingBag className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 pb-8 md:px-10">
        <div className="grid gap-5 border-t border-black/15 pt-12 md:grid-cols-3">
          <article className="flex flex-col items-center px-6 text-center">
            <Package className="h-9 w-9 text-[#262626]" />
            <h4 className="mt-5 text-base uppercase tracking-[0.12em] text-[#262626]">Complimentary Shipping</h4>
            <p className="mt-2 text-sm tracking-[0.1em] text-[#737373]">Enjoy free shipping on orders over 2,500 INR.</p>
          </article>
          <article className="flex flex-col items-center px-6 text-center">
            <Leaf className="h-9 w-9 text-[#262626]" />
            <h4 className="mt-5 text-base uppercase tracking-[0.12em] text-[#262626]">Consciously Crafted</h4>
            <p className="mt-2 text-sm tracking-[0.1em] text-[#737373]">Designed with you and the planet in mind.</p>
          </article>
          <article className="flex flex-col items-center px-6 text-center">
            <MapPin className="h-9 w-9 text-[#262626]" />
            <h4 className="mt-5 text-base uppercase tracking-[0.12em] text-[#262626]">Come Say Hi</h4>
            <p className="mt-2 text-sm tracking-[0.1em] text-[#737373]">We are now delivering across major Indian cities.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
