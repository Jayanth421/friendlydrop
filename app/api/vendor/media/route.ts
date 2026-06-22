import { NextRequest, NextResponse } from "next/server";
import { requireApiVendorOrAdmin } from "@/lib/auth/api";
import { getUploadsForAdmin, getUploadsForUser } from "@/lib/firebase/firestore";
import { isAdminRole } from "@/lib/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiVendorOrAdmin(request);
    const uploads = isAdminRole(user.role) ? await getUploadsForAdmin() : await getUploadsForUser(user.uid);
    return NextResponse.json({ files: uploads });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not load vendor media" }, { status: 400 });
  }
}
