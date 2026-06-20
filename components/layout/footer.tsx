"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface FooterProps {
  storeName: string;
  brandPrefix?: string;
  brandTagline?: string;
  supportEmail: string;
  supportPhone: string;
}

export function Footer({ storeName, brandPrefix, brandTagline, supportEmail, supportPhone }: FooterProps) {
  const pathname = usePathname();
  const brandName = brandPrefix?.trim() ? `${brandPrefix.trim()} ${storeName}` : storeName;

  if (pathname.startsWith("/admin") || pathname.startsWith("/vendor") || pathname.startsWith("/vendors")) {
    return null;
  }

  return (
    <footer className={`border-t border-[#dddbdc] bg-[#f5f4f4] ${pathname === "/products" ? "hidden lg:block" : ""}`}>
      <div className="mx-auto max-w-[1400px] px-4 py-12 md:px-10">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#262626]">{brandName}</h3>
            <p className="mt-4 max-w-md text-sm uppercase tracking-[0.08em] text-[#737373]">
              {brandTagline ?? "Consciously crafted essentials and modern everyday fashion."}
            </p>
            <p className="mt-6 text-xs uppercase tracking-[0.08em] text-[#737373]">
              {supportEmail}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.08em] text-[#737373]">
              {supportPhone}
            </p>
          </div>

          <div>
            <h4 className="text-sm uppercase tracking-[0.12em] text-[#262626]">Account</h4>
            <div className="mt-4 space-y-2 text-xs uppercase tracking-[0.1em] text-[#737373]">
              <Link href="/login" className="block hover:text-[#262626]">
                Log In
              </Link>
              <Link href="/signup" className="block hover:text-[#262626]">
                Sign Up
              </Link>
              <Link href="/orders" className="block hover:text-[#262626]">
                Orders
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm uppercase tracking-[0.12em] text-[#262626]">Company</h4>
            <div className="mt-4 space-y-2 text-xs uppercase tracking-[0.1em] text-[#737373]">
              <Link href="/about-brand" className="block hover:text-[#262626]">
                About
              </Link>
              <Link href="/products" className="block hover:text-[#262626]">
                Collections
              </Link>
              <Link href="/contact" className="block hover:text-[#262626]">
                Contact
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm uppercase tracking-[0.12em] text-[#262626]">Policies</h4>
            <div className="mt-4 space-y-2 text-xs uppercase tracking-[0.1em] text-[#737373]">
              <Link href="/privacy-policy" className="block hover:text-[#262626]">
                Privacy
              </Link>
              <Link href="/terms-and-conditions" className="block hover:text-[#262626]">
                Terms
              </Link>
              <Link href="/contact" className="block hover:text-[#262626]">
                Help Center
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-[#dddbdc] pt-6">
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-[11px] uppercase tracking-[0.1em] text-[#737373]">
            <Link href="/privacy-policy" className="hover:text-[#262626]">
              Privacy Policy
            </Link>
            <Link href="/terms-and-conditions" className="hover:text-[#262626]">
              Terms of Service
            </Link>
            <Link href="/contact" className="hover:text-[#262626]">
              Support
            </Link>
          </div>
          <p className="mt-4 text-[11px] uppercase tracking-[0.08em] text-[#737373]">
            © {new Date().getFullYear()} {brandName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
