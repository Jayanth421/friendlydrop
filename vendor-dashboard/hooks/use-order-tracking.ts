"use client";

import { useEffect, useState } from "react";
import { Order } from "@/types";

export function useOrderTracking(orderId: string, initialOrder: Order) {
  const [order, setOrder] = useState<Order>(initialOrder);

  useEffect(() => {
    if (!orderId) {
      return;
    }

    let cancelled = false;

    async function refreshOrder() {
      try {
        const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { order?: Order };
        if (!cancelled && data.order) {
          setOrder(data.order);
        }
      } catch {
        // Keep the last known order state if the network refresh fails.
      }
    }

    refreshOrder();
    const interval = window.setInterval(refreshOrder, 15_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [orderId]);

  return order;
}
