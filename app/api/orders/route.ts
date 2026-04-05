import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { getUserOrders } from "@/lib/firebase/firestore";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await requireApiUser(request);
  const orders = await getUserOrders(user.uid);
  return NextResponse.json({ orders });
}
