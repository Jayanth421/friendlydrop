"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  Image,
  CreditCard,
  Ticket,
  Star,
  Boxes,
  Truck,
  FileSpreadsheet,
  Shield,
  Headphones,
  Megaphone,
  Wallet,
  RotateCcw,
  FolderKanban,
  Activity,
  ScrollText,
  Settings,
  Search,
  Network,
  Layers,
  Store,
  PlugZap,
  Smartphone,
  Bot,
  FileText,
  Share2,
} from "lucide-react";
import { hasPermission } from "@/lib/rbac";
import { UserRole } from "@/types";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin/control-tower", label: "Control Tower", icon: Network, permission: "dashboard:view" as const },
  { href: "/admin/dashboard", label: "Dashboard", icon: BarChart3, permission: "dashboard:view" as const },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, permission: "orders:manage" as const },
  { href: "/admin/customers", label: "Customers", icon: Users, permission: "users:manage" as const },
  { href: "/admin/vendors", label: "Vendors", icon: Store, permission: "vendors:manage" as const },
  { href: "/admin/products", label: "Products", icon: Package, permission: "products:manage" as const },
  { href: "/admin/categories", label: "Categories", icon: Layers, permission: "catalog:manage" as const },
  { href: "/admin/marketing", label: "Marketing", icon: Megaphone, permission: "marketing:manage" as const },
  { href: "/admin/ads", label: "Meta Ads", icon: Megaphone, permission: "marketing:manage" as const },
  { href: "/admin/seo", label: "SEO", icon: Search, permission: "catalog:manage" as const },
  { href: "/admin/sharing", label: "Social Sharing", icon: Share2, permission: "marketing:manage" as const },
  { href: "/admin/banners", label: "Banners", icon: Image, permission: "banners:manage" as const },
  { href: "/admin/shipping", label: "Delivery", icon: Truck, permission: "orders:manage" as const },
  { href: "/admin/payments", label: "Payments", icon: CreditCard, permission: "payments:view" as const },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, permission: "analytics:view" as const },
  { href: "/admin/integrations", label: "Integrations", icon: PlugZap, permission: "settings:manage" as const },
  { href: "/admin/plugins", label: "Plugins", icon: PlugZap, permission: "settings:manage" as const },
  { href: "/admin/automation", label: "AI Automation", icon: Bot, permission: "settings:manage" as const },
  { href: "/admin/mobile", label: "Mobile Control", icon: Smartphone, permission: "settings:manage" as const },
  { href: "/admin/cms", label: "CMS Pages", icon: FileText, permission: "settings:manage" as const },
  { href: "/admin/settings", label: "Settings", icon: Settings, permission: "settings:manage" as const },
  { href: "/admin/uploads", label: "Uploads", icon: Image, permission: "orders:manage" as const },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket, permission: "coupons:manage" as const },
  { href: "/admin/reviews", label: "Reviews", icon: Star, permission: "reviews:manage" as const },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes, permission: "inventory:manage" as const },
  { href: "/admin/reports", label: "Reports", icon: FileSpreadsheet, permission: "reports:export" as const },
  { href: "/admin/team", label: "Team", icon: Shield, permission: "team:manage" as const },
  { href: "/admin/support", label: "Support", icon: Headphones, permission: "support:manage" as const },
  { href: "/admin/finance", label: "Finance", icon: Wallet, permission: "payments:view" as const },
  { href: "/admin/returns", label: "Returns", icon: RotateCcw, permission: "returns:manage" as const },
  { href: "/admin/media", label: "Media", icon: FolderKanban, permission: "products:manage" as const },
  { href: "/admin/monitoring", label: "Monitoring", icon: Activity, permission: "dashboard:view" as const },
  { href: "/admin/logs", label: "Logs", icon: ScrollText, permission: "logs:view" as const },
  { href: "/admin/search", label: "Search", icon: Search, permission: "dashboard:view" as const },
];

export function AdminSidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();

  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:sticky md:top-24 md:max-h-[calc(100vh-7rem)] md:overflow-y-auto">
      <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">FriendlyDrop Admin</p>

      <nav className="grid gap-1">
        {items
          .filter((item) => hasPermission(role, item.permission))
          .map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition",
                  active ? "bg-ink text-white" : "text-slate-700 hover:bg-slate-100",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
      </nav>
    </aside>
  );
}
