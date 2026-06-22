import { NextRequest, NextResponse } from "next/server";
import { requireApiVendorOrAdmin } from "@/lib/auth/api";
import { getOrder, getProducts, updateOrderShipping } from "@/lib/firebase/firestore";
import { shippingSchema } from "@/lib/validators";
import { assertTrustedMutationRequest, toGuardErrorResponse } from "@/lib/security/request-guards";
import { isAdminRole } from "@/lib/rbac";

export const runtime = "nodejs";

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
    await assertVendorOrder(request, params.orderId);
    assertTrustedMutationRequest(request);
    const payload = shippingSchema.parse(await request.json());

    await updateOrderShipping(params.orderId, payload);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const guardError = toGuardErrorResponse(error);
    if (guardError) {
      return guardError;
    }

    const message = error instanceof Error ? error.message : "";
    const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : message === "NOT_FOUND" ? 404 : 400;
    console.error(error);
    return NextResponse.json({ error: "Could not update vendor shipping" }, { status });
  }
}
