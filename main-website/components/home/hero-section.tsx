"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BannerItem } from "@/types";

function resolveBannerHref(banner?: BannerItem) {
  if (!banner) {
    return "/products";
  }

  if (banner.linkType === "product") {
    return banner.linkTarget.startsWith("/") ? banner.linkTarget : `/products/${banner.linkTarget}`;
  }

  if (banner.linkType === "category") {
    return banner.linkTarget.startsWith("/") ? banner.linkTarget : `/products?category=${encodeURIComponent(banner.linkTarget)}`;
  }

  return banner.linkTarget;
}

export function HeroSection({ banner }: { banner?: BannerItem }) {
  const heading = banner?.title || "Luxury Fashion, Curated by AI.";
  const href = resolveBannerHref(banner);
  const isExternal = banner?.linkType === "external";

  return (
    <section className="relative overflow-hidden rounded-[34px] border border-white/20 bg-[#111218] p-6 text-white shadow-soft md:p-10">
      <div className="pointer-events-none absolute inset-0">
        {banner?.imageDesktop ? (
          <Image src={banner.imageDesktop} alt={banner.title} fill className="object-cover opacity-30" sizes="100vw" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/20" />
      </div>
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 max-w-xl space-y-5">
        <p className="luxe-chip border-white/25 bg-white/10 text-white/90">
          {banner?.type ? `${banner.type} edit` : "Couture Capsule 2026"}
        </p>
        <h1 className="luxury-heading text-5xl leading-[1.04] md:text-7xl">{heading}</h1>
        <p className="max-w-md text-sm text-white/80 md:text-base">
          Discover premium collections with AI style recommendations, virtual preview experiences, and concierge-level personalization.
        </p>
        <div className="flex flex-wrap gap-2.5">
          {isExternal ? (
            <a href={href} target="_blank" rel="noreferrer">
              <Button className="rounded-full bg-white text-black hover:bg-white/90">Explore Collection</Button>
            </a>
          ) : (
            <Link href={href}>
              <Button className="rounded-full bg-white text-black hover:bg-white/90">Explore Collection</Button>
            </Link>
          )}
          <Link href="/ai-recommendation">
            <Button variant="secondary" className="rounded-full border border-white/25 bg-transparent text-white hover:bg-white/10">
              AI Style Concierge
            </Button>
          </Link>
        </div>
        <div className="grid max-w-md grid-cols-3 gap-2 pt-3">
          <div className="glass-panel rounded-xl p-2 text-center">
            <p className="font-display text-2xl">450+</p>
            <p className="text-[10px] uppercase tracking-[0.12em] text-white/70">Designers</p>
          </div>
          <div className="glass-panel rounded-xl p-2 text-center">
            <p className="font-display text-2xl">98%</p>
            <p className="text-[10px] uppercase tracking-[0.12em] text-white/70">Satisfaction</p>
          </div>
          <div className="glass-panel rounded-xl p-2 text-center">
            <p className="font-display text-2xl">24/7</p>
            <p className="text-[10px] uppercase tracking-[0.12em] text-white/70">AI Concierge</p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
