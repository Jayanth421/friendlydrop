import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { createOrder, getOrder, saveCart } from "@/lib/firebase/firestore";
import { getStripeInstance } from "@/lib/payments/stripe";
import { getAdminDb } from "@/lib/firebase/admin";
import { sendOrderEmail } from "@/lib/email";
import { runPostPaymentAutomation } from "@/lib/automation-engine";
import { isAdminRole } from "@/lib/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    const sessionId = request.nextUrl.searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ error: "session_id is required" }, { status: 400 });
    }

    const session = await getStripeInstance().checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Stripe session not paid" }, { status: 400 });
    }

    const pendingOrderId = session.metadata?.pendingOrderId;

    if (!pendingOrderId) {
      return NextResponse.json({ error: "Missing pending order reference" }, { status: 400 });
    }

    const pendingRef = getAdminDb().collection("pendingOrders").doc(pendingOrderId);
    const pendingSnapshot = await pendingRef.get();

    if (!pendingSnapshot.exists) {
      return NextResponse.json({ error: "Pending order not found" }, { status: 404 });
    }

    const pending = pendingSnapshot.data() as {
      userId: string;
      userEmail: string;
      userName: string;
      orderDraft: {
        items: Array<{ productId: string; name: string; price: number; quantity: number; image: string; customImageUrl?: string }>;
        address: {
          fullName: string;
          phone: string;
          line1: string;
          line2?: string;
          city: string;
          state: string;
          postalCode: string;
          country: string;
        };
        couponCode?: string;
        priority?: "express" | "normal";
      };
      totals: {
        subtotal?: number;
        total: number;
        discountAmount?: number;
        taxableAmount?: number;
        taxRate?: number;
        taxAmount?: number;
        deliveryFee?: number;
      };
      finalizedOrderId?: string;
    };

    if (pending.userId !== user.uid && !isAdminRole(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (pending.finalizedOrderId) {
      const existing = await getOrder(pending.finalizedOrderId);
      return NextResponse.json({ ok: true, order: existing });
    }

    const subtotalAmount = pending.totals.subtotal ?? pending.orderDraft.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountAmount = pending.totals.discountAmount ?? 0;
    const taxRate = pending.totals.taxRate ?? 0;
    const taxAmount = pending.totals.taxAmount ?? 0;
    const deliveryFee = pending.totals.deliveryFee ?? 0;

    const order = await createOrder({
      userId: pending.userId,
      items: pending.orderDraft.items,
      priority: pending.orderDraft.priority ?? "normal",
      totalAmount: pending.totals.total,
      subtotalAmount,
      taxRate,
      taxAmount,
      deliveryFee,
      paymentId: session.payment_intent?.toString() ?? session.id,
      status: "confirmed",
      address: pending.orderDraft.address,
      couponCode: pending.orderDraft.couponCode,
      discountAmount,
      payment: {
        provider: "stripe",
        paymentId: session.payment_intent?.toString() ?? session.id,
        orderId: session.id,
        status: "success",
      },
    });

    await pendingRef.set({ finalizedOrderId: order.id, updatedAt: new Date().toISOString() }, { merge: true });
    await saveCart(pending.userId, []);

    if (pending.userEmail) {
      await sendOrderEmail({
        to: pending.userEmail,
        customerName: pending.userName,
        orderId: order.id,
        amount: order.totalAmount,
        status: order.status,
      });
    }

    await runPostPaymentAutomation(order, { provider: "stripe" });

    return NextResponse.json({ ok: true, order });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not confirm stripe order" }, { status: 400 });
  }
}
