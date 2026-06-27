import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { vendorSchema } from "@/lib/validators";
import { createVendor, getVendorPayouts, getVendors } from "@/lib/enterprise";
import { publishSystemEvent } from "@/lib/system-events";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireApiPermission(request, "vendors:manage");
    const [vendors, payouts] = await Promise.all([getVendors(), getVendorPayouts()]);
    return NextResponse.json({ vendors, payouts });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not fetch vendors" }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireApiPermission(request, "vendors:manage");
    const payload = vendorSchema.parse(await request.json());
    const vendor = await createVendor({
      ...payload,
      status: payload.status ?? "pending",
      kycVerified: payload.kycVerified ?? false,
    });

    await publishSystemEvent({
      type: "automation_rule_executed",
      module: "vendors",
      source: "api:admin-vendors",
      actorId: admin.uid,
      payload: {
        action: "vendor_created",
        vendorId: vendor.id,
      },
    });

    return NextResponse.json({ ok: true, vendor });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not create vendor" }, { status: 400 });
  }
}
