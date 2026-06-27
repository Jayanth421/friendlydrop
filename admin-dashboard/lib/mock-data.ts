import { Product, Coupon } from "@/types";

export const FALLBACK_PRODUCTS: Product[] = [
  {
    id: "sample-1",
    name: "Premium Photo Print Pack",
    slug: "premium-photo-print-pack",
    description: "A curated bundle of glossy prints with museum-grade paper finish.",
    price: 799,
    images: ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1200&auto=format&fit=crop"],
    category: "photo-prints",
    stock: 50,
    featured: true,
    popularity: 96,
    rating: 4.8,
    reviewCount: 24,
    createdAt: new Date().toISOString(),
  },
  {
    id: "sample-2",
    name: "Matte Sticker Sheet",
    slug: "matte-sticker-sheet",
    description: "Custom die-cut stickers with weather-resistant matte coating.",
    price: 349,
    images: ["https://images.unsplash.com/photo-1593032465171-8bd0f67e9f2f?q=80&w=1200&auto=format&fit=crop"],
    category: "stickers",
    stock: 200,
    featured: true,
    popularity: 90,
    rating: 4.6,
    reviewCount: 19,
    createdAt: new Date().toISOString(),
  },
  {
    id: "sample-3",
    name: "Personalized Mug Gift",
    slug: "personalized-mug-gift",
    description: "Ceramic mug with your photo and custom text, gift-ready packaging.",
    price: 599,
    images: ["https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?q=80&w=1200&auto=format&fit=crop"],
    category: "personalized-gifts",
    stock: 80,
    featured: true,
    popularity: 93,
    rating: 4.7,
    reviewCount: 31,
    createdAt: new Date().toISOString(),
  },
];

export const FALLBACK_COUPONS: Coupon[] = [
  { id: "welcome10", code: "WELCOME10", type: "percent", value: 10, active: true },
  { id: "print100", code: "PRINT100", type: "flat", value: 100, active: true },
];
