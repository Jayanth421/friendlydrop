"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Search, ShoppingBag, User, ShieldCheck, Menu, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useCartStore } from "@/store/use-cart-store";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { isAdminRole, isVendorRole } from "@/lib/rbac";

interface NavbarProps {
  storeName: string;
  brandPrefix?: string;
  logoUrl?: string;
}

const PRIMARY_LINKS = [
  { href: "/products?section=men", label: "MEN" },
  { href: "/products?section=women", label: "WOMEN" },
  { href: "/products?section=kids", label: "KIDS" },
  { href: "/products?section=home", label: "HOME" },
  { href: "/products?section=beauty", label: "BEAUTY" },
  { href: "/products?section=genz", label: "GENZ" },
  { href: "/products?section=studio", label: "STUDIO", badge: "NEW" },
];

const MEGA_MENU_HOME: Array<{ heading: string; links: string[] }> = [
  {
    heading: "Bed Linen & Furnishing",
    links: ["Bed Runners", "Mattress Protectors", "Bedsheets", "Bedding Sets", "Blankets, Quilts & Dohars", "Pillows & Covers", "Sofa Covers", "Flooring", "Carpets"],
  },
  {
    heading: "Bath",
    links: ["Bath Towels", "Hand & Face Towels", "Beach Towels", "Bath Rugs", "Bath Robes", "Bathroom Accessories", "Shower Curtains", "Lamps & Lighting", "Floor Lamps"],
  },
  {
    heading: "Home Decor",
    links: ["Plants & Planters", "Aromas & Candles", "Clocks", "Mirrors", "Wall Decor", "Festive Decor", "Pooja Essentials", "Wall Shelves", "Fountains"],
  },
  {
    heading: "Furniture",
    links: ["Home Gift Sets", "Kitchen & Table", "Table Runners", "Dinnerware & Serveware", "Cups & Mugs", "Bakeware", "Kitchen Storage", "Bar & Drinkware"],
  },
  {
    heading: "Storage",
    links: ["Bins", "Hangers", "Organisers", "Hooks & Holders", "Laundry Bags", "Boxes", "Closet Organizers"],
  },
];

const MOBILE_SHOP_LINKS = [
  { href: "/products?section=men", label: "Men" },
  { href: "/products?section=women", label: "Women" },
  { href: "/products?section=kids", label: "Kids" },
  { href: "/products?section=home", label: "Home" },
  { href: "/products?section=beauty", label: "Beauty" },
  { href: "/products?section=genz", label: "Genz" },
];

const MOBILE_MISC_LINKS = [
  { href: "/orders", label: "Orders" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/account?panel=credit", label: "Gift Cards" },
  { href: "/contact", label: "Contact Us" },
  { href: "/about-brand", label: "Myntra Insider" },
];

export function Navbar({ storeName, brandPrefix, logoUrl }: NavbarProps) {
  const items = useCartStore((state) => state.items);
  const { user, role, logout } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [openMegaMenu, setOpenMegaMenu] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const brandName = brandPrefix?.trim() ? `${brandPrefix.trim()} ${storeName}` : storeName;
  const currentQuery = searchParams.toString();

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
            className={`${iconButtonClass} mr-1 lg:hidden`}
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
              <span className="rounded-full bg-gradient-to-br from-[#ff3f84] via-[#ff8f3f] to-[#7c5cff] px-2 py-0.5 text-xs font-bold text-white md:bg-none md:px-0 md:py-0 md:font-semibold md:uppercase md:tracking-[0.25em] md:text-[#262626]">
                {brandName}
              </span>
            )}
          </Link>

          <div
            className="relative hidden lg:flex lg:flex-1 lg:items-center"
            onMouseLeave={() => setOpenMegaMenu(null)}
          >
            <nav className="flex h-full items-stretch">
              {PRIMARY_LINKS.map((link) => {
                const active = isLinkActive(link.href) || openMegaMenu === link.label;
                return (
                  <div
                    key={link.href}
                    className="relative"
                    onMouseEnter={() => setOpenMegaMenu(link.label === "HOME" ? "HOME" : null)}
                  >
                    <Link
                      href={link.href}
                      className={`relative inline-flex h-[78px] items-center px-4 text-sm font-semibold tracking-[0.03em] ${
                        active ? "text-[#111827]" : "text-[#2f3347] hover:text-[#111827]"
                      }`}
                    >
                      <span>{link.label}</span>
                      {"badge" in link && link.badge ? (
                        <span className="absolute right-0 top-[18px] text-[10px] font-bold tracking-[0.08em] text-[#ff3f6c]">
                          {link.badge}
                        </span>
                      ) : null}
                    </Link>
                    {active ? (
                      <span className="absolute bottom-0 left-3 right-3 h-[3px] bg-[#f2c126]" />
                    ) : null}
                  </div>
                );
              })}
            </nav>

            {openMegaMenu === "HOME" ? (
              <div className="absolute left-0 top-[78px] z-50 w-[min(96vw,1500px)] border border-[#e4e5ea] bg-white shadow-[0_18px_35px_-20px_rgba(17,24,39,0.45)]">
                <div className="grid grid-cols-5">
                  {MEGA_MENU_HOME.map((group, index) => (
                    <div
                      key={group.heading}
                      className={`min-h-[340px] border-r border-[#f0f1f4] px-8 py-7 ${index % 2 === 0 ? "bg-[#fbfbfc]" : "bg-white"} ${index === MEGA_MENU_HOME.length - 1 ? "border-r-0" : ""}`}
                    >
                      <p className="mb-3 text-[22px] font-semibold text-[#f2b400]">{group.heading}</p>
                      <ul className="space-y-2.5">
                        {group.links.map((item) => (
                          <li key={item}>
                            <Link
                              href={`/search?q=${encodeURIComponent(item)}`}
                              className="text-[15px] tracking-tight text-[#222a3f] hover:text-[#111827]"
                            >
                              {item}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
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
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/35"
            aria-label="Close menu overlay"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative h-full w-[86%] max-w-[320px] bg-[#f5f5f6] shadow-xl">
            <div className="flex items-center justify-between border-b border-[#e2e3e6] px-5 py-4">
              <p className="text-sm uppercase tracking-[0.06em] text-[#7e8597]">Shop For</p>
              <button type="button" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-5 w-5 text-[#6a7282]" />
              </button>
            </div>

            <div className="px-4 pt-1">
              {MOBILE_SHOP_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between border-b border-[#e2e3e6] px-2 py-4"
                >
                  <span className="text-[30px] font-semibold text-[#111827] md:text-lg">{item.label}</span>
                  <ChevronRight className="h-5 w-5 text-[#9aa1af]" />
                </Link>
              ))}
            </div>

            <div className="space-y-1 px-6 py-5">
              {MOBILE_MISC_LINKS.map((item) => (
                <Link key={item.href} href={item.href} className="block py-2 text-[26px] text-[#27324d] md:text-lg">
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="absolute bottom-3 left-0 right-0 text-center">
              <Link href="/contact" className="text-[13px] uppercase tracking-[0.05em] text-[#8b92a4]">
                Contact Us
              </Link>
            </div>
          </aside>
        </div>
      ) : null}
    </motion.header>
  );
}
