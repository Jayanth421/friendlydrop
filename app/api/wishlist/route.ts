import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { getWishlist, saveWishlist } from "@/lib/firebase/firestore";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await requireApiUser(request);
  const productIds = await getWishlist(user.uid);
  return NextResponse.json({ productIds });
}

export async function PUT(request: NextRequest) {
  const user = await requireApiUser(request);
  const { productIds } = (await request.json()) as { productIds: string[] };
  await saveWishlist(user.uid, productIds);
  return NextResponse.json({ ok: true });
}

