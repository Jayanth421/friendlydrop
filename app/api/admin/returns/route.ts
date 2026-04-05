import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { createReturnRequest, getReturnRequests } from "@/lib/firebase/firestore";
import { returnRequestSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  await requireApiPermission(request, "returns:manage");
  const requests = await getReturnRequests();
  return NextResponse.json({ requests });
}

export async function POST(request: NextRequest) {
  try {
    await requireApiPermission(request, "returns:manage");
    const payload = returnRequestSchema.parse(await request.json());
    const requestItem = await createReturnRequest({ ...payload, status: "requested" });
    return NextResponse.json({ ok: true, request: requestItem });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not create return request" }, { status: 400 });
  }
}
