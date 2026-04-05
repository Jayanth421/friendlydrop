"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { RECENTLY_VIEWED_LIMIT } from "@/lib/constants";

interface RecentlyViewedStore {
  items: string[];
  addItem: (productId: string) => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (productId) => {
        const clean = get().items.filter((id) => id !== productId);
        set({ items: [productId, ...clean].slice(0, RECENTLY_VIEWED_LIMIT) });
      },
    }),
    {
      name: "friendlydrop_recent",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
