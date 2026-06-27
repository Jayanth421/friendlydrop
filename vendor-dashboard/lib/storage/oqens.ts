const DEFAULT_OQENS_API_BASE_URL = "https://echo.oqens.me";

type OqensUploadResponse = {
  key?: string;
  url?: string;
  publicUrl?: string;
  cdnUrl?: string;
  downloadUrl?: string;
  file?: {
    key?: string;
    url?: string;
    publicUrl?: string;
    cdnUrl?: string;
    downloadUrl?: string;
  };
};

export type OqensFile = {
  key: string;
  name: string;
  sizeBytes?: number;
  contentType?: string;
  publicUrl: string;
  previewUrl: string;
  updatedAt?: string;
};

type OqensListedItem =
  | string
  | { key?: string; name?: string; size?: number; sizeBytes?: number; contentType?: string; type?: string; url?: string; publicUrl?: string; cdnUrl?: string; updatedAt?: string; lastModified?: string };

type OqensListResponse =
  | Array<OqensListedItem>
  | {
      files?: OqensListedItem[];
      data?: OqensListedItem[];
    };

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

export function isOqensStorageConfigured() {
  return Boolean(process.env.OQENS_API_KEY?.trim());
}

export function getOqensPublicUrl(key: string) {
  const cdnBaseUrl =
    process.env.OQENS_PUBLIC_CDN_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_OQENS_PUBLIC_CDN_BASE_URL?.trim() ||
    "";

  if (!cdnBaseUrl) {
    return "";
  }

  return `${trimTrailingSlash(cdnBaseUrl)}/${encodePathSegments(key)}`;
}

function getOqensApiConfig() {
  const apiKey = process.env.OQENS_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("OQENS_NOT_CONFIGURED");
  }

  return {
    apiKey,
    apiBaseUrl: trimTrailingSlash(process.env.OQENS_API_BASE_URL?.trim() || DEFAULT_OQENS_API_BASE_URL),
  };
}

function pickPublicUrl(payload: OqensUploadResponse, key: string) {
  return (
    payload.publicUrl ||
    payload.cdnUrl ||
    payload.url ||
    payload.downloadUrl ||
    payload.file?.publicUrl ||
    payload.file?.cdnUrl ||
    payload.file?.url ||
    payload.file?.downloadUrl ||
    getOqensPublicUrl(key)
  );
}

export async function uploadFileToOqens(input: {
  file: File;
  key: string;
  contentType: string;
}) {
  const { apiKey, apiBaseUrl } = getOqensApiConfig();
  const formData = new FormData();
  formData.append("file", input.file, input.key);

  const response = await fetch(`${apiBaseUrl}/api/bucket/upload`, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
    },
    body: formData,
  });

  const text = await response.text();
  let payload: OqensUploadResponse = {};

  if (text) {
    try {
      payload = JSON.parse(text) as OqensUploadResponse;
    } catch {
      payload = {};
    }
  }

  if (!response.ok) {
    throw new Error(text || `Oqens upload failed with status ${response.status}`);
  }

  const key = payload.key || payload.file?.key || input.key;
  const publicUrl = pickPublicUrl(payload, key);

  if (!publicUrl) {
    throw new Error("OQENS_PUBLIC_URL_NOT_CONFIGURED");
  }

  return {
    key,
    publicUrl,
    response: payload,
  };
}

function normalizeListedFile(item: OqensListedItem): OqensFile | null {
  const key = typeof item === "string" ? item : item.key || item.name || "";

  if (!key) {
    return null;
  }

  const publicUrl =
    typeof item === "string"
      ? getOqensPublicUrl(key)
      : item.publicUrl || item.cdnUrl || item.url || getOqensPublicUrl(key);

  if (!publicUrl) {
    return null;
  }

  const fileName = key.split("/").pop() || key;
  const contentType = typeof item === "string" ? undefined : item.contentType || item.type;

  return {
    key,
    name: fileName,
    sizeBytes: typeof item === "string" ? undefined : item.sizeBytes ?? item.size,
    contentType,
    publicUrl,
    previewUrl: `${publicUrl}${publicUrl.includes("?") ? "&" : "?"}preview=true`,
    updatedAt: typeof item === "string" ? undefined : item.updatedAt || item.lastModified,
  };
}

export async function listOqensFiles() {
  const { apiKey, apiBaseUrl } = getOqensApiConfig();
  const response = await fetch(`${apiBaseUrl}/api/bucket/list`, {
    method: "GET",
    headers: {
      "X-API-Key": apiKey,
    },
    cache: "no-store",
  });

  const text = await response.text();
  let payload: OqensListResponse = [];

  if (text) {
    try {
      payload = JSON.parse(text) as OqensListResponse;
    } catch {
      payload = [];
    }
  }

  if (!response.ok) {
    throw new Error(text || `Oqens list failed with status ${response.status}`);
  }

  const files = Array.isArray(payload) ? payload : payload.files || payload.data || [];
  return files.map(normalizeListedFile).filter(Boolean) as OqensFile[];
}

export async function deleteOqensFile(key: string) {
  const { apiKey, apiBaseUrl } = getOqensApiConfig();
  const response = await fetch(`${apiBaseUrl}/api/bucket/delete`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify({ key }),
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || `Oqens delete failed with status ${response.status}`);
  }

  return { ok: true };
}
