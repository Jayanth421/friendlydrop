import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { isAdminRole } from "@/lib/rbac";
import { getStoreSettings, getOrder, createTransaction } from "@/lib/firebase/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { createCashfreeRefund } from "@/lib/payments/cashfree";
import { triggerPaymentNotifications } from "@/lib/notifications";
import { publishSystemEvent } from "@/lib/system-events";
import { nanoid } from "nanoid";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(request);

    // Assert authorization: only manager, admin, or super_admin can execute refunds
    const hasPermission = isAdminRole(user.role);
    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden: Insufficient privileges" }, { status: 403 });
    }

    const { orderId, amount, reason } = await request.json();

    if (!orderId || !amount || amount <= 0) {
      return NextResponse.json({ error: "orderId and a positive amount are required" }, { status: 400 });
    }

    const order = await getOrder(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (amount > order.totalAmount) {
      return NextResponse.json({ error: `Refund amount (${amount}) exceeds order total (${order.totalAmount})` }, { status: 400 });
    }

    const settings = await getStoreSettings();
    const refundId = `ref_${nanoid(10)}`;

    // 1. Call Cashfree PG Refund Endpoint
    const cfRefundResponse = await createCashfreeRefund(
      orderId,
      {
        amount,
        refundId,
        note: reason || "Initiated via Admin Panel Dashboard",
      },
      settings,
    );

    // 2. Perform database entries in Firestore
    const db = getAdminDb();
    
    // Add negative transaction ledger entry
    await createTransaction({
      orderId,
      userId: order.userId,
      provider: "cashfree",
      providerPaymentId: cfRefundResponse.refund_id || refundId,
      amount: -amount,
      status: "refunded",
      notes: `Admin refund initiated. Reason: ${reason}. ID: ${refundId}`,
    });

    // Update order status if full refund
    const isFullRefund = amount === order.totalAmount;
    const finalOrderStatus = isFullRefund ? "refunded" : order.status;

    await db.collection("orders").doc(orderId).set({
      status: finalOrderStatus,
      payment: {
        ...order.payment,
        status: isFullRefund ? "rejected" : order.payment.status, // mark full refund as rejected payment status or custom refunded
        notes: `${order.payment.notes || ""}. Refund initiated for amount: ${amount} (ID: ${refundId}).`,
      },
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    // 3. Log Audit log & System events
    await publishSystemEvent({
      type: "refund_initiated",
      module: "payments",
      source: "api:cashfree-refund",
      orderId,
      userId: order.userId,
      actorId: user.uid,
      payload: { amount, refundId, isFullRefund, reason },
    });

    // Write to audit log
    await db.collection("auditLogs").add({
      actorId: user.uid,
      actorRole: user.role,
      module: "payments",
      action: "update",
      before: { orderId, status: order.status, totalAmount: order.totalAmount },
      after: { orderId, status: finalOrderStatus, refundAmount: amount, refundId },
      createdAt: new Date().toISOString(),
    });

    // 4. Trigger WhatsApp/SMS customer alerts
    await triggerPaymentNotifications(order, "refunded", { refundAmount: amount });

    return NextResponse.json({ ok: true, refundId: cfRefundResponse.refund_id || refundId });
  } catch (error: any) {
    console.error("Refund API error:", error);
    return NextResponse.json({ error: error.message || "Failed to process refund on Cashfree" }, { status: 500 });
  }
}
