import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiPermission } from "@/lib/auth/api";
import { createProductsBulk, upsertProductsBySkuBulk } from "@/lib/firebase/firestore";
import { getQikinkProductsForImport } from "@/lib/integrations/qikink";
import { logAdminActivity, logAdminAudit } from "@/lib/admin/logs";
import { ProductStatus, ProductVisibility } from "@/types";

export const runtime = "nodejs";

const qikinkImportSchema = z.object({
  mode: z.enum(["upsert", "create"]).default("upsert"),
  limit: z.number().int().min(1).max(400).default(120),
  page: z.number().int().min(1).default(1),
  status: z.enum(["draft", "published", "archived"]).optional(),
  visibility: z.enum(["public", "private"]).optional(),
});

function mapStatus(status?: string) {
  return status as ProductStatus | undefined;
}

function mapVisibility(visibility?: string) {
  return visibility as ProductVisibility | undefined;
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireApiPermission(request, "products:manage");
    const rawBody = await request.text();
    const body = rawBody ? JSON.parse(rawBody) : {};
    const input = qikinkImportSchema.parse(body);

    const qikink = await getQikinkProductsForImport({
      limit: input.limit,
      page: input.page,
      status: mapStatus(input.status),
      visibility: mapVisibility(input.visibility),
    });

    if (!qikink.products.length) {
      return NextResponse.json({
        ok: true,
        createdCount: 0,
        updatedCount: 0,
        sourceCount: qikink.sourceCount,
        skippedCount: qikink.skippedCount,
        warnings: qikink.warnings,
      });
    }

    const result =
      input.mode === "create"
        ? {
            created: await createProductsBulk(qikink.products),
            updated: [],
          }
        : await upsertProductsBySkuBulk(qikink.products);

    await Promise.all([
      logAdminActivity({
        actorId: admin.uid,
        actorName: admin.name,
        actorRole: admin.role,
        action: "products_imported_from_qikink",
        targetType: "products",
        targetId: `qikink_${result.created.length}_${result.updated.length}`,
        details: {
          mode: input.mode,
          sourceCount: qikink.sourceCount,
          createdCount: result.created.length,
          updatedCount: result.updated.length,
          skippedCount: qikink.skippedCount,
        },
      }),
      logAdminAudit({
        actorId: admin.uid,
        actorRole: admin.role,
        module: "products",
        action: result.updated.length > 0 ? "update" : "create",
        after: {
          provider: "qikink",
          mode: input.mode,
          sourceCount: qikink.sourceCount,
          createdCount: result.created.length,
          updatedCount: result.updated.length,
          skippedCount: qikink.skippedCount,
          warnings: qikink.warnings,
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      sourceCount: qikink.sourceCount,
      createdCount: result.created.length,
      updatedCount: result.updated.length,
      skippedCount: qikink.skippedCount,
      warnings: qikink.warnings,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Qikink import failed" }, { status: 400 });
  }
}
