import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getUserOrders } from "@/lib/firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await getUserOrders(user.uid);

  return (
    <main className="space-y-5">
      <h1 className="font-display text-4xl font-bold text-ink">Order History</h1>

      <div className="space-y-3">
        {orders.map((order) => (
          <Link key={order.id} href={`/orders/${order.id}`} className="block rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">Order #{order.id}</p>
                <p className="text-sm text-slate-500">{formatDate(order.createdAt)}</p>
              </div>
              <Badge>{order.status}</Badge>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span>{order.items.length} items</span>
              <span className="font-semibold">{formatCurrency(order.totalAmount)}</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
