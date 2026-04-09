import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { deleteProduct, getProductById, updateProduct } from "@/lib/firebase/firestore";
import { bulkProductActionSchema } from "@/lib/validators";
import { logAdminActivity, logAdminAudit } from "@/lib/admin/logs";
import { publishSystemEvent } from "@/lib/system-events";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireApiPermission(request, "products:manage");
    const payload = bulkProductActionSchema.parse(await request.json());

    let processed = 0;

    for (const productId of payload.productIds) {
      const product = await getProductById(productId);
      if (!product) {
        continue;
      }

      if (payload.action === "delete") {
        await deleteProduct(productId);
        processed += 1;
        continue;
      }

      if (payload.action === "update_price") {
        const value = payload.value as { price?: number; deltaPercent?: number };
        const price = typeof value?.price === "number" ? value.price : product.price;
        const deltaPercent = typeof value?.deltaPercent === "number" ? value.deltaPercent : 0;
        const nextPrice = Math.max(Math.round(price + (price * deltaPercent) / 100), 1);
        await updateProduct(productId, { price: nextPrice });
        processed += 1;
        continue;
      }

      if (payload.action === "update_discount") {
        const value = payload.value as { discountPercent?: number };
        await updateProduct(productId, { discountPercent: Math.max(Math.min(Number(value?.discountPercent ?? 0), 90), 0) });
        processed += 1;
        continue;
      }

      if (payload.action === "change_category") {
        const value = payload.value as { category?: "photo-prints" | "stickers" | "personalized-gifts"; subcategory?: string };
        if (value?.category) {
          await updateProduct(productId, { category: value.category, subcategory: value.subcategory });
          processed += 1;
        }
        continue;
      }

      if (payload.action === "set_status") {
        const value = payload.value as { status?: "draft" | "published" | "archived"; visibility?: "public" | "private" };
        await updateProduct(productId, {
          status: value?.status ?? product.status ?? "published",
          visibility: value?.visibility ?? product.visibility ?? "public",
        });
        processed += 1;
        continue;
      }

      if (payload.action === "update_stock") {
        const value = payload.value as { stock?: number; mode?: "set" | "increment" };
        const requested = Math.round(Number(value?.stock ?? 0));
        const mode = value?.mode ?? "set";
        const stock = mode === "increment" ? Math.max((product.stock ?? 0) + requested, 0) : Math.max(requested, 0);
        await updateProduct(productId, { stock });
        processed += 1;
      }
    }

    await Promise.all([
      logAdminActivity({
        actorId: admin.uid,
        actorName: admin.name,
        actorRole: admin.role,
        action: `products_bulk_${payload.action}`,
        targetType: "products",
        targetId: `bulk_${processed}`,
        details: {
          requested: payload.productIds.length,
          processed,
        },
      }),
      logAdminAudit({
        actorId: admin.uid,
        actorRole: admin.role,
        module: "products",
        action: payload.action === "delete" ? "delete" : "update",
        after: {
          action: payload.action,
          processed,
        },
      }),
      publishSystemEvent({
        type: "automation_rule_executed",
        module: "catalog",
        source: "api:products-bulk-actions",
        userId: admin.uid,
        payload: {
          action: payload.action,
          processed,
        },
      }),
    ]);

    return NextResponse.json({ ok: true, processed });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Bulk action failed" }, { status: 400 });
  }
}
