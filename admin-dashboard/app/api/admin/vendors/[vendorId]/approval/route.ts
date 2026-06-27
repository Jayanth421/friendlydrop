import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { vendorApprovalSchema } from "@/lib/validators";
import { updateVendorStatus } from "@/lib/enterprise";
import { publishSystemEvent } from "@/lib/system-events";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, { params }: { params: { vendorId: string } }) {
  try {
    const admin = await requireApiPermission(request, "vendors:manage");
    const payload = vendorApprovalSchema.parse(await request.json());
    await updateVendorStatus(params.vendorId, payload.status, payload.note);

    await publishSystemEvent({
      type: "automation_rule_executed",
      module: "vendors",
      source: "api:vendor-approval",
      actorId: admin.uid,
      payload: {
        action: "vendor_status_updated",
        vendorId: params.vendorId,
        status: payload.status,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not update vendor status" }, { status: 400 });
  }
}
