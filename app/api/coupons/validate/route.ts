import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { couponValidationSchema } from "@/lib/validators";
import { getCouponByCode } from "@/lib/firebase/firestore";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await requireApiUser(request);
    const body = (await request.json()) as { code?: string; total?: number };
    const parsed = couponValidationSchema.parse({ code: body.code });
    const total = Number(body.total ?? 0);

    const coupon = await getCouponByCode(parsed.code);

    if (!coupon || !coupon.active) {
      return NextResponse.json({ error: "Invalid coupon" }, { status: 404 });
    }

    const isExpired = coupon.expiresAt ? new Date(coupon.expiresAt).getTime() < Date.now() : false;

    if (isExpired) {
      return NextResponse.json({ error: "Coupon expired" }, { status: 400 });
    }

    const rawDiscountAmount = coupon.type === "percent" ? Math.round((total * coupon.value) / 100) : coupon.value;
    const discountAmount = Math.min(Math.max(rawDiscountAmount, 0), Math.max(total, 0));

    return NextResponse.json({
      ok: true,
      discountAmount,
      totalAfterDiscount: Math.max(total - discountAmount, 0),
      coupon,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
