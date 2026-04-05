import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { getCart, saveCart } from "@/lib/firebase/firestore";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await requireApiUser(request);
  const items = await getCart(user.uid);
  return NextResponse.json({ items });
}

export async function PUT(request: NextRequest) {
  const user = await requireApiUser(request);
  const { items } = (await request.json()) as { items: unknown[] };

  await saveCart(user.uid, items as never[]);
  return NextResponse.json({ ok: true });
}
