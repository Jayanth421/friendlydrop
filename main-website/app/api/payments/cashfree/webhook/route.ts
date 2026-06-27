import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getStoreSettings, getOrder, createOrder, saveCart } from "@/lib/firebase/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { sendOrderEmail } from "@/lib/email";
import { runPostPaymentAutomation } from "@/lib/automation-engine";
import { triggerPaymentNotifications } from "@/lib/notifications";
import { publishSystemEvent } from "@/lib/system-events";
import { Order } from "@/types";

export const runtime = "nodejs";

interface CashfreeWebhookPayload {
  type: string;
  data: {
    order: {
      order_id: string;
      order_amount: number;
    };
    payment: {
      cf_payment_id: number;
      payment_group?: string;
      payment_time?: string;
      payment_message?: string;
    };
    customer_details?: {
      customer_id?: string;
      customer_name?: string;
      customer_phone?: string;
    };
    refund?: {
      refund_amount: number;
      refund_id: string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-webhook-signature");
    const timestamp = request.headers.get("x-webhook-timestamp");
    const rawBody = await request.text();

    if (!signature || !timestamp) {
      console.warn("Cashfree Webhook missing verification headers.");
      return NextResponse.json({ error: "Missing headers" }, { status: 400 });
    }

    const settings = await getStoreSettings();
    const webhookSecret = settings.payments.cashfreeWebhookSecret || process.env.CASHFREE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("Cashfree webhook secret is not configured in settings or environment variables.");
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    // Verify HMAC-SHA256 signature
    const computedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(timestamp + rawBody)
      .digest("base64");

    if (computedSignature !== signature) {
      console.warn("Cashfree Webhook signature verification failed.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as CashfreeWebhookPayload;
    const eventType = payload.type;
    const data = payload.data;

    console.log(`[Webhook Cashfree] Event received: ${eventType} for order: ${data?.order?.order_id}`);

    if (eventType === "PAYMENT_SUCCESS_WEBHOOK" || eventType === "ORDER_PAID") {
      const orderId = data.order.order_id;
      const cfPaymentId = data.payment.cf_payment_id.toString();
      const paymentGroup = data.payment.payment_group || "online";
      const paymentTime = data.payment.payment_time || new Date().toISOString();

      const pendingRef = getAdminDb().collection("pendingOrders").doc(orderId);
      const pendingSnapshot = await pendingRef.get();

      if (!pendingSnapshot.exists) {
        console.warn(`Pending order draft ${orderId} not found in Firestore.`);
        return NextResponse.json({ error: "Pending draft not found" }, { status: 404 });
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

      if (pending.finalizedOrderId) {
        const finalizedOrder = await getOrder(pending.finalizedOrderId);
        console.log(
          finalizedOrder
            ? `Cashfree pending order ${orderId} already finalized as ${finalizedOrder.id}. Webhook skipped creation.`
            : `Cashfree pending order ${orderId} has finalizedOrderId ${pending.finalizedOrderId}, but the order was not found.`,
        );
        return NextResponse.json({ status: "success", alreadyProcessed: true });
      }

      // Finalize and create order
      const status = settings.operations.autoOrderConfirm ? "confirmed" : "pending";
      const subtotalAmount = pending.totals.subtotal ?? pending.orderDraft.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
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
          notes: `Cashfree Webhook confirmed. Group: ${paymentGroup}. Time: ${paymentTime}`,
        },
      });

      // Update pendingOrders and clear cart
      await pendingRef.set({ finalizedOrderId: order.id, webhookProcessedAt: new Date().toISOString() }, { merge: true });
      await saveCart(pending.userId, []);

      // Email client
      if (pending.userEmail) {
        await sendOrderEmail({
          to: pending.userEmail,
          customerName: pending.userName,
          orderId: order.id,
          amount: order.totalAmount,
          status: order.status,
        });
      }

      // Customer notifications (WhatsApp/SMS)
      await triggerPaymentNotifications(order, "success");

      // Automation workflow
      await runPostPaymentAutomation(order, { provider: "cashfree" });
    } 
    
    else if (eventType === "PAYMENT_FAILED_WEBHOOK") {
      const orderId = data.order.order_id;
      const failureReason = data.payment.payment_message || "Transaction declined";
      const amount = data.order.order_amount;
      const phone = data.customer_details?.customer_phone || "9999999999";

      // Log failure
      await publishSystemEvent({
        type: "payment_failed",
        module: "payments",
        source: "webhook:cashfree",
        severity: "warning",
        orderId,
        payload: { provider: "cashfree", reason: failureReason, amount },
      });

      // Write to failed payments collection
      await getAdminDb().collection("failedPayments").doc(`fail_${orderId}`).set({
        orderId,
        provider: "cashfree",
        amount,
        status: "FAILED",
        failureReason,
        createdAt: new Date().toISOString(),
      });

      // Trigger simulated SMS and WhatsApp payment failed alert
      const mockOrder = {
        id: orderId,
        userId: data.customer_details?.customer_id || "unknown",
        totalAmount: amount,
        address: { fullName: data.customer_details?.customer_name || "Customer", phone },
        payment: { provider: "cashfree", status: "failed" },
      } as unknown as Order;
      await triggerPaymentNotifications(mockOrder, "failed", { failureReason });
    } 
    
    else if (eventType === "REFUND_SUCCESS_WEBHOOK") {
      const orderId = data.order.order_id;
      const refundAmount = data.refund?.refund_amount;
      const refundId = data.refund?.refund_id;

      if (refundAmount === undefined || refundId === undefined) {
        return NextResponse.json({ error: "Missing refund details" }, { status: 400 });
      }

      // Locate corresponding order
      const order = await getOrder(orderId);
      if (order) {
        // Update order status to refunded (or partial)
        const db = getAdminDb();
        const updatedStatus = order.totalAmount === refundAmount ? "refunded" : order.status;
        
        await db.collection("orders").doc(orderId).set({
          status: updatedStatus,
          payment: {
            ...order.payment,
            status: order.totalAmount === refundAmount ? "rejected" : order.payment.status, // or mark as refunded
            notes: `${order.payment.notes || ""}. Refund successfully completed. ID: ${refundId}. Amount: ${refundAmount}`,
          },
          updatedAt: new Date().toISOString(),
        }, { merge: true });

        // Add transaction entry for refund
        await db.collection("transactions").add({
          orderId,
          userId: order.userId,
          provider: "cashfree",
          providerPaymentId: refundId,
          amount: -refundAmount,
          status: "refunded",
          notes: `Refund processed successfully. CF ID: ${refundId}`,
          createdAt: new Date().toISOString(),
        });

        // Trigger notifications
        await triggerPaymentNotifications(order, "refunded", { refundAmount });
      }
    }

    return NextResponse.json({ status: "success" });
  } catch (error: any) {
    console.error("Cashfree Webhook API error:", error);
    return NextResponse.json({ error: error.message || "Internal webhook process error" }, { status: 500 });
  }
}
