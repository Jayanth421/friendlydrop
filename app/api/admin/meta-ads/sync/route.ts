import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiPermission } from "@/lib/auth/api";
import { getProducts, syncMetaAdsCatalog } from "@/lib/firebase/firestore";
import { publishSystemEvent } from "@/lib/system-events";

const syncPayloadSchema = z.object({
  productIds: z.array(z.string()).optional(),
});

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireApiPermission(request, "marketing:manage");
    const payload = syncPayloadSchema.parse(await request.json().catch(() => ({})));
    const products = await getProducts();
    const requestedIds = payload.productIds?.length ? payload.productIds : products.map((product) => product.id);

    const syncResult = await syncMetaAdsCatalog(requestedIds);

    await publishSystemEvent({
      type: "automation_rule_executed",
      module: "marketing",
      source: "api:meta-ads-sync",
      actorId: admin.uid,
      payload: {
        syncedProducts: syncResult.synced,
        failedProducts: syncResult.failed,
        lastSyncAt: syncResult.lastSyncAt,
      },
    });

    return NextResponse.json({ ok: true, ...syncResult });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Meta Ads catalog sync failed" }, { status: 400 });
  }
}
