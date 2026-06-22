import { NextRequest, NextResponse } from "next/server";
import { requireApiVendorOrAdmin } from "@/lib/auth/api";
import { getAllOrders, getProducts } from "@/lib/firebase/firestore";
import { isAdminRole } from "@/lib/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiVendorOrAdmin(request);
    const [products, orders] = await Promise.all([getProducts(), getAllOrders()]);

    if (isAdminRole(user.role)) {
      return NextResponse.json({ orders });
    }

    const productIds = new Set(products.filter((product) => product.vendorId === user.uid).map((product) => product.id));
    const vendorOrders = orders.filter((order) => order.items.some((item) => productIds.has(item.productId)));

    return NextResponse.json({ orders: vendorOrders });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not load vendor orders" }, { status: 400 });
  }
}
