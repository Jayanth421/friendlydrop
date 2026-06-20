export const FIREBASE_STORAGE_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "";
export const OQENS_PUBLIC_CDN_BASE_URL = process.env.NEXT_PUBLIC_OQENS_PUBLIC_CDN_BASE_URL ?? "";

export const MEDIA_FOLDERS = {
  products: "products",
  banners: "banners",
  posters: "posters",
  sliders: "sliders",
  logos: "logos",
  brands: "brands",
  categories: "categories",
  brandAssets: "brand-assets",
  marketing: "marketing",
  blog: "blog",
  pdfs: "pdfs",
  customUploads: "custom-uploads",
  supportChat: "support-chat",
  cms: "cms",
} as const;

export type MediaFolder = (typeof MEDIA_FOLDERS)[keyof typeof MEDIA_FOLDERS];

const KNOWN_MEDIA_FOLDERS = new Set<string>(Object.values(MEDIA_FOLDERS));

export function isAllowedMediaFolder(value: string) {
  return KNOWN_MEDIA_FOLDERS.has(value);
}

export function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
}

export function buildMediaObjectPath(input: { folder: MediaFolder; userId: string; filename: string }) {
  const date = new Date();
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const safeName = sanitizeFilename(input.filename || "file");
  return `${input.folder}/${y}/${m}/${input.userId}/${Date.now()}-${safeName}`;
}

function isAbsoluteUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function encodePathSegments(path: string) {
  return path
    .replace(/^\/+/, "")
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export function extractMediaPathFromUrl(value: string) {
  if (!FIREBASE_STORAGE_BUCKET || !isAbsoluteUrl(value)) {
    return null;
  }

  const prefix = `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_STORAGE_BUCKET}/o/`;
  if (!value.startsWith(prefix)) {
    return null;
  }

  const pathWithQuery = value.slice(prefix.length);
  const [encodedPath] = pathWithQuery.split("?");
  return decodeURIComponent(encodedPath).trim() || null;
}

export function resolveMediaUrl(
  value: string | undefined | null,
  options?: { width?: number; height?: number; quality?: number; format?: "origin" | "webp" | "jpg" | "png" },
) {
  if (!value) {
    return "";
  }

  if (isAbsoluteUrl(value)) {
    return value;
  }

  if (OQENS_PUBLIC_CDN_BASE_URL) {
    return `${trimTrailingSlash(OQENS_PUBLIC_CDN_BASE_URL)}/${encodePathSegments(value)}`;
  }

  if (!FIREBASE_STORAGE_BUCKET) {
    return value;
  }

  return `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_STORAGE_BUCKET}/o/${encodeURIComponent(value.replace(/^\/+/, ""))}?alt=media`;
}

export function normalizeMediaReference(value: string | undefined | null) {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const extractedPath = extractMediaPathFromUrl(trimmed);
  if (extractedPath) {
    return extractedPath;
  }

  return trimmed;
}

export function isMediaPath(value: string) {
  return !isAbsoluteUrl(value) && value.includes("/");
}
