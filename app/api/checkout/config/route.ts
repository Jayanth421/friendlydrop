import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { getStoreSettings, getUserById } from "@/lib/firebase/firestore";
import { evaluateCheckoutControls } from "@/lib/settings-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    const params = request.nextUrl.searchParams;
    const subtotal = Number(params.get("subtotal") ?? 0);
    const postalCode = params.get("postalCode") ?? undefined;
    const city = params.get("city") ?? undefined;
    const speed = params.get("speed") === "express" ? "express" : "standard";
    const settings = await getStoreSettings();
    const profile = await getUserById(user.uid);
    const controls = evaluateCheckoutControls(settings, {
      subtotal: Number.isFinite(subtotal) ? subtotal : 0,
      postalCode,
      city,
      speed,
      customerSegment: profile?.segment,
      isFirstOrder: (profile?.orderCount ?? 0) === 0,
    });

    return NextResponse.json({
      config: {
        taxRate: controls.taxRate,
        deliveryFee: controls.delivery.fee,
        delivery: controls.delivery,
        payments: controls.payments,
        operations: controls.operations,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not fetch checkout config" }, { status: 400 });
  }
}
