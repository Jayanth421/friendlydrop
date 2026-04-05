"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCartStore } from "@/store/use-cart-store";
import { useWishlistStore } from "@/store/use-wishlist-store";

export function StoreSync() {
  const { user } = useAuth();
  const cartItems = useCartStore((state) => state.items);
  const setCartItems = useCartStore((state) => state.setItems);
  const wishlistIds = useWishlistStore((state) => state.productIds);
  const setWishlistIds = useWishlistStore((state) => state.setProductIds);

  useEffect(() => {
    if (!user) {
      return;
    }

    fetch("/api/cart")
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data.items) && data.items.length) {
          setCartItems(data.items);
        }
      })
      .catch(() => undefined);

    fetch("/api/wishlist")
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data.productIds) && data.productIds.length) {
          setWishlistIds(data.productIds);
        }
      })
      .catch(() => undefined);
  }, [setCartItems, setWishlistIds, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    fetch("/api/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cartItems }),
    }).catch(() => undefined);
  }, [cartItems, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    fetch("/api/wishlist", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds: wishlistIds }),
    }).catch(() => undefined);
  }, [wishlistIds, user]);

  return null;
}
