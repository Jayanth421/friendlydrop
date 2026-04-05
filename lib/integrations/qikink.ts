import { createSlug } from "@/lib/utils";
import { Product, ProductCategory, ProductStatus, ProductVariant } from "@/types";

type ProductDraft = Omit<Product, "id" | "createdAt">;

const DEFAULT_DESCRIPTION = "Custom print-on-demand product imported from Qikink.";
const DEFAULT_STATUS: ProductStatus = "published";
const DEFAULT_CATEGORY: ProductCategory = "personalized-gifts";

interface QikinkFetchOptions {
  limit?: number;
  page?: number;
}

interface QikinkNormalizeOptions {
  status?: ProductStatus;
  visibility?: "public" | "private";
}

interface QikinkImportOptions extends QikinkFetchOptions, QikinkNormalizeOptions {}

export interface QikinkImportPayload {
  sourceCount: number;
  products: ProductDraft[];
  skippedCount: number;
  warnings: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toValidUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

function getString(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function getNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function pickFirstString(data: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = getString(data[key]);
    if (value) {
      return value;
    }
  }
  return undefined;
}

function pickFirstNumber(data: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = getNumber(data[key]);
    if (typeof value === "number") {
      return value;
    }
  }
  return undefined;
}

function extractStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }
        if (isRecord(item)) {
          return pickFirstString(item, ["url", "src", "image", "image_url", "thumbnail"]);
        }
        return undefined;
      })
      .filter((item): item is string => Boolean(item));
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function extractImages(product: Record<string, unknown>) {
  const images = [
    ...extractStringArray(product.images),
    ...extractStringArray(product.image_urls),
    ...extractStringArray(product.gallery),
    ...extractStringArray(product.mockups),
    ...extractStringArray(product.mockup_images),
    ...extractStringArray(product.thumbnails),
  ];

  const singleImage = pickFirstString(product, ["image", "image_url", "thumbnail", "featured_image"]);

  if (singleImage) {
    images.push(singleImage);
  }

  return Array.from(new Set(images.map((item) => toValidUrl(item)).filter((item): item is string => Boolean(item))));
}

function mapCategory(input: string | undefined): ProductCategory {
  if (!input) {
    return DEFAULT_CATEGORY;
  }

  const normalized = input.toLowerCase();

  if (normalized.includes("sticker")) {
    return "stickers";
  }

  if (
    normalized.includes("print") ||
    normalized.includes("poster") ||
    normalized.includes("photo") ||
    normalized.includes("canvas")
  ) {
    return "photo-prints";
  }

  return "personalized-gifts";
}

function normalizeDescription(name: string, description?: string) {
  const value = description?.trim() || DEFAULT_DESCRIPTION;
  if (value.length >= 10) {
    return value;
  }
  return `${name} - ${DEFAULT_DESCRIPTION}`;
}

function normalizeTags(product: Record<string, unknown>) {
  const tags = extractStringArray(product.tags).map((tag) => tag.toLowerCase().trim()).filter(Boolean);
  if (!tags.includes("qikink")) {
    tags.push("qikink");
  }
  return Array.from(new Set(tags));
}

function normalizeVariants(product: Record<string, unknown>) {
  const variants = product.variants;

  if (!Array.isArray(variants)) {
    return undefined;
  }

  const mapped = variants
    .map<ProductVariant | null>((variant, index) => {
      if (!isRecord(variant)) {
        return null;
      }

      const sku = pickFirstString(variant, ["sku", "variant_sku", "id"]);
      const price = pickFirstNumber(variant, ["price", "selling_price", "mrp"]) ?? 0;
      const stock = Math.max(0, Math.floor(pickFirstNumber(variant, ["stock", "inventory", "quantity"]) ?? 0));

      if (!sku || price <= 0) {
        return null;
      }

      const size = pickFirstString(variant, ["size"]);
      const type = pickFirstString(variant, ["type", "color"]);
      const material = pickFirstString(variant, ["material"]);

      return {
        id: pickFirstString(variant, ["id", "variant_id"]) ?? `${sku}-${index}`,
        sku,
        price,
        stock,
        ...(size ? { size } : {}),
        ...(type ? { type } : {}),
        ...(material ? { material } : {}),
      };
    })
    .filter((variant): variant is ProductVariant => variant !== null);

  return mapped.length ? mapped : undefined;
}

function resolveQikinkProducts(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isRecord(payload)) {
    return [];
  }

  const directCandidates = [payload.products, payload.items, payload.data, payload.result];
  for (const candidate of directCandidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  const nestedCandidates = [payload.data, payload.result, payload.response];
  for (const candidate of nestedCandidates) {
    if (!isRecord(candidate)) {
      continue;
    }

    if (Array.isArray(candidate.products)) {
      return candidate.products;
    }

    if (Array.isArray(candidate.items)) {
      return candidate.items;
    }

    if (isRecord(candidate.data) && Array.isArray(candidate.data.products)) {
      return candidate.data.products;
    }
  }

  return [];
}

function getProductsEndpoint(options: QikinkFetchOptions) {
  const fullEndpoint = getString(process.env.QIKINK_PRODUCTS_ENDPOINT);
  const baseUrl = getString(process.env.QIKINK_API_BASE_URL);
  const productsPath = getString(process.env.QIKINK_PRODUCTS_PATH) ?? "/api/products";

  if (!fullEndpoint && !baseUrl) {
    throw new Error("QIKINK API is not configured. Set QIKINK_PRODUCTS_ENDPOINT or QIKINK_API_BASE_URL.");
  }

  const url = fullEndpoint ? new URL(fullEndpoint) : new URL(productsPath, `${baseUrl}/`);
  const storeId = getString(process.env.QIKINK_STORE_ID);
  const limitParam = getString(process.env.QIKINK_LIMIT_PARAM) ?? "limit";
  const pageParam = getString(process.env.QIKINK_PAGE_PARAM) ?? "page";

  if (typeof options.limit === "number") {
    url.searchParams.set(limitParam, String(options.limit));
  }

  if (typeof options.page === "number") {
    url.searchParams.set(pageParam, String(options.page));
  }

  if (storeId) {
    url.searchParams.set("store_id", storeId);
  }

  return url;
}

function getQikinkHeaders() {
  const bearer = getString(process.env.QIKINK_BEARER_TOKEN);
  const apiKey = getString(process.env.QIKINK_API_KEY);
  const apiSecret = getString(process.env.QIKINK_API_SECRET);

  if (!bearer && !apiKey) {
    throw new Error("QIKINK credentials are missing. Set QIKINK_BEARER_TOKEN or QIKINK_API_KEY.");
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (bearer) {
    headers.Authorization = `Bearer ${bearer}`;
  }

  if (apiKey) {
    headers["X-API-Key"] = apiKey;
    headers["x-api-key"] = apiKey;
    headers.apikey = apiKey;
  }

  if (apiSecret) {
    headers["X-API-Secret"] = apiSecret;
    headers["x-api-secret"] = apiSecret;
  }

  return headers;
}

function mapQikinkProduct(raw: unknown, options: QikinkNormalizeOptions): ProductDraft | null {
  if (!isRecord(raw)) {
    return null;
  }

  const name = pickFirstString(raw, ["name", "title", "product_name"]);
  const externalId = pickFirstString(raw, ["id", "product_id", "productId", "external_id"]);
  const sku = pickFirstString(raw, ["sku", "product_sku"]) ?? (externalId ? `qikink-${externalId}` : undefined);
  const images = extractImages(raw);

  if (!name || !images.length) {
    return null;
  }

  const price = pickFirstNumber(raw, ["selling_price", "price", "mrp", "base_price"]) ?? 1;
  const stock = Math.max(0, Math.floor(pickFirstNumber(raw, ["stock", "inventory", "quantity"]) ?? 0));
  const categorySource = pickFirstString(raw, ["category", "product_type", "type"]);
  const category = mapCategory(categorySource);

  return {
    name,
    slug: createSlug(name),
    description: normalizeDescription(name, pickFirstString(raw, ["description", "short_description", "details"])),
    price: Math.max(1, price),
    images,
    category,
    subcategory: pickFirstString(raw, ["subcategory", "sub_category"]),
    stock,
    sku,
    variants: normalizeVariants(raw),
    tags: normalizeTags(raw),
    featured: false,
    popularity: 40,
    status: options.status ?? DEFAULT_STATUS,
    visibility: options.visibility ?? "public",
    seo: {
      metaTitle: name,
      metaDescription: pickFirstString(raw, ["short_description", "description"]) ?? undefined,
    },
    rating: 0,
    reviewCount: 0,
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeQikinkPayload(payload: unknown, options: QikinkNormalizeOptions = {}): QikinkImportPayload {
  const rawProducts = resolveQikinkProducts(payload);
  const products = rawProducts
    .map((rawProduct) => mapQikinkProduct(rawProduct, options))
    .filter((item): item is ProductDraft => Boolean(item));

  const warnings: string[] = [];
  if (!rawProducts.length) {
    warnings.push("No product list found in Qikink response. Check QIKINK_PRODUCTS_ENDPOINT/QIKINK_PRODUCTS_PATH.");
  }

  if (rawProducts.length && !products.length) {
    warnings.push("Qikink products were returned but none matched required fields (name + image).");
  }

  return {
    sourceCount: rawProducts.length,
    products,
    skippedCount: Math.max(0, rawProducts.length - products.length),
    warnings,
  };
}

export async function getQikinkProductsForImport(options: QikinkImportOptions = {}): Promise<QikinkImportPayload> {
  const endpoint = getProductsEndpoint(options);
  const timeoutMs = Math.max(2000, Number(process.env.QIKINK_TIMEOUT_MS ?? 15000));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;

  try {
    response = await fetch(endpoint.toString(), {
      method: "GET",
      headers: getQikinkHeaders(),
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`QIKINK_PRODUCTS_FETCH_FAILED (${response.status}): ${message.slice(0, 240)}`);
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw new Error("QIKINK_PRODUCTS_INVALID_RESPONSE: expected JSON payload");
  }

  return normalizeQikinkPayload(payload, options);
}
