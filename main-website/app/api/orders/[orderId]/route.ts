import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { getOrder } from "@/lib/firebase/firestore";
import { isAdminRole } from "@/lib/rbac";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: { orderId: string } }) {
  const user = await requireApiUser(request);
  const order = await getOrder(params.orderId);

  if (!order || (order.userId !== user.uid && !isAdminRole(user.role))) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ order });
}
