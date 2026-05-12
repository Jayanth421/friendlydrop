"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Search, ShoppingBag, User, ShieldCheck, Menu } from "lucide-react";
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
  { href: "/products?section=women", label: "Women" },
  { href: "/products?section=men", label: "Men" },
  { href: "/products?section=kids", label: "Kids" },
  { href: "/products", label: "New Arrivals" },
  { href: "/about-brand", label: "About" },
];

export function Navbar({ storeName, brandPrefix, logoUrl }: NavbarProps) {
  const items = useCartStore((state) => state.items);
  const { user, role, logout } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 bg-white"
    >
      <div className="bg-[#b3ef00] px-4 py-2 text-center text-[12px] tracking-[0.02em] text-[#262626] md:px-8">
        <p>
          Get early access on launches and offers.{" "}
          <Link href="/signup" className="underline underline-offset-2">
            Sign up for texts
          </Link>
        </p>
      </div>

      <div className="border-b border-[#dddbdc]">
        <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between px-4 md:px-8">
          <nav className="hidden items-center lg:flex">
            {PRIMARY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-6 text-[12px] uppercase tracking-[0.08em] ${
                  isLinkActive(link.href) ? "border-b-2 border-[#262626] text-[#262626]" : "text-[#737373] hover:text-[#262626]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Link href="/" className="flex items-center" aria-label={brandName}>
            {logoUrl ? (
              <span
                className="h-10 w-24 bg-contain bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${logoUrl})` }}
                aria-hidden="true"
              />
            ) : (
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#262626]">
                {brandName}
              </span>
            )}
          </Link>

          <div className="flex items-center gap-0.5 md:gap-1">
            <Link href="/search" className={iconButtonClass} aria-label="Search">
              <Search className="h-5 w-5" />
            </Link>
            <Link href="/account" className={iconButtonClass} aria-label="Account">
              <User className="h-5 w-5" />
            </Link>
            <Link href="/wishlist" className={iconButtonClass} aria-label="Wishlist">
              <Heart className="h-5 w-5" />
            </Link>
            <Link href="/cart" className={iconButtonClass} aria-label="Cart">
              <ShoppingBag className="h-5 w-5" />
              {items.length > 0 ? (
                <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#262626] px-1 text-[10px] font-bold text-white">
                  {items.length}
                </span>
              ) : null}
            </Link>
            <Link href="/products" className={`${iconButtonClass} lg:hidden`} aria-label="Menu">
              <Menu className="h-6 w-6" />
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
    </motion.header>
  );
}
