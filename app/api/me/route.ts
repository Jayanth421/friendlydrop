import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth/api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}
