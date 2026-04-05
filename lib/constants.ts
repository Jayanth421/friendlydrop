import { ProductCategory, OrderStatus } from "@/types";

export const BRAND_NAME = "FriendlyDrop";

export const CATEGORIES: Array<{ label: string; value: ProductCategory }> = [
  { label: "Photo Prints", value: "photo-prints" },
  { label: "Stickers", value: "stickers" },
  { label: "Personalized Gifts", value: "personalized-gifts" },
];

export const ORDER_STATUSES: OrderStatus[] = ["pending", "confirmed", "packed", "shipped", "delivered", "returned", "cancelled", "refunded"];

export const NAV_LINKS = [
  { href: "/products", label: "Shop" },
  { href: "/search", label: "Search" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/orders", label: "Orders" },
];

export const ADMIN_NAV_LINKS = [
  { href: "/admin/control-tower", label: "Control Tower" },
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/vendors", label: "Vendors" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/marketing", label: "Marketing" },
  { href: "/admin/banners", label: "Banners" },
  { href: "/admin/shipping", label: "Delivery" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/uploads", label: "Design Uploads" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/team", label: "Team" },
  { href: "/admin/support", label: "Support" },
  { href: "/admin/finance", label: "Finance" },
  { href: "/admin/returns", label: "Returns" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/monitoring", label: "Monitoring" },
  { href: "/admin/logs", label: "Logs" },
];

export const SESSION_COOKIE_NAME = "friendlydrop_session";
export const ADMIN_2FA_COOKIE_NAME = "friendlydrop_admin_2fa";

export const RECENTLY_VIEWED_LIMIT = 8;
export const LOW_STOCK_THRESHOLD = 10;
