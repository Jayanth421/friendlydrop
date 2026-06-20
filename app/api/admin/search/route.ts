import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { globalAdminSearch } from "@/lib/firebase/firestore";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  await requireApiPermission(request, "dashboard:view");
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const result = await globalAdminSearch(query);
  return NextResponse.json(result);
}

