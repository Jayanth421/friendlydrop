import { NextRequest, NextResponse } from "next/server";
import { createSlug } from "@/lib/utils";
import { requireApiPermission } from "@/lib/auth/api";
import { createProductsBulk, getMetaAdsConfig, getProducts, syncMetaAdsCatalog } from "@/lib/firebase/firestore";
import { logAdminActivity, logAdminAudit } from "@/lib/admin/logs";
import { bulkImportRowsSchema } from "@/lib/validators";
import { BulkImportValidationError, Product } from "@/types";
import { publishSystemEvent } from "@/lib/system-events";

export const runtime = "nodejs";

const VALID_CATEGORIES: Product["category"][] = ["photo-prints", "stickers", "personalized-gifts"];

function parseList(value: unknown, fallbackSeparator = "|") {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(fallbackSeparator)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseAttributes(value: unknown): Record<string, string> | undefined {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .map(([key, item]) => [key.trim(), String(item).trim()])
        .filter(([key, item]) => key && item),
    );
  }

  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.fromEntries(
        Object.entries(parsed as Record<string, unknown>)
          .map(([key, item]) => [key.trim(), String(item).trim()])
          .filter(([key, item]) => key && item),
      );
    }
  } catch {}

  const parts = value.split("|").map((chunk) => chunk.trim()).filter(Boolean);
  const pairs = parts
    .map((part) => part.split(":").map((token) => token.trim()))
    .filter((tokens) => tokens.length >= 2 && tokens[0] && tokens[1]) as string[][];

  if (!pairs.length) {
    return undefined;
  }

  return Object.fromEntries(pairs.map(([key, val]) => [key, val]));
}

function normalizeCategory(value: unknown): Product["category"] | null {
  const category = String(value ?? "").trim().toLowerCase() as Product["category"];
  if (!VALID_CATEGORIES.includes(category)) {
    return null;
  }
  return category;
}

function toOptionalString(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : undefined;
}

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeRow(row: Record<string, unknown>) {
  const category = normalizeCategory(row.category);
  const name = String(row.name ?? "").trim();

  return {
    name,
    description: String(row.description ?? "").trim(),
    price: toNumber(row.price, 0),
    discountPercent: toNumber(row.discountPercent, 0),
    images: parseList(row.images),
    category,
    subcategory: toOptionalString(row.subcategory),
    stock: Math.max(Math.round(toNumber(row.stock, 0)), 0),
    sku: toOptionalString(row.sku),
    weightGrams: Math.max(toNumber(row.weightGrams, 500), 0),
    brand: toOptionalString(row.brand),
    attributes: parseAttributes(row.attributes),
    tags: parseList(row.tags),
    featured: String(row.featured ?? "").toLowerCase() === "true",
    popularity: Math.max(Math.round(toNumber(row.popularity, 50)), 0),
    status: (String(row.status ?? "published").toLowerCase() as "draft" | "published" | "archived"),
    visibility: (String(row.visibility ?? "public").toLowerCase() as "public" | "private"),
    seo: {
      metaTitle: toOptionalString(row.metaTitle),
      metaDescription: toOptionalString(row.metaDescription),
      imageAlt: toOptionalString(row.imageAlt),
      canonicalUrl: toOptionalString(row.canonicalUrl),
      keywords: parseList(row.keywords),
      noindex: String(row.noindex ?? "").toLowerCase() === "true",
      nofollow: String(row.nofollow ?? "").toLowerCase() === "true",
    },
    slug: createSlug(name),
    rating: 0,
    reviewCount: 0,
  };
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireApiPermission(request, "products:manage");
    const payload = bulkImportRowsSchema.parse(await request.json());
    const rows = payload.rows as Array<Record<string, unknown>>;

    const existingProducts = await getProducts();
    const existingSkuSet = new Set(existingProducts.map((product) => product.sku?.toLowerCase()).filter(Boolean));
    const seenInFile = new Set<string>();
    const errors: BulkImportValidationError[] = [];
    const validRows: Array<Omit<Product, "id" | "createdAt">> = [];

    rows.forEach((rawRow, index) => {
      const rowNumber = index + 2;
      const row = normalizeRow(rawRow);
      const beforeRowErrors = errors.length;

      if (!row.name) {
        errors.push({ row: rowNumber, field: "name", code: "missing", message: "Product name is required" });
      }

      if (!row.description) {
        errors.push({ row: rowNumber, field: "description", code: "missing", message: "Description is required" });
      }

      if (row.price <= 0) {
        errors.push({ row: rowNumber, field: "price", code: "invalid_value", message: "Price must be greater than 0" });
      }

      if (!row.images.length) {
        errors.push({ row: rowNumber, field: "images", code: "missing", message: "At least one image URL is required" });
      }

      if (!row.category) {
        errors.push({
          row: rowNumber,
          field: "category",
          code: "invalid_category",
          message: `Category must be one of: ${VALID_CATEGORIES.join(", ")}`,
        });
      }

      if (row.sku) {
        const normalizedSku = row.sku.toLowerCase();
        if (existingSkuSet.has(normalizedSku)) {
          errors.push({ row: rowNumber, field: "sku", code: "duplicate_sku", message: `SKU already exists: ${row.sku}` });
        }

        if (seenInFile.has(normalizedSku)) {
          errors.push({ row: rowNumber, field: "sku", code: "duplicate_sku", message: `Duplicate SKU in file: ${row.sku}` });
        }

        seenInFile.add(normalizedSku);
      }

      if (row.status && !["draft", "published", "archived"].includes(row.status)) {
        errors.push({
          row: rowNumber,
          field: "status",
          code: "invalid_value",
          message: "Status must be draft, published, or archived",
        });
      }

      if (row.visibility && !["public", "private"].includes(row.visibility)) {
        errors.push({
          row: rowNumber,
          field: "visibility",
          code: "invalid_value",
          message: "Visibility must be public or private",
        });
      }

      const hasRowErrors = errors.length > beforeRowErrors;
      if (!hasRowErrors && row.category && row.name && row.description && row.price > 0 && row.images.length) {
        validRows.push({
          ...row,
          category: row.category,
        });
      }
    });

    if (payload.dryRun) {
      return NextResponse.json({
        ok: true,
        dryRun: true,
        validCount: validRows.length,
        invalidCount: errors.length,
        errors,
        preview: validRows.slice(0, 25),
      });
    }

    if (errors.length && !payload.forceImport) {
      return NextResponse.json(
        {
          ok: false,
          error: "Validation failed. Fix errors or import with forceImport=true.",
          validCount: validRows.length,
          invalidCount: errors.length,
          errors,
        },
        { status: 422 },
      );
    }

    if (!validRows.length) {
      return NextResponse.json({ error: "No valid rows to import", errors }, { status: 400 });
    }

    const created = await createProductsBulk(validRows);
    const metaConfig = await getMetaAdsConfig().catch(() => null);
    const shouldSyncMetaCatalog = Boolean(metaConfig?.connected && metaConfig.syncEnabled && created.length);
    const metaSyncResult = shouldSyncMetaCatalog
      ? await syncMetaAdsCatalog(created.map((product) => product.id)).catch(() => null)
      : null;

    await Promise.all([
      logAdminActivity({
        actorId: admin.uid,
        actorName: admin.name,
        actorRole: admin.role,
        action: "products_bulk_created",
        targetType: "products",
        targetId: `bulk_${created.length}`,
        details: {
          sourceRows: rows.length,
          importedRows: created.length,
          skippedRows: rows.length - created.length,
          validationErrors: errors.length,
          metaCatalogSynced: shouldSyncMetaCatalog,
          metaCatalogSyncCount: metaSyncResult?.synced ?? 0,
        },
      }),
      logAdminAudit({
        actorId: admin.uid,
        actorRole: admin.role,
        module: "products",
        action: "create",
        after: { count: created.length, validationErrors: errors.length },
      }),
      publishSystemEvent({
        type: "automation_rule_executed",
        module: "catalog",
        source: "api:products-bulk-import",
        userId: admin.uid,
        payload: {
          importedProducts: created.length,
          validationErrors: errors.length,
          inventorySyncTriggered: true,
          metaCatalogSyncTriggered: shouldSyncMetaCatalog,
          metaCatalogSyncCount: metaSyncResult?.synced ?? 0,
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      createdCount: created.length,
      validCount: validRows.length,
      invalidCount: errors.length,
      errors,
      metaCatalogSync: metaSyncResult,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Bulk upload failed" }, { status: 400 });
  }
}
