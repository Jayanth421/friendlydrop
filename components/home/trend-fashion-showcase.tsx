import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Product } from "@/types";

const FALLBACK_IMAGES = {
  hero: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80",
  modelA: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=700&q=80",
  modelB: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=700&q=80",
  modelC: "https://images.unsplash.com/photo-1464863979621-258859e62245?w=700&q=80",
  modelD: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=700&q=80",
};

const ALLOWED_HOSTS = new Set([
  "images.unsplash.com",
  "firebasestorage.googleapis.com",
  "m.media-amazon.com",
  "api.qrserver.com",
  "i.pinimg.com",
]);

function resolveSafeImage(input?: string, fallback?: string) {
  if (!input) return fallback ?? FALLBACK_IMAGES.hero;

  try {
    const parsed = new URL(input);
    if (ALLOWED_HOSTS.has(parsed.hostname)) {
      return input;
    }
  } catch (error) {}

  return fallback ?? FALLBACK_IMAGES.hero;
}

function uniqueImages(products: Product[]) {
  const images = products
    .map((product) => resolveSafeImage(product.images[0]))
    .filter(Boolean)
    .slice(0, 4);

  while (images.length < 4) {
    images.push([FALLBACK_IMAGES.modelA, FALLBACK_IMAGES.modelB, FALLBACK_IMAGES.modelC, FALLBACK_IMAGES.modelD][images.length]);
  }

  return images;
}

export function TrendFashionShowcase({ featuredProducts }: { featuredProducts: Product[] }) {
  const heroImage = resolveSafeImage(featuredProducts[0]?.images[0], FALLBACK_IMAGES.hero);
  const fashionImages = uniqueImages(featuredProducts);
  const brands = ["ZARA", "PUMA", "H&M", "NIKE", "LEVI'S"];

  return (
    <section className="mx-auto w-full max-w-5xl overflow-hidden rounded-[2rem] border border-slate-300/60 bg-[#efefef] shadow-[0_35px_120px_-60px_rgba(0,0,0,0.55)] dark:border-slate-700">
      <div className="bg-black px-5 pb-6 pt-4 text-white md:px-10">
        <div className="mb-7 flex items-center justify-between border-b border-white/15 pb-4">
          <p className="font-grotesk text-xl font-bold">TREND.</p>
          <div className="hidden items-center gap-5 text-[11px] font-semibold uppercase tracking-[0.11em] text-white/80 md:flex">
            <span>New Arrivals</span>
            <span>All Products</span>
            <span>Collections</span>
            <span>Login</span>
          </div>
        </div>

        <div className="grid items-center gap-6 md:grid-cols-[1.2fr_1fr]">
          <div>
            <h1 className="font-grotesk text-4xl font-black uppercase leading-[0.95] md:text-6xl">
              Transform your{" "}
              <span className="text-[#d9ff00]">
                look
              </span>{" "}
              with fashion that speaks{" "}
              <span className="text-[#d9ff00]">to you</span>
            </h1>
            <p className="mt-4 max-w-lg text-sm text-white/70">
              Elevate your style with smart edits, premium silhouettes, and AI-powered product discovery built for modern fashion brands.
            </p>
            <Link
              href="/products?sort=newest"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.13em] text-black"
            >
              New Arrival <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#d9ff00]">▶</span>
            </Link>
          </div>
          <div className="relative mx-auto h-[320px] w-full max-w-[280px] rounded-[140px] bg-white/95 p-3">
            <Image src={heroImage} alt="Fashion model" fill className="rounded-[132px] object-cover" sizes="(max-width: 768px) 70vw, 280px" />
            <span className="absolute -right-2 top-4 rotate-12 bg-[#d9ff00] px-3 py-1 text-sm font-black text-black">2026</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 items-center gap-2 bg-[#d9ff00] px-3 py-3 text-center text-base font-black text-black md:px-6 md:text-2xl">
        {brands.map((brand) => (
          <span key={brand} className="font-grotesk">{brand}</span>
        ))}
      </div>

      <div className="space-y-5 bg-[#efefef] px-4 pb-8 pt-7 md:px-8">
        <p className="text-center font-grotesk text-3xl font-black uppercase text-slate-900 md:text-4xl">Up to 50% Cashback</p>

        <div className="relative">
          <p className="pointer-events-none select-none text-center font-grotesk text-[4.5rem] font-black uppercase leading-none tracking-[0.05em] text-transparent md:text-[10rem]" style={{ WebkitTextStroke: "1px #9ca3af" }}>
            Fashion
          </p>
          <div className="absolute inset-0 flex items-end justify-center gap-4 md:gap-9">
            {fashionImages.map((image, index) => (
              <div key={image + index} className="group relative h-44 w-20 md:h-72 md:w-32">
                <Image src={image} alt="Fashion pick" fill className="rounded-xl object-cover shadow-xl" sizes="(max-width: 768px) 25vw, 128px" />
                <button className="absolute left-1/2 top-1/2 inline-flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white bg-black/85 text-white opacity-90 transition group-hover:scale-110">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <h2 className="text-center font-grotesk text-3xl font-black uppercase text-slate-900">Essential Styling</h2>

        <div className="grid grid-cols-3 gap-3">
          {fashionImages.slice(0, 3).map((image, index) => (
            <article key={image + "essential"} className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="relative aspect-[4/5]">
                <Image src={image} alt={`Essential styling ${index + 1}`} fill className="object-cover" sizes="(max-width: 768px) 33vw, 220px" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
