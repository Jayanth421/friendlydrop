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
  const heading = banner?.title || "Print your story. Wear your vibe.";
  const href = resolveBannerHref(banner);
  const isExternal = banner?.linkType === "external";

  return (
    <section className="relative overflow-hidden rounded-[30px] bg-[#101214] p-6 text-white md:p-10">
      <div className="pointer-events-none absolute inset-0">
        {banner?.imageDesktop ? (
          <Image src={banner.imageDesktop} alt={banner.title} fill className="object-cover opacity-35" sizes="100vw" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/20" />
      </div>
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-red-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 max-w-xl space-y-5">
        <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90">
          {banner?.type ? `${banner.type} banner` : "Limited Custom Drop"}
        </p>
        <h1 className="font-display text-4xl font-bold leading-tight md:text-6xl">{heading}</h1>
        <p className="max-w-md text-sm text-white/80 md:text-base">
          Shop premium photo prints, bold stickers, and personalized gifts with fast production and clean quality control.
        </p>
        <div className="flex flex-wrap gap-2.5">
          {isExternal ? (
            <a href={href} target="_blank" rel="noreferrer">
              <Button className="rounded-full bg-white text-black hover:bg-white/90">Explore Banner</Button>
            </a>
          ) : (
            <Link href={href}>
              <Button className="rounded-full bg-white text-black hover:bg-white/90">Explore Banner</Button>
            </Link>
          )}
          <Link href="/products">
            <Button variant="secondary" className="rounded-full border border-white/25 bg-transparent text-white hover:bg-white/10">
              Shop Collection
            </Button>
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
