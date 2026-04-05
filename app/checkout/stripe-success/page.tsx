"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCartStore } from "@/store/use-cart-store";

export default function StripeSuccessPage() {
  const params = useSearchParams();
  const router = useRouter();
  const clearCart = useCartStore((state) => state.clearCart);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = params.get("session_id");

    if (!sessionId) {
      setLoading(false);
      return;
    }

    fetch(`/api/orders/stripe/confirm?session_id=${sessionId}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.order?.id) {
          clearCart();
          toast.success("Stripe payment confirmed");
          router.replace(`/orders/${data.order.id}`);
        }
      })
      .finally(() => setLoading(false));
  }, [clearCart, params, router]);

  return (
    <main className="max-w-xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <h1 className="font-display text-3xl font-bold text-ink">Confirming payment</h1>
        <p className="mt-2 text-sm text-slate-600">{loading ? "Please wait while we finalize your order." : "If redirect does not happen, open orders page."}</p>
      </div>
    </main>
  );
}
