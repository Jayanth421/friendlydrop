import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createProductsBulk, upsertProductsBySkuBulk } from "@/lib/firebase/firestore";
import { normalizeQikinkPayload } from "@/lib/integrations/qikink";
import { ProductStatus, ProductVisibility } from "@/types";

export const runtime = "nodejs";

const webhookBodySchema = z.object({
  mode: z.enum(["upsert", "create"]).default("upsert"),
  status: z.enum(["draft", "published", "archived"]).optional(),
  visibility: z.enum(["public", "private"]).optional(),
  payload: z.unknown().optional(),
  products: z.array(z.unknown()).optional(),
});

function mapStatus(status?: string) {
  return status as ProductStatus | undefined;
}

function mapVisibility(visibility?: string) {
  return visibility as ProductVisibility | undefined;
}

function getWebhookToken(request: NextRequest) {
  const bearer = request.headers.get("authorization");
  if (bearer?.toLowerCase().startsWith("bearer ")) {
    return bearer.slice(7).trim();
  }

  return request.headers.get("x-qikink-webhook-secret") ?? request.headers.get("x-webhook-secret");
}

export async function POST(request: NextRequest) {
  try {
    const configuredSecret = process.env.QIKINK_WEBHOOK_SECRET?.trim();

    if (!configuredSecret) {
      return NextResponse.json({ error: "QIKINK_WEBHOOK_SECRET is not configured" }, { status: 503 });
    }

    const incomingSecret = getWebhookToken(request);
    if (!incomingSecret || incomingSecret !== configuredSecret) {
      return NextResponse.json({ error: "Unauthorized webhook" }, { status: 401 });
    }

    const body = (await request.json()) as unknown;
    const parsed = webhookBodySchema.safeParse(body);

    const mode = parsed.success ? parsed.data.mode : "upsert";
    const status = parsed.success ? mapStatus(parsed.data.status) : undefined;
    const visibility = parsed.success ? mapVisibility(parsed.data.visibility) : undefined;
    const sourcePayload = parsed.success
      ? parsed.data.payload ?? (parsed.data.products ? { products: parsed.data.products } : body)
      : body;

    const normalized = normalizeQikinkPayload(sourcePayload, { status, visibility });

    if (!normalized.products.length) {
      return NextResponse.json({
        ok: true,
        sourceCount: normalized.sourceCount,
        createdCount: 0,
        updatedCount: 0,
        skippedCount: normalized.skippedCount,
        warnings: normalized.warnings,
      });
    }

    const result =
      mode === "create"
        ? {
            created: await createProductsBulk(normalized.products),
            updated: [],
          }
        : await upsertProductsBySkuBulk(normalized.products);

    return NextResponse.json({
      ok: true,
      sourceCount: normalized.sourceCount,
      createdCount: result.created.length,
      updatedCount: result.updated.length,
      skippedCount: normalized.skippedCount,
      warnings: normalized.warnings,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Qikink webhook import failed" }, { status: 400 });
  }
}
