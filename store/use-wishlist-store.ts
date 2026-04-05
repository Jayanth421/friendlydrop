"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface WishlistStore {
  productIds: string[];
  setProductIds: (productIds: string[]) => void;
  toggle: (productId: string) => void;
  has: (productId: string) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      productIds: [],
      setProductIds: (productIds) => set({ productIds }),
      toggle: (productId) => {
        if (get().productIds.includes(productId)) {
          set({ productIds: get().productIds.filter((id) => id !== productId) });
          return;
        }

        set({ productIds: [...get().productIds, productId] });
      },
      has: (productId) => get().productIds.includes(productId),
      clear: () => set({ productIds: [] }),
    }),
    {
      name: "friendlydrop_wishlist",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
