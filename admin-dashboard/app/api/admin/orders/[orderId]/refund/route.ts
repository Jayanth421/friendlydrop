import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { refundSchema } from "@/lib/validators";
import { getOrder, updateOrderStatus } from "@/lib/firebase/firestore";
import { publishSystemEvent } from "@/lib/system-events";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const admin = await requireApiPermission(request, "orders:manage");
    const payload = refundSchema.parse(await request.json());
    const order = await getOrder(params.orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await updateOrderStatus(order.id, "refunded", payload.reason);
    await publishSystemEvent({
      type: "refund_initiated",
      module: "payments",
      source: "api:admin-order-refund",
      orderId: order.id,
      actorId: admin.uid,
      payload: {
        amount: payload.amount,
        reason: payload.reason,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not process refund" }, { status: 400 });
  }
}
