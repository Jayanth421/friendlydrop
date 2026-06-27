"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Sparkles, User, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", icon: "brand", label: "Home" },
  { href: "/products?price=under-499", icon: Wallet, label: "Under Rs 499", queryKey: "price", queryValue: "under-999" },
  { href: "/products?section=shop", icon: Sparkles, label: "Shop", queryKey: "section", queryValue: "beauty" },
  { href: "/account", icon: User, label: "Profile" },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (pathname.startsWith("/admin") || pathname.startsWith("/vendor") || pathname.startsWith("/vendors") || pathname === "/products") {
    return null;
  }

  const isActive = (href: string, queryKey?: string, queryValue?: string) => {
    const [path] = href.split("?");
    if (pathname !== path) return false;
    if (!queryKey) return true;
    return searchParams.get(queryKey) === queryValue;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#e6e7ea] bg-white md:hidden">
      <div className="mx-auto grid max-w-[430px] grid-cols-4">
        {links.map(({ href, icon: Icon, label, queryKey, queryValue }) => {
          const active = isActive(href, queryKey, queryValue);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-2 py-2.5 text-[11px] font-medium transition",
                active ? "text-[#16a34a]" : "text-[#313746]",
              )}
            >
              {Icon === "brand" ? (
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-[#16a34a] via-[#22c55e] to-[#4ade80] text-[11px] font-bold text-white">
                  FD
                </span>
              ) : (
                <Icon className="h-4 w-4" />
              )}
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
