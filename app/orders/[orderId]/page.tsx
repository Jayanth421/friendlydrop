import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getOrder } from "@/lib/firebase/firestore";
import { isAdminRole } from "@/lib/rbac";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OrderTracker } from "@/components/shared/order-tracker";

export default async function OrderDetailPage({ params }: { params: { orderId: string } }) {
  const user = await requireUser();
  const order = await getOrder(params.orderId);

  if (!order || (order.userId !== user.uid && !isAdminRole(user.role))) {
    notFound();
  }

  const subtotalAmount = order.subtotalAmount ?? order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = order.discountAmount ?? 0;
  const taxAmount = order.taxAmount ?? 0;
  const deliveryFee = order.deliveryFee ?? 0;

  return (
    <main className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="font-display text-3xl font-bold text-ink">Order #{order.id}</h1>
        <p className="mt-2 text-sm text-slate-600">Placed on {formatDate(order.createdAt)}</p>
      </div>

      <OrderTracker order={order} />

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-ink">Items</h2>
        <div className="mt-3 space-y-2">
          {order.items.map((item) => (
            <div key={item.productId} className="flex justify-between text-sm">
              <span>{item.name} x {item.quantity}</span>
              <span>{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="border-t pt-2 text-base font-semibold">
            <div className="flex justify-between text-sm font-normal">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm font-normal text-green-700">
              <span>Discount</span>
              <span>-{formatCurrency(discountAmount)}</span>
            </div>
            <div className="flex justify-between text-sm font-normal">
              <span>GST {typeof order.taxRate === "number" ? `(${order.taxRate}%)` : ""}</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between text-sm font-normal">
              <span>Delivery</span>
              <span>{formatCurrency(deliveryFee)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-ink">Delivery Address</h2>
        <p className="mt-2 text-sm text-slate-600">
          {order.address.fullName}, {order.address.line1}, {order.address.city}, {order.address.state} - {order.address.postalCode}, {order.address.country}
        </p>
      </section>
    </main>
  );
}
