"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-[30px] bg-[#101214] p-6 text-white md:p-10">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-red-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 max-w-xl space-y-5">
        <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90">
          Limited Custom Drop
        </p>
        <h1 className="font-display text-4xl font-bold leading-tight md:text-6xl">
          Print your story.
          <br />
          Wear your vibe.
        </h1>
        <p className="max-w-md text-sm text-white/80 md:text-base">
          Shop premium photo prints, bold stickers, and personalized gifts with fast production and clean quality control.
        </p>
        <div className="flex flex-wrap gap-2.5">
          <Link href="/products">
            <Button className="rounded-full bg-white text-black hover:bg-white/90">Shop Collection</Button>
          </Link>
          <Link href="/search">
            <Button variant="secondary" className="rounded-full border border-white/25 bg-transparent text-white hover:bg-white/10">
              Explore Designs
            </Button>
          </Link>
        </div>
      </motion.div>

      <div className="relative z-10 mt-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
          <p className="text-[11px] uppercase tracking-[0.15em] text-white/70">Drop</p>
          <p className="mt-1 text-lg font-semibold">Black Friday</p>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
          <p className="text-[11px] uppercase tracking-[0.15em] text-white/70">Discount</p>
          <p className="mt-1 text-lg font-semibold">Up to 50% Off</p>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
          <p className="text-[11px] uppercase tracking-[0.15em] text-white/70">Delivery</p>
          <p className="mt-1 text-lg font-semibold">3-5 Days</p>
        </div>
      </div>
    </section>
  );
}
