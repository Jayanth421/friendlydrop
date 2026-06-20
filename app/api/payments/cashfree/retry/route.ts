import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { getStoreSettings, getOrder } from "@/lib/firebase/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { createCashfreeOrder } from "@/lib/payments/cashfree";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    const body = await request.json();
    const orderId = body.orderId;

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const order = await getOrder(orderId);
    
    // Check if order exists in finalized orders first
    if (order) {
      if (order.status !== "pending") {
        return NextResponse.json({ error: "Order is already paid or processed." }, { status: 400 });
      }
    }

    // Load store settings
    const settings = await getStoreSettings();
    
    // Check if order draft exists in pendingOrders
    const pendingRef = getAdminDb().collection("pendingOrders").doc(orderId);
    const pendingSnapshot = await pendingRef.get();
    
    let amount = 0;
    let customerName = "Customer";
    let customerEmail = user.email || "noreply@friendlydrop.in";
    let customerPhone = "9999999999";

    if (order) {
      amount = order.totalAmount;
      customerName = order.address.fullName || "Customer";
      customerPhone = order.address.phone || "9999999999";
    } else if (pendingSnapshot.exists) {
      const pendingData = pendingSnapshot.data();
      if (!pendingData) {
        return NextResponse.json({ error: "Order draft data is empty." }, { status: 404 });
      }
      amount = pendingData.totals?.total ?? 0;
      customerName = pendingData.orderDraft?.address?.fullName || "Customer";
      customerPhone = pendingData.orderDraft?.address?.phone || "9999999999";
      customerEmail = pendingData.userEmail || customerEmail;
    } else {
      return NextResponse.json({ error: "Order reference not found." }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    
    // Recreate/Generate Cashfree payment session
    const cashfreeOrder = await createCashfreeOrder(
      {
        orderId: orderId,
        amount: amount,
        customerName,
        customerEmail,
        customerPhone,
        userId: user.uid,
        returnUrl: `${appUrl}/checkout/cashfree-return?order_id=${orderId}`,
      },
      settings,
    );

    return NextResponse.json({
      ok: true,
      paymentSessionId: cashfreeOrder.paymentSessionId,
      isSandbox: settings.payments.cashfreeSandboxMode ?? true,
      amount,
    });
  } catch (error: any) {
    console.error("Retry payment API error:", error);
    return NextResponse.json({ error: error.message || "Failed to initiate retry session" }, { status: 500 });
  }
}
