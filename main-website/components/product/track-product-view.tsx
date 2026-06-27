"use client";

import { useEffect } from "react";
import { useRecentlyViewedStore } from "@/store/use-recently-viewed-store";

export function TrackProductView({ productId }: { productId: string }) {
  const addItem = useRecentlyViewedStore((state) => state.addItem);

  useEffect(() => {
    addItem(productId);
  }, [addItem, productId]);

  return null;
}
