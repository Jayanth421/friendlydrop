import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { updateStatusSchema } from "@/lib/validators";
import { getOrder, getUserById, updateOrderStatus } from "@/lib/firebase/firestore";
import { sendOrderEmail } from "@/lib/email";
import { logAdminActivity, logAdminAudit } from "@/lib/admin/logs";
import { publishSystemEvent } from "@/lib/system-events";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const admin = await requireApiPermission(request, "orders:manage");
    const before = await getOrder(params.orderId);
    const { status, note } = updateStatusSchema.parse(await request.json());

    await updateOrderStatus(params.orderId, status, note, admin.uid);

    const order = await getOrder(params.orderId);

    if (order) {
      const orderUser = await getUserById(order.userId);

      if (orderUser?.email) {
        await sendOrderEmail({
          to: orderUser.email,
          customerName: orderUser.name,
          orderId: order.id,
          amount: order.totalAmount,
          status,
        });
      }
    }

    await Promise.all([
      publishSystemEvent({
        type: "order_status_updated",
        module: "orders",
        source: "api:admin-order-status",
        orderId: params.orderId,
        actorId: admin.uid,
        payload: { status, note },
      }),
      ...(status === "refunded"
        ? [
            publishSystemEvent({
              type: "refund_completed",
              module: "payments",
              source: "api:admin-order-status",
              orderId: params.orderId,
              actorId: admin.uid,
              payload: { note },
            }),
          ]
        : []),
      logAdminActivity({
        actorId: admin.uid,
        actorName: admin.name,
        actorRole: admin.role,
        action: "order_status_updated",
        targetType: "order",
        targetId: params.orderId,
        details: { status },
      }),
      logAdminAudit({
        actorId: admin.uid,
        actorRole: admin.role,
        module: "orders",
        action: "update",
        before: (before ?? null) as unknown as Record<string, unknown> | null,
        after: (order ?? null) as unknown as Record<string, unknown> | null,
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not update order status" }, { status: 400 });
  }
}
