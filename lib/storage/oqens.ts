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
  const apiKey = process.env.OQENS_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("OQENS_NOT_CONFIGURED");
  }

  const apiBaseUrl = trimTrailingSlash(process.env.OQENS_API_BASE_URL?.trim() || DEFAULT_OQENS_API_BASE_URL);
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
