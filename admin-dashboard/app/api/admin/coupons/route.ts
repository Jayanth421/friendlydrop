import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { couponSchema } from "@/lib/validators";
import { createCoupon, getCoupons } from "@/lib/firebase/firestore";
import { logAdminActivity } from "@/lib/admin/logs";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  await requireApiPermission(request, "coupons:manage");
  const coupons = await getCoupons();
  return NextResponse.json({ coupons });
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireApiPermission(request, "coupons:manage");
    const payload = couponSchema.parse(await request.json());

    const coupon = await createCoupon({
      ...payload,
      createdAt: new Date().toISOString(),
    });

    await logAdminActivity({
      actorId: admin.uid,
      actorName: admin.name,
      actorRole: admin.role,
      action: "coupon_created",
      targetType: "coupon",
      targetId: coupon.id,
    });

    return NextResponse.json({ ok: true, coupon });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not create coupon" }, { status: 400 });
  }
}

