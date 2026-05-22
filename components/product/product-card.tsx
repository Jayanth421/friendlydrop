"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { Product } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useWishlistStore } from "@/store/use-wishlist-store";

export function ProductCard({
  product,
  variant = "default",
}: {
  product: Product;
  variant?: "default" | "listing";
}) {
  const toggle = useWishlistStore((state) => state.toggle);
  const has = useWishlistStore((state) => state.has(product.id));

  if (variant === "listing") {
    const originalPrice = product.discountPercent
      ? Math.round(product.price / (1 - product.discountPercent / 100))
      : undefined;

    return (
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        className="group border-r border-b border-[#e6e7eb] bg-white"
      >
        <Link href={`/products/${product.id}`} className="relative block aspect-[3/4] overflow-hidden bg-[#f3f3f3]">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 22vw"
            className="object-cover transition duration-500 group-hover:scale-[1.02]"
          />
          {product.discountPercent ? (
            <span className="absolute left-0 top-2 bg-[#ff5f7e] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-white">
              {product.discountPercent}% OFF
            </span>
          ) : null}

          {typeof product.rating === "number" && product.reviewCount ? (
            <span className="absolute bottom-2 left-2 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-medium text-[#282c3f]">
              {product.rating.toFixed(1)} ★ {product.reviewCount}
            </span>
          ) : null}

          <button
            onClick={(event) => {
              event.preventDefault();
              toggle(product.id);
            }}
            className="absolute bottom-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#262626]"
            aria-label="Toggle wishlist"
          >
            <Heart className={`h-4 w-4 ${has ? "fill-red-500 text-red-500" : ""}`} />
          </button>
        </Link>

        <div className="space-y-0.5 px-2.5 pb-3 pt-2 text-[#282c3f]">
          <Link href={`/products/${product.id}`} className="line-clamp-1 text-[15px] font-semibold">
            {product.name}
          </Link>
          <p className="line-clamp-1 text-[13px] text-[#6f7383]">
            {(product.subcategory ?? product.category).replace("-", " ")}
          </p>
          <div className="flex flex-wrap items-center gap-1 pt-0.5 text-[13px]">
            <p className="font-semibold text-[#282c3f]">{formatCurrency(product.price)}</p>
            {originalPrice ? (
              <p className="text-[#9ca0ae] line-through">{formatCurrency(originalPrice)}</p>
            ) : null}
            {product.discountPercent ? (
              <p className="font-semibold text-[#16a34a]">({product.discountPercent}% OFF)</p>
            ) : null}
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#6f7383]">
            <span>{product.stock > 0 ? "In stock" : "Out of stock"}</span>
            {!product.reviewCount && typeof product.rating === "number" ? (
              <span>{product.rating.toFixed(1)} ★</span>
            ) : null}
          </div>
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      className="group overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_12px_35px_-24px_rgba(0,0,0,0.5)]"
    >
      <Link href={`/products/${product.id}`} className="relative block aspect-square overflow-hidden bg-[#f3f4f6]">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        {product.discountPercent ? (
          <span className="absolute left-2 top-2 rounded-full bg-[#7bff43] px-2 py-0.5 text-[10px] font-bold text-black">
            -{product.discountPercent}%
          </span>
        ) : null}
      </Link>

      <div className="space-y-2 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/products/${product.id}`} className="block pr-2 text-sm font-semibold leading-tight text-black">
            {product.name}
          </Link>
          <button
            onClick={() => toggle(product.id)}
            className="rounded-full border border-slate-200 bg-white p-1.5 transition hover:bg-slate-50"
            aria-label="Toggle wishlist"
          >
            <Heart className={`h-3.5 w-3.5 ${has ? "fill-red-500 text-red-500" : "text-slate-500"}`} />
          </button>
        </div>

        <div className="flex items-end justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-bold text-black">{formatCurrency(product.price)}</p>
            {product.discountPercent ? <p className="text-[11px] font-semibold text-red-500 line-through">{formatCurrency(Math.round(product.price * (1 + product.discountPercent / 100)))}</p> : null}
          </div>
          <p className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-slate-500">{product.category.replace("-", " ")}</p>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>{typeof product.rating === "number" ? `${product.rating.toFixed(1)} star` : "Top pick"}</span>
          <span>{product.stock > 0 ? "In stock" : "Out of stock"}</span>
        </div>
      </div>
    </motion.article>
  );
}
