"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { useCartStore } from "@/store/use-cart-store";
import { formatCurrency } from "@/lib/utils";

export function CartList() {
  const { items, removeItem, updateQuantity, subtotal } = useCartStore();

  if (!items.length) {
    return <EmptyState title="Your cart is empty" description="Add custom products and they will show up here." action={<Link className="text-accent" href="/products">Browse products</Link>} />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        {items.map((item) => (
          <article key={item.productId} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="relative h-24 w-24 overflow-hidden rounded-xl">
              <Image src={item.image} alt={item.name} fill className="object-cover" sizes="96px" />
            </div>
            <div className="flex flex-1 flex-col">
              <h3 className="font-semibold text-ink">{item.name}</h3>
              <p className="text-sm text-slate-500">{formatCurrency(item.price)}</p>
              <div className="mt-auto flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1">
                  <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}><Minus className="h-4 w-4" /></button>
                  <span className="text-sm font-semibold">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}><Plus className="h-4 w-4" /></button>
                </div>
                <button onClick={() => removeItem(item.productId)} className="text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-lg font-semibold text-ink">Order Summary</h3>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal())}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>Free</span>
          </div>
          <div className="border-t pt-2 text-base font-semibold">
            <div className="flex justify-between">
              <span>Total</span>
              <span>{formatCurrency(subtotal())}</span>
            </div>
          </div>
        </div>

        <Link href="/checkout">
          <Button className="mt-5 w-full">Proceed To Checkout</Button>
        </Link>
      </aside>
    </div>
  );
}
