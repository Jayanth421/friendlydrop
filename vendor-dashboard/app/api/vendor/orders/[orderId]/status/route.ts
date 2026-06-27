import { NextRequest, NextResponse } from "next/server";
import { requireApiVendorOrAdmin } from "@/lib/auth/api";
import { getAllOrders, getOrder, getProducts, updateOrderStatus } from "@/lib/firebase/firestore";
import { updateStatusSchema } from "@/lib/validators";
import { assertTrustedMutationRequest, toGuardErrorResponse } from "@/lib/security/request-guards";
import { isAdminRole } from "@/lib/rbac";
import { OrderStatus } from "@/types";

export const runtime = "nodejs";

const VENDOR_ALLOWED_STATUSES = new Set<OrderStatus>(["confirmed", "packed", "shipped", "delivered", "returned", "cancelled"]);

async function assertVendorOrder(request: NextRequest, orderId: string) {
  const user = await requireApiVendorOrAdmin(request);
  const order = await getOrder(orderId);

  if (!order) {
    throw new Error("NOT_FOUND");
  }

  if (isAdminRole(user.role)) {
    return { user, order };
  }

  const products = await getProducts();
  const productIds = new Set(products.filter((product) => product.vendorId === user.uid).map((product) => product.id));
  const ownsOrder = order.items.some((item) => productIds.has(item.productId));

  if (!ownsOrder) {
    throw new Error("FORBIDDEN");
  }

  return { user, order };
}

export async function PATCH(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const { user } = await assertVendorOrder(request, params.orderId);
    assertTrustedMutationRequest(request);
    const { status, note } = updateStatusSchema.parse(await request.json());

    if (!isAdminRole(user.role) && !VENDOR_ALLOWED_STATUSES.has(status)) {
      return NextResponse.json({ error: "Vendors cannot set this order status" }, { status: 403 });
    }

    await updateOrderStatus(params.orderId, status, note, user.uid);
    const orders = await getAllOrders();
    const order = orders.find((item) => item.id === params.orderId);

    return NextResponse.json({ ok: true, order });
  } catch (error) {
    const guardError = toGuardErrorResponse(error);
    if (guardError) {
      return guardError;
    }

    const message = error instanceof Error ? error.message : "";
    const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : message === "NOT_FOUND" ? 404 : 400;
    console.error(error);
    return NextResponse.json({ error: "Could not update vendor order status" }, { status });
  }
}
