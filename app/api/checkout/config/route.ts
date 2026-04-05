import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { getStoreSettings } from "@/lib/firebase/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireApiUser(request);
    const settings = await getStoreSettings();

    return NextResponse.json({
      config: {
        taxRate: settings.taxRate,
        deliveryFee: settings.deliveryFee,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not fetch checkout config" }, { status: 400 });
  }
}
