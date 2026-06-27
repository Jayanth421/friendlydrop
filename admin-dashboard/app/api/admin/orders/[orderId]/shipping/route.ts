import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { shippingSchema } from "@/lib/validators";
import { getOrder, updateOrderShipping } from "@/lib/firebase/firestore";
import { logAdminActivity, logAdminAudit } from "@/lib/admin/logs";
import { publishSystemEvent } from "@/lib/system-events";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const admin = await requireApiPermission(request, "orders:manage");
    const before = await getOrder(params.orderId);
    const payload = shippingSchema.parse(await request.json());

    await updateOrderShipping(params.orderId, payload);

    const after = await getOrder(params.orderId);

    await Promise.all([
      publishSystemEvent({
        type: "delivery_assigned",
        module: "delivery",
        source: "api:admin-order-shipping",
        orderId: params.orderId,
        actorId: admin.uid,
        payload: {
          courier: payload.courier,
          trackingId: payload.trackingId,
          eta: payload.eta,
        },
      }),
      logAdminActivity({
        actorId: admin.uid,
        actorName: admin.name,
        actorRole: admin.role,
        action: "order_shipping_updated",
        targetType: "order",
        targetId: params.orderId,
      }),
      logAdminAudit({
        actorId: admin.uid,
        actorRole: admin.role,
        module: "orders",
        action: "update",
        before: (before ?? null) as unknown as Record<string, unknown> | null,
        after: (after ?? null) as unknown as Record<string, unknown> | null,
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not update shipping" }, { status: 400 });
  }
}
