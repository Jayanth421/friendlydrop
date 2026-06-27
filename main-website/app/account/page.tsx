import Link from "next/link";
import type { ComponentType } from "react";
import { requireUser } from "@/lib/auth/session";
import { getUserById } from "@/lib/firebase/firestore";
import { getUserOrders, getUserTransactions, getWishlist } from "@/lib/firebase/firestore";
import {
  BadgeIndianRupee,
  ChevronRight,
  CreditCard,
  Gift,
  Grid2X2,
  MapPin,
  Package,
  ShieldCheck,
  TicketPercent,
  UserRound,
  Wallet,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default async function AccountPage() {
  const sessionUser = await requireUser();
  const [profile, orders, transactions, wishlistIds] = await Promise.all([
    getUserById(sessionUser.uid),
    getUserOrders(sessionUser.uid),
    getUserTransactions(sessionUser.uid),
    getWishlist(sessionUser.uid),
  ]);

  const addressesCount = profile?.addresses?.length ?? 0;
  const cardsCount = transactions.filter((item) => item.provider === "razorpay" || item.provider === "stripe").length;
  const upiCount = transactions.filter((item) => item.provider === "upi_offline").length;
  const walletBalance = profile?.walletBalance ?? 0;

  return (
    <main className="mx-auto max-w-[430px] bg-[#f2f2f4] pb-10 pt-2 md:mt-6 md:rounded-lg md:border md:border-[#e3e4e8] md:bg-white md:shadow-sm">
      <section className="h-[170px] border-y border-[#e6e7eb] bg-[#f0f0f2]" />
      <section className="-mt-16 flex justify-center">
        <div className="h-[126px] w-[126px] bg-[#7f8082] p-4">
          <div className="mx-auto mt-2 h-10 w-10 rounded-full bg-[#cfd0d3]" />
          <div className="mx-auto mt-3 h-12 w-20 rounded-t-[60px] bg-[#cfd0d3]" />
        </div>
      </section>

      <section className="px-5 pb-2 pt-4 text-center">
        <p className="text-[18px] font-semibold text-[#1f2937]">{profile?.name ?? sessionUser.name ?? "Your Account"}</p>
        <p className="mt-1 text-[13px] text-[#7f8797]">{profile?.email ?? sessionUser.email}</p>
      </section>

      <div className="mt-3 h-2 bg-[#ececef]" />
      <AccountMenuItem href="/orders" title="Orders" subtitle={`Check your order status${orders.length ? ` • ${orders.length} orders` : ""}`} icon={Package} />
      <AccountMenuItem href="/wishlist" title="Collections & Wishlist" subtitle={`All your curated product collections${wishlistIds.length ? ` • ${wishlistIds.length} saved` : ""}`} icon={Grid2X2} />

      <div className="mt-3 h-2 bg-[#ececef]" />
      <AccountMenuItem href="/account?panel=credit" title="FD Credit" subtitle="Manage all your refunds & gift cards" icon={Gift} />
      <AccountMenuItem href="/account?panel=mycash" title="FD Cash" subtitle={`Earn FDCash as you shop and use them in checkout • ${formatCurrency(walletBalance)}`} icon={BadgeIndianRupee} />
      <AccountMenuItem href="/account?panel=saved-cards" title="Saved Cards" subtitle={`Save your cards for faster checkout${cardsCount ? ` • ${cardsCount} used` : ""}`} icon={CreditCard} />
      <AccountMenuItem href="/account?panel=saved-upi" title="Saved UPI" subtitle={`View your saved UPI${upiCount ? ` • ${upiCount} recent` : ""}`} icon={ShieldCheck} />
      <AccountMenuItem href="/account?panel=wallets-bnpl" title="Wallets/BNPL" subtitle="View your saved Wallets and BNPL" icon={Wallet} />
      <AccountMenuItem href="/account?panel=addresses" title="Addresses" subtitle={`Save addresses for a hassle-free checkout${addressesCount ? ` • ${addressesCount} saved` : ""}`} icon={MapPin} />
      <AccountMenuItem href="/account?panel=coupons" title="Coupons" subtitle="Manage coupons for additional discounts" icon={TicketPercent} />

      <div className="mt-3 h-2 bg-[#ececef]" />
      <AccountMenuItem href="/account?panel=profile" title="Profile Details" subtitle="Change your profile details" icon={UserRound} />

      <div className="mt-3 h-2 bg-[#ececef]" />
      <section className="px-12 py-5">
        <ul className="space-y-8 text-[15px] font-semibold uppercase tracking-[0.02em] text-[#656d7d]">
          <li><Link href="/contact">FAQs</Link></li>
          <li><Link href="/about-brand">About Us</Link></li>
          <li><Link href="/terms-and-conditions">Terms of Use</Link></li>
          <li><Link href="/privacy-policy">Customer Policies</Link></li>
          <li><Link href="/contact">Useful Links</Link></li>
        </ul>
      </section>
    </main>
  );
}

function AccountMenuItem({
  href,
  title,
  subtitle,
  icon: Icon,
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 border-b border-[#ebecef] bg-white px-4 py-4 transition hover:bg-[#fafbfc]"
    >
      <span className="inline-flex h-9 w-9 items-center justify-center text-[#8b93a4]">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[19px] font-semibold leading-tight text-[#1f2a44]">{title}</p>
        <p className="mt-1 text-[14px] leading-tight text-[#8b93a4]">{subtitle}</p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-[#8f95a6]" />
    </Link>
  );
}