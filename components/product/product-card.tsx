"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { Product } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useWishlistStore } from "@/store/use-wishlist-store";

export function ProductCard({ product }: { product: Product }) {
  const toggle = useWishlistStore((state) => state.toggle);
  const has = useWishlistStore((state) => state.has(product.id));

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      className="group overflow-hidden rounded-3xl border border-slate-200 bg-white"
    >
      <Link href={`/products/${product.id}`} className="relative block aspect-square overflow-hidden bg-slate-100">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
          className="object-contain p-3 transition duration-500 group-hover:scale-105"
        />
      </Link>

      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/products/${product.id}`} className="block pr-2 text-sm font-semibold leading-tight text-black">
            {product.name}
          </Link>
          <button
            onClick={() => toggle(product.id)}
            className="rounded-full border border-slate-200 p-1.5 transition hover:bg-slate-50"
            aria-label="Toggle wishlist"
          >
            <Heart className={`h-3.5 w-3.5 ${has ? "fill-red-500 text-red-500" : "text-slate-500"}`} />
          </button>
        </div>

        <div className="flex items-end justify-between">
          <p className="text-sm font-bold text-black">{formatCurrency(product.price)}</p>
          <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">{product.category.replace("-", " ")}</p>
        </div>
      </div>
    </motion.article>
  );
}
