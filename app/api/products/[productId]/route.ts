import { NextRequest, NextResponse } from "next/server";
import { getProductById } from "@/lib/firebase/firestore";

export const runtime = "nodejs";

export async function GET(_request: NextRequest, { params }: { params: { productId: string } }) {
  const product = await getProductById(params.productId);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ product });
}
