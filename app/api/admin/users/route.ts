import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { getAllUsers } from "@/lib/firebase/firestore";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  await requireApiPermission(request, "users:manage");
  const users = await getAllUsers();
  return NextResponse.json({ users });
}
