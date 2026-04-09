import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getUserById, getUserOrders, getUserTransactions, getWishlist } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function AccountPage() {
  const sessionUser = await requireUser();
  const [profile, orders, transactions, wishlistIds] = await Promise.all([
    getUserById(sessionUser.uid),
    getUserOrders(sessionUser.uid),
    getUserTransactions(sessionUser.uid),
    getWishlist(sessionUser.uid),
  ]);

  const primaryAddress = profile?.addresses?.[0] ?? orders[0]?.address ?? null;

  return (
    <main className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="font-display text-3xl font-bold text-ink">My Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">Manage your profile, orders, addresses, wishlist, and payments.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Orders</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{orders.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Wishlist</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{wishlistIds.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Spent</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{formatCurrency(profile?.totalSpend ?? 0)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Loyalty Points</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{profile?.loyaltyPoints ?? 0}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-ink">Profile Details</h2>
          <div className="mt-3 space-y-1 text-sm text-slate-600">
            <p>Name: {profile?.name ?? sessionUser.name}</p>
            <p>Email: {profile?.email ?? sessionUser.email}</p>
            <p>Phone: {profile?.phone ?? "-"}</p>
            <p>Role: {profile?.role ?? sessionUser.role}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-ink">Saved Address</h2>
          {primaryAddress ? (
            <div className="mt-3 space-y-1 text-sm text-slate-600">
              <p>{primaryAddress.fullName}</p>
              <p>{primaryAddress.line1}</p>
              {primaryAddress.line2 ? <p>{primaryAddress.line2}</p> : null}
              <p>
                {primaryAddress.city}, {primaryAddress.state} {primaryAddress.postalCode}
              </p>
              <p>{primaryAddress.country}</p>
              <p>{primaryAddress.phone}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No saved addresses yet.</p>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Order History</h2>
            <Link href="/orders" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="mt-3 space-y-3">
            {orders.slice(0, 5).map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`} className="block rounded-lg border border-slate-200 p-3 text-sm">
                <p className="font-medium text-ink">Order #{order.id}</p>
                <p className="text-slate-500">{formatDate(order.createdAt)}</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-slate-600">{order.status}</span>
                  <span className="font-semibold text-ink">{formatCurrency(order.totalAmount)}</span>
                </div>
              </Link>
            ))}
            {!orders.length ? <p className="text-sm text-slate-500">No orders placed yet.</p> : null}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Payment History</h2>
          </div>
          <div className="mt-3 space-y-3">
            {transactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-ink">{transaction.provider.replace("_", " ")}</p>
                  <span className="font-semibold text-ink">{formatCurrency(transaction.amount)}</span>
                </div>
                <p className="text-slate-500">{formatDate(transaction.createdAt)}</p>
                <p className="text-slate-600">Status: {transaction.status}</p>
              </div>
            ))}
            {!transactions.length ? <p className="text-sm text-slate-500">No payment records found.</p> : null}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Wishlist</h2>
          <Link href="/wishlist" className="text-sm text-blue-600 hover:underline">Open wishlist</Link>
        </div>
        <p className="mt-2 text-sm text-slate-600">You have {wishlistIds.length} saved product(s).</p>
        <div className="mt-4 flex gap-3">
          <Link href="/orders"><Button>View Orders</Button></Link>
          <Link href="/wishlist"><Button variant="secondary">Wishlist</Button></Link>
        </div>
      </section>
    </main>
  );
}
