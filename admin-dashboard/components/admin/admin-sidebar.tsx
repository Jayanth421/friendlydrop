"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bot,
  Boxes,
  CreditCard,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  Headphones,
  Image,
  Layers,
  LayoutDashboard,
  Megaphone,
  Network,
  Package,
  PenTool,
  PlugZap,
  Plus,
  RotateCcw,
  Share2,
  ScrollText,
  Search,
  Settings,
  Shield,
  Smartphone,
  Star,
  Store,
  ShoppingCart,
  Tag,
  Ticket,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { hasPermission } from "@/lib/rbac";
import { UserRole } from "@/types";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Network;
  permission: Parameters<typeof hasPermission>[1];
};

const navigationSections: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Overview",
    items: [
      { href: "/admin/control-tower", label: "Control Tower", icon: Network, permission: "dashboard:view" },
      { href: "/admin/dashboard", label: "Dashboard", icon: BarChart3, permission: "dashboard:view" },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3, permission: "analytics:view" },
      { href: "/admin/monitoring", label: "Monitoring", icon: Activity, permission: "dashboard:view" },
      { href: "/admin/search", label: "Search", icon: Search, permission: "dashboard:view" },
    ],
  },
  {
    title: "Product Management",
    items: [
      { href: "/admin/products", label: "Products Dashboard", icon: LayoutDashboard, permission: "products:manage" },
      { href: "/admin/products/all", label: "All Products", icon: Package, permission: "products:manage" },
      { href: "/admin/products/create", label: "Create Product", icon: Plus, permission: "products:manage" },
      { href: "/admin/categories", label: "Categories", icon: Layers, permission: "catalog:manage" },
      { href: "/admin/products/brands", label: "Brands", icon: Tag, permission: "products:manage" },
      { href: "/admin/products/attributes", label: "Attributes", icon: FileText, permission: "products:manage" },
      { href: "/admin/inventory", label: "Inventory", icon: Boxes, permission: "inventory:manage" },
      { href: "/admin/reviews", label: "Reviews", icon: Star, permission: "reviews:manage" },
      { href: "/admin/products/analytics", label: "Product Analytics", icon: BarChart3, permission: "analytics:view" },
      { href: "/admin/product-page-builder", label: "Page Builder", icon: PenTool, permission: "products:manage" },
    ],
  },
  {
    title: "Commerce",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingCart, permission: "orders:manage" },
      { href: "/admin/customers", label: "Customers", icon: Users, permission: "users:manage" },
      { href: "/admin/vendors", label: "Vendors", icon: Store, permission: "vendors:manage" },
      { href: "/admin/banners", label: "Banners", icon: Image, permission: "banners:manage" },
      { href: "/admin/shipping", label: "Delivery", icon: Truck, permission: "orders:manage" },
      { href: "/admin/payments", label: "Payments", icon: CreditCard, permission: "payments:view" },
      { href: "/admin/coupons", label: "Coupons", icon: Ticket, permission: "coupons:manage" },
      { href: "/admin/returns", label: "Returns", icon: RotateCcw, permission: "returns:manage" },
      { href: "/admin/uploads", label: "Uploads", icon: Image, permission: "orders:manage" },
      { href: "/admin/reports", label: "Reports", icon: FileSpreadsheet, permission: "reports:export" },
    ],
  },
  {
    title: "Growth",
    items: [
      { href: "/admin/marketing", label: "Marketing", icon: Megaphone, permission: "marketing:manage" },
      { href: "/admin/ads", label: "Meta Ads", icon: Megaphone, permission: "marketing:manage" },
      { href: "/admin/sharing", label: "Social Sharing", icon: Share2, permission: "marketing:manage" },
      { href: "/admin/seo", label: "SEO", icon: Search, permission: "catalog:manage" },
      { href: "/admin/automation", label: "AI Automation", icon: Bot, permission: "settings:manage" },
      { href: "/admin/builder", label: "Visual Builder", icon: PenTool, permission: "settings:manage" },
      { href: "/admin/mobile", label: "Mobile Control", icon: Smartphone, permission: "settings:manage" },
      { href: "/admin/media", label: "Media", icon: FolderKanban, permission: "products:manage" },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/integrations", label: "Integrations", icon: PlugZap, permission: "settings:manage" },
      { href: "/admin/plugins", label: "Plugins", icon: PlugZap, permission: "settings:manage" },
      { href: "/admin/cms", label: "CMS Pages", icon: FileText, permission: "settings:manage" },
      { href: "/admin/settings?tab=sitebuilder", label: "Site Builder", icon: PenTool, permission: "settings:manage" },
      { href: "/admin/settings/website", label: "Website Settings", icon: Store, permission: "settings:manage" },
      { href: "/admin/settings", label: "Settings", icon: Settings, permission: "settings:manage" },
      { href: "/admin/team", label: "Team", icon: Shield, permission: "team:manage" },
      { href: "/admin/support", label: "Support", icon: Headphones, permission: "support:manage" },
      { href: "/admin/finance", label: "Finance", icon: Wallet, permission: "payments:view" },
      { href: "/admin/logs", label: "Logs", icon: ScrollText, permission: "logs:view" },
    ],
  },
];

function isItemActive(pathname: string, searchParams: { get(name: string): string | null }, href: string) {
  const [targetPath, query] = href.split("?");
  const tab = query ? new URLSearchParams(query).get("tab") : null;

  if (tab) {
    return pathname === targetPath && searchParams.get("tab") === tab;
  }

  // Exact match for dashboard-level routes, prefix match for sub-routes
  if (href === "/admin/products") {
    return pathname === "/admin/products";
  }

  // Exact match for settings root (avoid matching /admin/settings/website etc.)
  if (href === "/admin/settings") {
    return pathname === "/admin/settings";
  }

  return pathname === href || pathname.startsWith(href + "/");
}

export function AdminSidebar({ name, role }: { name: string; role: UserRole }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <Sidebar className="border-r border-stone-200 bg-white/95 shadow-[0_12px_40px_-24px_rgba(17,24,39,0.45)] backdrop-blur">
      <SidebarHeader className="border-b border-stone-200 px-5 py-5">
        <div className="flex items-center gap-3 w-full">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm shrink-0 overflow-hidden border border-stone-100">
            <img src="https://dl.oqens.me/oq-T558-ZGAC-779/WhatsApp_Image_2026-03-29_at_16.39.58-removebg-preview.png" alt="FriendlyDrop Logo" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500 truncate">FriendlyDrop</p>
            <h1 className="mt-1 text-lg font-semibold text-stone-900 truncate">Admin Panel</h1>
            <h2 className="font-display text-[15px] font-semibold text-stone-900 truncate">{name}</h2>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        {navigationSections.map((section) => {
          const visibleItems = section.items.filter((item) => hasPermission(role, item.permission));

          if (visibleItems.length === 0) {
            return null;
          }

          return (
            <SidebarGroup key={section.title}>
              <SidebarGroupLabel className="px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">
                {section.title}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => {
                    const active = isItemActive(pathname, searchParams, item.href);
                    const Icon = item.icon;

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          className={cn(
                            "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition h-auto",
                            active
                              ? "border border-stone-900 bg-gradient-to-b from-stone-800 to-stone-900 text-white shadow-sm hover:bg-stone-800 hover:text-white"
                              : "border border-transparent text-stone-700 hover:border-stone-200 hover:bg-stone-100",
                          )}
                        >
                          <Link href={item.href}>
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className="min-w-0 flex-1 truncate">{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
