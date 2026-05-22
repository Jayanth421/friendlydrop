"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Search, ShoppingBag, User, ShieldCheck, Menu, ChevronRight, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useCartStore } from "@/store/use-cart-store";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { isAdminRole, isVendorRole } from "@/lib/rbac";
import { StoreMegaMenuColumn, StoreMenuEditorConfig } from "@/types";

interface NavbarProps {
  storeName: string;
  brandPrefix?: string;
  logoUrl?: string;
  menuEditor?: StoreMenuEditorConfig;
}

interface MobileMenuNode {
  id: string;
  label: string;
  href?: string;
  children: MobileMenuNode[];
}

const FALLBACK_DESKTOP_LINKS = [
  { id: "menu-men", href: "/products?section=men", label: "MEN" },
  { id: "menu-women", href: "/products?section=women", label: "WOMEN" },
  { id: "menu-kids", href: "/products?section=kids", label: "KIDS" },
  { id: "menu-home", href: "/products?section=home", label: "HOME", showMegaMenu: true, megaMenuKey: "home" },
  { id: "menu-beauty", href: "/products?section=beauty", label: "BEAUTY" },
  { id: "menu-genz", href: "/products?section=genz", label: "GENZ" },
  { id: "menu-studio", href: "/products?section=studio", label: "STUDIO", badge: "NEW" },
];

const FALLBACK_MEGA_MENU_HOME: StoreMegaMenuColumn[] = [
  {
    id: "home-col-1",
    heading: "Bed Linen & Furnishing",
    links: [
      { id: "home-col-1-link-1", label: "Bed Runners", href: "/products?category=bed-runners" },
      { id: "home-col-1-link-2", label: "Mattress Protectors", href: "/products?category=mattress-protectors" },
      { id: "home-col-1-link-3", label: "Bedsheets", href: "/products?category=bedsheets" },
    ],
    ctaLabel: "View All",
    ctaHref: "/products?section=home",
  },
  {
    id: "home-col-2",
    heading: "Bath",
    links: [
      { id: "home-col-2-link-1", label: "Bath Towels", href: "/products?category=bath-towels" },
      { id: "home-col-2-link-2", label: "Hand & Face Towels", href: "/products?category=hand-face-towels" },
      { id: "home-col-2-link-3", label: "Bath Rugs", href: "/products?category=bath-rugs" },
    ],
  },
  {
    id: "home-col-3",
    heading: "Home Decor",
    links: [
      { id: "home-col-3-link-1", label: "Plants & Planters", href: "/products?category=plants-planters" },
      { id: "home-col-3-link-2", label: "Aromas & Candles", href: "/products?category=aromas-candles" },
      { id: "home-col-3-link-3", label: "Clocks", href: "/products?category=clocks" },
    ],
  },
  {
    id: "home-col-4",
    heading: "Furniture",
    links: [
      { id: "home-col-4-link-1", label: "Home Gift Sets", href: "/products?category=home-gift-sets" },
      { id: "home-col-4-link-2", label: "Kitchen & Table", href: "/products?category=kitchen-table" },
      { id: "home-col-4-link-3", label: "Table Runners", href: "/products?category=table-runners" },
    ],
  },
  {
    id: "home-col-5",
    heading: "Storage",
    links: [
      { id: "home-col-5-link-1", label: "Bins", href: "/products?category=bins" },
      { id: "home-col-5-link-2", label: "Hangers", href: "/products?category=hangers" },
      { id: "home-col-5-link-3", label: "Organisers", href: "/products?category=organisers" },
    ],
  },
];

const FALLBACK_MOBILE_SHOP_LINKS = [
  { id: "m-men", href: "/products?section=men", label: "Men" },
  { id: "m-women", href: "/products?section=women", label: "Women" },
  { id: "m-kids", href: "/products?section=kids", label: "Kids" },
  { id: "m-home", href: "/products?section=home", label: "Home" },
  { id: "m-beauty", href: "/products?section=beauty", label: "Beauty" },
  { id: "m-genz", href: "/products?section=genz", label: "Genz" },
];

const FALLBACK_MOBILE_MISC_LINKS = [
  { id: "mm-orders", href: "/orders", label: "Orders" },
  { id: "mm-wishlist", href: "/wishlist", label: "Wishlist" },
  { id: "mm-credit", href: "/account?panel=credit", label: "Gift Cards" },
  { id: "mm-contact", href: "/contact", label: "Contact Us" },
  { id: "mm-about", href: "/about-brand", label: "Brand Story" },
];

export function Navbar({ storeName, brandPrefix, logoUrl, menuEditor }: NavbarProps) {
  const items = useCartStore((state) => state.items);
  const { user, role, logout } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [openMegaMenu, setOpenMegaMenu] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileTopMenuId, setMobileTopMenuId] = useState<string | null>(null);
  const [mobileColumnId, setMobileColumnId] = useState<string | null>(null);
  const brandName = brandPrefix?.trim() ? `${brandPrefix.trim()} ${storeName}` : storeName;
  const currentQuery = searchParams.toString();
  const primaryLinks = menuEditor?.desktopLinks?.length ? menuEditor.desktopLinks : FALLBACK_DESKTOP_LINKS;
  const mobileShopLinks = menuEditor?.mobileShopLinks?.length ? menuEditor.mobileShopLinks : FALLBACK_MOBILE_SHOP_LINKS;
  const mobileMiscLinks = menuEditor?.mobileMiscLinks?.length ? menuEditor.mobileMiscLinks : FALLBACK_MOBILE_MISC_LINKS;
  const megaMenus = menuEditor?.megaMenus?.length
    ? menuEditor.megaMenus
    : [{ id: "mega-home", key: "home", title: "Home", columns: FALLBACK_MEGA_MENU_HOME }];
  const popupStyle = menuEditor?.popupStyle ?? {
    widthPx: 1500,
    maxColumns: 5,
    borderRadiusPx: 16,
    backgroundColor: "#ffffff",
    textColor: "#222a3f",
    headingColor: "#16a34a",
    cardBackgroundColor: "#fbfbfc",
    animation: "fade" as const,
    showPromoCard: false,
    promoImageUrl: "",
    promoTitle: "Season Edit",
    promoText: "Use Settings -> Site Builder -> Menu to customize this popup.",
    promoCtaLabel: "Edit Menu",
    promoCtaHref: "/admin/settings",
  };
  const activeMegaMenu = megaMenus.find((menu) => menu.key === openMegaMenu) ?? null;
  const mobileMenuTree = useMemo<MobileMenuNode[]>(() => {
    const toMenuKey = (value: string) => value.trim().toLowerCase().replace(/\s+/g, "-");
    const megaMenuMap = new Map(megaMenus.map((menu) => [toMenuKey(menu.key), menu]));
    const desktopByHref = new Map(primaryLinks.map((link) => [link.href, link]));

    return mobileShopLinks.map((item) => {
      const desktopMatch = desktopByHref.get(item.href);
      const query = item.href.split("?")[1];
      const section = query ? new URLSearchParams(query).get("section") : null;
      const candidateKeys = [
        desktopMatch?.showMegaMenu ? desktopMatch.megaMenuKey : undefined,
        section ?? undefined,
        item.label,
        item.id.replace(/^m[-_]/i, ""),
      ]
        .filter(Boolean)
        .map((value) => toMenuKey(String(value)));

      const matchedMegaMenu = candidateKeys.map((key) => megaMenuMap.get(key)).find(Boolean) ?? null;
      if (!matchedMegaMenu) {
        return { id: item.id, label: item.label, href: item.href, children: [] };
      }

      return {
        id: item.id,
        label: item.label,
        href: item.href,
        children: matchedMegaMenu.columns.map((column) => ({
          id: `${item.id}-${column.id}`,
          label: column.heading,
          href: column.ctaHref ?? item.href,
          children: column.links.map((entry) => ({
            id: `${item.id}-${column.id}-${entry.id}`,
            label: entry.label,
            href: entry.href,
            children: [],
          })),
        })),
      };
    });
  }, [megaMenus, mobileShopLinks, primaryLinks]);
  const activeTopMenu = mobileTopMenuId ? mobileMenuTree.find((item) => item.id === mobileTopMenuId) ?? null : null;
  const activeColumnMenu = mobileColumnId
    ? activeTopMenu?.children.find((item) => item.id === mobileColumnId) ?? null
    : null;

  const isLinkActive = (href: string) => {
    const [linkPath, linkQuery = ""] = href.split("?");
    if (pathname !== linkPath) return false;
    if (!linkQuery) return currentQuery.length === 0 || linkPath === "/";

    const targetParams = new URLSearchParams(linkQuery);
    return Array.from(targetParams.entries()).every(([key, value]) => searchParams.get(key) === value);
  };

  const iconButtonClass =
    "relative inline-flex h-10 w-10 items-center justify-center text-[#262626] transition-colors hover:text-black";

  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileTopMenuId(null);
    setMobileColumnId(null);
  }, [pathname, currentQuery]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileMenuOpen]);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`sticky top-0 z-50 bg-white ${pathname === "/products" ? "hidden lg:block" : ""}`}
    >
      <div className="hidden bg-[#b3ef00] px-4 py-2 text-center text-[12px] tracking-[0.02em] text-[#262626] md:block md:px-8">
        <p>
          Get early access on launches and offers.{" "}
          <Link href="/signup" className="underline underline-offset-2">
            Sign up for texts
          </Link>
        </p>
      </div>

      <div className="border-b border-[#dddbdc]">
        <div className="mx-auto flex h-[56px] max-w-[1520px] items-center gap-3 px-4 md:h-[78px] md:px-6">
          <button
            type="button"
            className={`${iconButtonClass} mr-1`}
            aria-label="Open menu"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6 text-[#5b6270]" />
          </button>

          <Link href="/" className="flex shrink-0 items-center lg:mr-0" aria-label={brandName}>
            {logoUrl ? (
              <span
                className="h-8 w-10 bg-contain bg-left bg-no-repeat md:h-10 md:w-20 md:bg-center"
                style={{ backgroundImage: `url(${logoUrl})` }}
                aria-hidden="true"
              />
            ) : (
              <span className="rounded-full bg-gradient-to-br from-[#16a34a] via-[#22c55e] to-[#4ade80] px-2 py-0.5 text-xs font-bold text-white md:bg-none md:px-0 md:py-0 md:font-semibold md:uppercase md:tracking-[0.25em] md:text-[#262626]">
                {brandName}
              </span>
            )}
          </Link>

          <div
            className="relative hidden lg:flex lg:flex-1 lg:items-center"
            onMouseLeave={() => setOpenMegaMenu(null)}
          >
            <nav className="flex h-full items-stretch">
              {primaryLinks.map((link) => {
                const menuKey = link.showMegaMenu ? (link.megaMenuKey ?? link.label.toLowerCase()) : null;
                const active = isLinkActive(link.href) || (menuKey ? openMegaMenu === menuKey : false);
                return (
                  <div
                    key={link.id}
                    className="relative"
                    onMouseEnter={() => setOpenMegaMenu(menuKey)}
                  >
                    <Link
                      href={link.href}
                      className={`relative inline-flex h-[78px] items-center px-4 text-sm font-semibold tracking-[0.03em] ${
                        active ? "text-[#111827]" : "text-[#2f3347] hover:text-[#111827]"
                      }`}
                    >
                      <span>{link.label}</span>
                      {"badge" in link && link.badge ? (
                        <span className="absolute right-0 top-[18px] text-[10px] font-bold tracking-[0.08em] text-[#16a34a]">
                          {link.badge}
                        </span>
                      ) : null}
                    </Link>
                    {active ? (
                      <span className="absolute bottom-0 left-3 right-3 h-[3px] bg-[#22c55e]" />
                    ) : null}
                  </div>
                );
              })}
            </nav>

            {activeMegaMenu ? (
              <div
                className={`absolute left-0 top-[78px] z-50 border border-[#e4e5ea] shadow-[0_18px_35px_-20px_rgba(17,24,39,0.45)] ${
                  popupStyle.animation === "slide"
                    ? "animate-in slide-in-from-top-4 duration-200"
                    : popupStyle.animation === "fade"
                      ? "animate-in fade-in duration-200"
                      : ""
                }`}
                style={{
                  width: `min(96vw, ${popupStyle.widthPx}px)`,
                  background: popupStyle.backgroundColor,
                  color: popupStyle.textColor,
                  borderRadius: `${popupStyle.borderRadiusPx}px`,
                }}
              >
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: `repeat(${Math.max(1, Math.min(popupStyle.maxColumns + (popupStyle.showPromoCard ? 1 : 0), 8))}, minmax(0, 1fr))`,
                  }}
                >
                  {activeMegaMenu.columns.slice(0, Math.max(1, popupStyle.maxColumns)).map((group, index, arr) => (
                    <div
                      key={group.id}
                      className={`min-h-[340px] border-r border-[#f0f1f4] px-8 py-7 ${index === arr.length - 1 ? "border-r-0" : ""}`}
                      style={{ background: popupStyle.cardBackgroundColor }}
                    >
                      <p className="mb-3 text-[22px] font-semibold" style={{ color: popupStyle.headingColor }}>{group.heading}</p>
                      {group.imageUrl ? (
                        <div className="mb-3 overflow-hidden rounded-lg border border-[#e8ebf0]">
                          <img src={group.imageUrl} alt={group.imageAlt || group.heading} className="h-24 w-full object-cover" />
                        </div>
                      ) : null}
                      <ul className="space-y-2.5">
                        {group.links.map((item) => (
                          <li key={item.id}>
                            <Link
                              href={item.href}
                              className="text-[15px] tracking-tight hover:text-[#111827]"
                              style={{ color: popupStyle.textColor }}
                            >
                              {item.label}
                              {item.badge ? (
                                <span className="ml-1 rounded-full bg-[#ecf9e9] px-1.5 py-0.5 text-[10px] font-semibold text-[#3e8b41]">
                                  {item.badge}
                                </span>
                              ) : null}
                            </Link>
                          </li>
                        ))}
                      </ul>
                      {group.ctaLabel && group.ctaHref ? (
                        <Link
                          href={group.ctaHref}
                          className="mt-4 inline-flex rounded-full border border-[#dbe4ea] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#243447]"
                        >
                          {group.ctaLabel}
                        </Link>
                      ) : null}
                    </div>
                  ))}
                  {popupStyle.showPromoCard ? (
                    <div className="min-h-[340px] px-6 py-6">
                      <div className="h-full rounded-xl border border-[#e4e5ea] bg-white p-3">
                        {popupStyle.promoImageUrl ? (
                          <img src={popupStyle.promoImageUrl} alt="Menu promo" className="h-40 w-full rounded-lg object-cover" />
                        ) : (
                          <div className="flex h-40 w-full items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-500">
                            Promo Image
                          </div>
                        )}
                        <p className="mt-3 text-base font-semibold text-[#111827]">{popupStyle.promoTitle || "Promo Title"}</p>
                        <p className="mt-1 text-sm text-slate-600">{popupStyle.promoText || "Add promotional copy from Settings."}</p>
                        {popupStyle.promoCtaLabel && popupStyle.promoCtaHref ? (
                          <Link
                            href={popupStyle.promoCtaHref}
                            className="mt-3 inline-flex rounded-full bg-[#111827] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-white"
                          >
                            {popupStyle.promoCtaLabel}
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="hidden h-12 w-[460px] items-center rounded-md bg-[#f5f5f6] px-4 lg:flex">
            <Search className="h-5 w-5 text-[#6b7280]" />
            <input
              type="text"
              className="ml-3 w-full bg-transparent text-base text-[#374151] outline-none placeholder:text-[#80838f]"
              placeholder="Search for products, brands and more"
              aria-label="Search products"
            />
          </div>

          <div className="ml-auto flex items-center gap-0.5 md:gap-1">
            <Link href="/account" className={`${iconButtonClass} hidden lg:inline-flex`} aria-label="Account">
              <User className="h-5 w-5" />
            </Link>
            <Link href="/wishlist" className={iconButtonClass} aria-label="Wishlist">
              <Heart className="h-5 w-5 text-[#5b6270]" />
            </Link>
            <Link href="/cart" className={iconButtonClass} aria-label="Cart">
              <ShoppingBag className="h-5 w-5 text-[#5b6270]" />
              {items.length > 0 ? (
                <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#262626] px-1 text-[10px] font-bold text-white">
                  {items.length}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </div>

      <div className="hidden border-b border-[#ecebeb] bg-white lg:block">
        <div className="mx-auto flex h-10 max-w-[1400px] items-center justify-end gap-4 px-8 text-[11px] uppercase tracking-[0.1em] text-[#737373]">
          {isAdminRole(role) ? (
            <Link href="/admin/dashboard" className="inline-flex items-center gap-1 text-[#262626]">
              <ShieldCheck className="h-3.5 w-3.5" /> Admin
            </Link>
          ) : null}
          {isVendorRole(role) ? (
            <Link href="/vendor/dashboard" className="inline-flex items-center gap-1 text-[#262626]">
              <ShieldCheck className="h-3.5 w-3.5" /> Vendor
            </Link>
          ) : null}
          {user ? (
            <Button variant="ghost" className="h-auto px-0 text-[11px] uppercase tracking-[0.1em] text-[#262626] hover:bg-transparent" onClick={logout}>
              Logout
            </Button>
          ) : (
            <Link href="/login" className="text-[#262626]">
              Sign In
            </Link>
          )}
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            className="absolute inset-0 bg-black/35"
            aria-label="Close menu overlay"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative mx-auto mt-14 flex max-h-[calc(100vh-7rem)] w-[92%] max-w-[360px] flex-col overflow-hidden rounded-2xl bg-[#f5f5f6] shadow-[0_20px_50px_rgba(15,23,42,0.28)] lg:ml-0 lg:mt-0 lg:h-full lg:max-h-none lg:w-[86%] lg:max-w-[320px] lg:rounded-none lg:shadow-xl">
            <div className="flex items-center justify-between border-b border-[#e2e3e6] px-5 py-4">
              <div className="flex items-center gap-2">
                {activeColumnMenu ? (
                  <button
                    type="button"
                    aria-label="Back to categories"
                    onClick={() => setMobileColumnId(null)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#d8dbe1] text-[#6a7282]"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                  </button>
                ) : null}
                {!activeColumnMenu && activeTopMenu ? (
                  <button
                    type="button"
                    aria-label="Back to top menu"
                    onClick={() => setMobileTopMenuId(null)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#d8dbe1] text-[#6a7282]"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                  </button>
                ) : null}
                <p className="text-sm uppercase tracking-[0.06em] text-[#7e8597]">
                  {activeColumnMenu?.label ?? activeTopMenu?.label ?? "Shop For"}
                </p>
              </div>
              <button type="button" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-5 w-5 text-[#6a7282]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 pt-1">
              {!activeTopMenu ? (
                mobileMenuTree.map((item) => (
                  <div key={item.id} className="border-b border-[#e2e3e6]">
                    {item.children.length ? (
                      <button
                        type="button"
                        className="flex w-full items-center justify-between px-2 py-4 text-left"
                        onClick={() => {
                          setMobileTopMenuId(item.id);
                          setMobileColumnId(null);
                        }}
                      >
                        <span className="text-2xl font-semibold text-[#111827] md:text-xl">{item.label}</span>
                        <ChevronRight className="h-5 w-5 text-[#9aa1af]" />
                      </button>
                    ) : (
                      <Link href={item.href ?? "/products"} className="flex items-center justify-between px-2 py-4">
                        <span className="text-2xl font-semibold text-[#111827] md:text-xl">{item.label}</span>
                        <ChevronRight className="h-5 w-5 text-[#9aa1af]" />
                      </Link>
                    )}
                  </div>
                ))
              ) : null}

              {activeTopMenu && !activeColumnMenu ? (
                <>
                  <Link
                    href={activeTopMenu.href ?? "/products"}
                    className="mb-2 mt-2 block rounded-md border border-[#d8dbe1] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#374151]"
                  >
                    View All {activeTopMenu.label}
                  </Link>
                  {activeTopMenu.children.map((column) => (
                    <div key={column.id} className="border-b border-[#e2e3e6]">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between px-2 py-3.5 text-left"
                        onClick={() => setMobileColumnId(column.id)}
                      >
                        <span className="text-lg font-semibold text-[#111827]">{column.label}</span>
                        <ChevronRight className="h-5 w-5 text-[#9aa1af]" />
                      </button>
                    </div>
                  ))}
                </>
              ) : null}

              {activeColumnMenu ? (
                <>
                  <Link
                    href={activeColumnMenu.href ?? activeTopMenu?.href ?? "/products"}
                    className="mb-2 mt-2 block rounded-md border border-[#d8dbe1] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#374151]"
                  >
                    View All {activeColumnMenu.label}
                  </Link>
                  {activeColumnMenu.children.map((entry) => (
                    <Link
                      key={entry.id}
                      href={entry.href ?? activeColumnMenu.href ?? "/products"}
                      className="block border-b border-[#e2e3e6] px-2 py-3 text-base text-[#27324d]"
                    >
                      {entry.label}
                    </Link>
                  ))}
                </>
              ) : null}
            </div>

            {!activeTopMenu ? (
              <>
                <div className="space-y-1 px-6 py-5">
                  {mobileMiscLinks.map((item) => (
                    <Link key={item.id} href={item.href} className="block py-2 text-xl text-[#27324d] md:text-lg">
                      {item.label}
                    </Link>
                  ))}
                </div>

                <div className="pb-3 text-center">
                  <Link href="/contact" className="text-[13px] uppercase tracking-[0.05em] text-[#8b92a4]">
                    Contact Us
                  </Link>
                </div>
              </>
            ) : null}
          </aside>
        </div>
      ) : null}
    </motion.header>
  );
}
