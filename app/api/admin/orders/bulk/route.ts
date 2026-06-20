import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { updateOrderStatus } from "@/lib/firebase/firestore";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
  orderIds: z.array(z.string()).min(1),
  status: z.enum(["pending", "confirmed", "packed", "shipped", "delivered", "returned", "cancelled", "refunded"]),
});

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireApiPermission(request, "orders:manage");
    const payload = schema.parse(await request.json());

    await Promise.all(payload.orderIds.map((orderId) => updateOrderStatus(orderId, payload.status, "bulk action", admin.uid)));

    return NextResponse.json({ ok: true, updated: payload.orderIds.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Bulk order update failed" }, { status: 400 });
  }
}

