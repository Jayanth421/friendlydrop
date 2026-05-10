"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Search, ShoppingBag, User, ShieldCheck, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "@/lib/constants";
import { useCartStore } from "@/store/use-cart-store";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { isAdminRole, isVendorRole } from "@/lib/rbac";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function Navbar() {
  const items = useCartStore((state) => state.items);
  const { user, role, logout } = useAuth();
  const pathname = usePathname();

  const iconButtonClass =
    "relative rounded-full border border-white/50 bg-white/75 p-2.5 text-slate-700 transition hover:-translate-y-0.5 hover:text-black dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100";

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass-panel sticky top-0 z-50 border-b"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-8">
        <Link href="/" className="font-display text-xl font-semibold tracking-tight md:text-2xl">
          Maison FriendlyDrop
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition ${pathname === link.href ? "text-black dark:text-white" : "text-slate-600 hover:text-black dark:text-slate-300 dark:hover:text-white"}`}
            >
              {link.label}
            </Link>
          ))}
          {isAdminRole(role) ? (
            <Link href="/admin/dashboard" className="inline-flex items-center gap-1 text-sm font-semibold text-ink dark:text-slate-100">
              <ShieldCheck className="h-4 w-4" /> Admin
            </Link>
          ) : null}
          {isVendorRole(role) ? (
            <Link href="/vendor/dashboard" className="inline-flex items-center gap-1 text-sm font-semibold text-ink dark:text-slate-100">
              <ShieldCheck className="h-4 w-4" /> Vendor
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/search" className={iconButtonClass} aria-label="Search">
            <Search className="h-4 w-4" />
          </Link>
          <Link href="/wishlist" className={iconButtonClass} aria-label="Wishlist">
            <Heart className="h-5 w-5" />
          </Link>
          <Link href="/cart" className={iconButtonClass} aria-label="Cart">
            <ShoppingBag className="h-5 w-5" />
            {items.length > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                {items.length}
              </span>
            ) : null}
          </Link>

          {user ? (
            <Button variant="ghost" className="hidden lg:inline-flex dark:text-slate-100 dark:hover:bg-slate-800/70" onClick={logout}>
              Logout
            </Button>
          ) : (
            <Link
              href="/login"
              className="hidden rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/80 dark:bg-slate-100 dark:text-slate-950 lg:inline-flex"
            >
              Sign In
            </Link>
          )}

          <Link href="/account" className={iconButtonClass} aria-label="Account">
            <User className="h-4 w-4" />
          </Link>
          <Link href="/products" className={`${iconButtonClass} lg:hidden`} aria-label="Menu">
            <Menu className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
