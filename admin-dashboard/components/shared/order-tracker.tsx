"use client";

import { Order } from "@/types";
import { useOrderTracking } from "@/hooks/use-order-tracking";

const STEPS = ["pending", "confirmed", "shipped", "delivered"];

export function OrderTracker({ order }: { order: Order }) {
  const liveOrder = useOrderTracking(order.id, order);
  const activeIndex = STEPS.indexOf(liveOrder.status);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="font-display text-2xl font-semibold text-ink">Live Tracking</h2>
      <p className="mt-2 text-sm text-slate-600">Current status: {liveOrder.status}</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        {STEPS.map((step, index) => (
          <div
            key={step}
            className={`rounded-xl border px-3 py-3 text-center text-xs font-semibold uppercase ${
              index <= activeIndex ? "border-ink bg-ink text-white" : "border-slate-200 bg-slate-50 text-slate-500"
            }`}
          >
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}
