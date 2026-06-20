import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { getStoreSettings, getOrder, createOrder, saveCart } from "@/lib/firebase/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { getCashfreeOrder, getCashfreeOrderPayments } from "@/lib/payments/cashfree";
import { runPostPaymentAutomation } from "@/lib/automation-engine";
import { sendOrderEmail } from "@/lib/email";
import { triggerPaymentNotifications } from "@/lib/notifications";
import { publishSystemEvent } from "@/lib/system-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    const orderId = request.nextUrl.searchParams.get("order_id");

    if (!orderId) {
      return NextResponse.json({ error: "order_id is required" }, { status: 400 });
    }

    const pendingRef = getAdminDb().collection("pendingOrders").doc(orderId);
    const pendingSnapshot = await pendingRef.get();

    if (!pendingSnapshot.exists) {
      return NextResponse.json({ error: "Pending order draft not found. Webhook might process it shortly." }, { status: 404 });
    }

    const pending = pendingSnapshot.data() as {
      userId: string;
      userName: string;
      userEmail?: string;
      totals: {
        total: number;
        subtotal?: number;
        discountAmount?: number;
        taxRate?: number;
        taxAmount?: number;
        deliveryFee?: number;
      };
      orderDraft: {
        items: any[];
        priority?: "normal" | "express";
        address: any;
        couponCode?: string;
      };
      finalizedOrderId?: string;
    };

    if (pending.userId !== user.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (pending.finalizedOrderId) {
      const finalizedOrder = await getOrder(pending.finalizedOrderId);
      if (finalizedOrder) {
        return NextResponse.json({ ok: true, order: finalizedOrder });
      }
    }

    // 1. Fetch store settings and query Cashfree API directly
    const settings = await getStoreSettings();
    const cfOrder = await getCashfreeOrder(orderId, settings);

    if (cfOrder.order_status !== "PAID") {
      // Log payment failure event if failed
      if (cfOrder.order_status === "FAILED" || cfOrder.order_status === "TERMINATED") {
        await publishSystemEvent({
          type: "payment_failed",
          module: "payments",
          source: "api:cashfree-verify",
          severity: "warning",
          orderId,
          userId: user.uid,
          payload: { provider: "cashfree", status: cfOrder.order_status },
        });

        // Write to failed payments log in Firestore
        await getAdminDb().collection("failedPayments").doc(`fail_${orderId}`).set({
          orderId,
          userId: user.uid,
          provider: "cashfree",
          amount: cfOrder.order_amount,
          status: cfOrder.order_status,
          failureReason: "Payment attempt failed or was terminated by Cashfree.",
          createdAt: new Date().toISOString(),
        });
      }

      return NextResponse.json({ 
        ok: false, 
        status: cfOrder.order_status, 
        error: `Payment verification failed. Cashfree order status: ${cfOrder.order_status}` 
      }, { status: 400 });
    }

    // 3. Payment is successful. Retrieve payment attempts to gather payment method details.
    const payments = await getCashfreeOrderPayments(orderId, settings);
    const successfulPayment = payments.find((p: any) => p.payment_status === "SUCCESS");
    
    const cfPaymentId = successfulPayment?.cf_payment_id?.toString() || `cf_${orderId}`;
    const paymentGroup = successfulPayment?.payment_group || "online";
    const paymentTime = successfulPayment?.payment_time || new Date().toISOString();

    // 2. Finalize and create the permanent order in Firestore
    const status = settings.operations.autoOrderConfirm ? "confirmed" : "pending";
    const subtotalAmount = pending.totals.subtotal ?? pending.orderDraft.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
    const discountAmount = pending.totals.discountAmount ?? 0;
    const taxRate = pending.totals.taxRate ?? 0;
    const taxAmount = pending.totals.taxAmount ?? 0;
    const deliveryFee = pending.totals.deliveryFee ?? 0;

    // Create order with Cashfree payment record details
    const order = await createOrder({
      userId: pending.userId,
      items: pending.orderDraft.items,
      priority: pending.orderDraft.priority ?? "normal",
      totalAmount: pending.totals.total,
      subtotalAmount,
      taxRate,
      taxAmount,
      deliveryFee,
      paymentId: cfPaymentId,
      status,
      address: pending.orderDraft.address,
      couponCode: pending.orderDraft.couponCode,
      discountAmount,
      payment: {
        provider: "cashfree",
        paymentId: cfPaymentId,
        orderId: orderId,
        status: "success",
        notes: `Cashfree Payment Group: ${paymentGroup}. Time: ${paymentTime}`,
      },
    });

    // 6. Clean up: mark pending order as finalized, clear customer cart
    await pendingRef.set({ finalizedOrderId: order.id, updatedAt: new Date().toISOString() }, { merge: true });
    await saveCart(pending.userId, []);

    // 7. Fire notifications & post-payment integrations
    if (pending.userEmail) {
      await sendOrderEmail({
        to: pending.userEmail,
        customerName: pending.userName,
        orderId: order.id,
        amount: order.totalAmount,
        status: order.status,
      });
    }

    // Trigger WhatsApp & SMS customer/admin notifications
    await triggerPaymentNotifications(order, "success");

    // Execute standard post-payment pipelines (inventory reservations, shipping partner alerts)
    await runPostPaymentAutomation(order, { provider: "cashfree" });

    return NextResponse.json({ ok: true, order });
  } catch (error: any) {
    console.error("Cashfree Verification API error:", error);
    return NextResponse.json({ error: error.message || "Internal payment verification failure" }, { status: 500 });
  }
}
