"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { CartItem } from "@/types";

interface CartStore {
  items: CartItem[];
  setItems: (items: CartItem[]) => void;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  subtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      setItems: (items) => set({ items }),
      addItem: (item) => {
        const existing = get().items.find(
          (entry) => entry.productId === item.productId && (entry.variantId ?? "") === (item.variantId ?? ""),
        );

        if (existing) {
          set({
            items: get().items.map((entry) =>
              entry.productId === item.productId && (entry.variantId ?? "") === (item.variantId ?? "")
                ? { ...entry, quantity: Math.min(20, entry.quantity + item.quantity) }
                : entry,
            ),
          });

          return;
        }

        set({ items: [...get().items, item] });
      },
      removeItem: (productId, variantId) =>
        set({
          items: get().items.filter(
            (item) => !(item.productId === productId && (item.variantId ?? "") === (variantId ?? "")),
          ),
        }),
      updateQuantity: (productId, quantity, variantId) => {
        if (quantity <= 0) {
          set({
            items: get().items.filter(
              (item) => !(item.productId === productId && (item.variantId ?? "") === (variantId ?? "")),
            ),
          });
          return;
        }

        set({
          items: get().items.map((item) =>
            item.productId === productId && (item.variantId ?? "") === (variantId ?? "")
              ? { ...item, quantity: Math.min(20, quantity) }
              : item,
          ),
        });
      },
      clearCart: () => set({ items: [] }),
      subtotal: () => get().items.reduce((total, item) => total + item.price * item.quantity, 0),
    }),
    {
      name: "friendlydrop_cart",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
