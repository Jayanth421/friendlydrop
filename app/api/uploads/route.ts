import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { getUploadByChecksum, saveUploadRecord } from "@/lib/firebase/firestore";
import { getAdminStorage } from "@/lib/firebase/admin";
import {
  buildMediaObjectPath,
  isAllowedMediaFolder,
  MediaFolder,
  MEDIA_FOLDERS,
} from "@/lib/media";
import { isOqensStorageConfigured, uploadFileToOqens } from "@/lib/storage/oqens";
import { beginIdempotentRequest, completeIdempotentRequest, failIdempotentRequest } from "@/lib/security/idempotency";
import { assertRateLimit, buildRateLimitKey } from "@/lib/security/rate-limit";
import { assertTrustedMutationRequest, toGuardErrorResponse } from "@/lib/security/request-guards";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 40 * 1024 * 1024;
const MAX_DOC_BYTES = 12 * 1024 * 1024;
const MAX_ZIP_BYTES = 100 * 1024 * 1024;

function isJsonRequest(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  return contentType.includes("application/json");
}

function isZipUpload(file: File, contentType: string) {
  const lowerName = file.name.toLowerCase();
  return (
    contentType === "application/zip" ||
    contentType === "application/x-zip-compressed" ||
    lowerName.endsWith(".zip")
  );
}

function getUploadLimit(contentType: string, file?: File) {
  if (file && isZipUpload(file, contentType)) {
    return MAX_ZIP_BYTES;
  }
  if (contentType.startsWith("image/")) {
    return MAX_IMAGE_BYTES;
  }
  if (contentType.startsWith("video/")) {
    return MAX_VIDEO_BYTES;
  }
  return MAX_DOC_BYTES;
}

function isSupportedContentType(contentType: string, file?: File) {
  if (file && isZipUpload(file, contentType)) {
    return true;
  }

  return (
    contentType.startsWith("image/") ||
    contentType.startsWith("video/") ||
    contentType === "application/pdf" ||
    contentType.startsWith("text/")
  );
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    assertTrustedMutationRequest(request);
    assertRateLimit({
      key: buildRateLimitKey({ request, scope: "uploads:post", actorId: user.uid }),
      max: 20,
      windowMs: 60_000,
    });

    if (isJsonRequest(request)) {
      const { imageUrl } = (await request.json()) as { imageUrl?: string };

      if (!imageUrl) {
        return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
      }

      await saveUploadRecord({
        userId: user.uid,
        imageUrl,
        storageProvider: "oqens",
        processingState: "uploaded",
      });
      return NextResponse.json({ ok: true, imageUrl });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const folder = String(formData.get("folder") ?? MEDIA_FOLDERS.products).trim() || MEDIA_FOLDERS.products;
    const shouldRecord = String(formData.get("record") ?? "false").toLowerCase() === "true";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    if (!isAllowedMediaFolder(folder)) {
      return NextResponse.json(
        {
          error: "Unsupported folder",
          supportedFolders: Object.values(MEDIA_FOLDERS),
        },
        { status: 400 },
      );
    }

    const contentType = file.type || "application/octet-stream";
    if (!isSupportedContentType(contentType, file)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    const maxBytes = getUploadLimit(contentType, file);
    if (file.size > maxBytes) {
      return NextResponse.json({ error: `File exceeds max size (${Math.round(maxBytes / (1024 * 1024))}MB)` }, { status: 400 });
    }

    const objectPath = buildMediaObjectPath({
      folder: folder as MediaFolder,
      userId: user.uid,
      filename: file.name || "file",
    });
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const checksumSha256 = crypto.createHash("sha256").update(bytes).digest("hex");
    const existingUpload = await getUploadByChecksum(checksumSha256, user.uid);

    if (existingUpload?.imageUrl) {
      return NextResponse.json({
        ok: true,
        imageUrl: existingUpload.imageUrl,
        mediaUrl: existingUpload.imageUrl,
        path: existingUpload.imageUrl,
        objectPath: existingUpload.path,
        contentType: existingUpload.contentType ?? contentType,
        sizeBytes: existingUpload.sizeBytes ?? file.size,
        checksumSha256,
        deduplicated: true,
        duplicateOfUploadId: existingUpload.id,
      });
    }

    const uploadIdempotency = await beginIdempotentRequest({
      scope: "uploads:create",
      actorId: user.uid,
      key: request.headers.get("Idempotency-Key"),
    });

    if (uploadIdempotency.mode === "replay") {
      return NextResponse.json(uploadIdempotency.responseBody, { status: uploadIdempotency.responseStatus });
    }

    if (uploadIdempotency.mode === "in_progress") {
      return NextResponse.json({ error: "Upload already in progress for this request" }, { status: 409 });
    }

    try {
      let mediaUrl: string;
      let storedObjectPath = objectPath;
      let storageProvider: "firebase" | "oqens" = "firebase";

      if (isOqensStorageConfigured()) {
        const upload = await uploadFileToOqens({
          file,
          key: objectPath,
          contentType,
        });
        mediaUrl = upload.publicUrl;
        storedObjectPath = upload.key;
        storageProvider = "oqens";
      } else {
        const bucket = getAdminStorage().bucket();
        const fileRef = bucket.file(objectPath);
        await fileRef.save(Buffer.from(bytes), {
          metadata: {
            contentType,
          },
          public: true,
        });
        mediaUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(objectPath)}?alt=media`;
      }

      if (shouldRecord) {
        await saveUploadRecord({
          userId: user.uid,
          imageUrl: mediaUrl,
          path: storedObjectPath,
          folder,
          contentType,
          sizeBytes: file.size,
          checksumSha256,
          storageProvider,
          processingState: "queued",
        });
      }

      const responseBody = {
        ok: true,
        imageUrl: mediaUrl,
        mediaUrl,
        path: storageProvider === "oqens" ? mediaUrl : storedObjectPath,
        objectPath: storedObjectPath,
        contentType,
        sizeBytes: file.size,
        checksumSha256,
        deduplicated: false,
      };

      await completeIdempotentRequest({
        scope: "uploads:create",
        actorId: user.uid,
        key: uploadIdempotency.key,
        responseStatus: 200,
        responseBody,
      });

      return NextResponse.json(responseBody);
    } catch (error) {
      await failIdempotentRequest({
        scope: "uploads:create",
        actorId: user.uid,
        key: uploadIdempotency.key,
        errorMessage: error instanceof Error ? error.message : "upload_failed",
      });
      throw error;
    }
  } catch (error) {
    const guardError = toGuardErrorResponse(error);
    if (guardError) {
      return guardError;
    }
    return NextResponse.json({ error: "Upload failed" }, { status: 400 });
  }
}

