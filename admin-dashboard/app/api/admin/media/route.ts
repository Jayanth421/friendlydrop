import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { deleteUploadRecordsByUrlOrPath, getUploadsForAdmin } from "@/lib/firebase/firestore";
import { deleteOqensFile, isOqensStorageConfigured, listOqensFiles } from "@/lib/storage/oqens";
import { assertTrustedMutationRequest, toGuardErrorResponse } from "@/lib/security/request-guards";

export const runtime = "nodejs";

function matchesSearch(file: { key: string; name: string; publicUrl: string; contentType?: string }, query: string) {
  if (!query) {
    return true;
  }

  const haystack = [file.key, file.name, file.publicUrl, file.contentType ?? ""].join(" ").toLowerCase();
  return haystack.includes(query);
}

export async function GET(request: NextRequest) {
  try {
    await requireApiPermission(request, "products:manage");

    if (!isOqensStorageConfigured()) {
      return NextResponse.json({ files: [], configured: false });
    }

    const search = request.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";
    const [files, uploads] = await Promise.all([listOqensFiles(), getUploadsForAdmin()]);
    const uploadByUrl = new Map(uploads.map((upload) => [upload.imageUrl, upload]));
    const enrichedFiles = files
      .filter((file) => matchesSearch(file, search))
      .map((file) => {
        const upload = uploadByUrl.get(file.publicUrl);
        return {
          ...file,
          folder: upload?.folder ?? file.key.split("/")[0],
          uploadId: upload?.id,
          createdAt: upload?.createdAt,
        };
      });

    return NextResponse.json({ files: enrichedFiles, configured: true });
  } catch (error) {
    const guardError = toGuardErrorResponse(error);
    if (guardError) {
      return guardError;
    }
    console.error(error);
    return NextResponse.json({ error: "Could not load media files" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireApiPermission(request, "products:manage");
    assertTrustedMutationRequest(request);

    const { key, publicUrl } = (await request.json()) as { key?: string; publicUrl?: string };
    if (!key) {
      return NextResponse.json({ error: "key is required" }, { status: 400 });
    }

    await deleteOqensFile(key);

    if (publicUrl) {
      await deleteUploadRecordsByUrlOrPath(publicUrl);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const guardError = toGuardErrorResponse(error);
    if (guardError) {
      return guardError;
    }
    console.error(error);
    return NextResponse.json({ error: "Could not delete media file" }, { status: 400 });
  }
}
