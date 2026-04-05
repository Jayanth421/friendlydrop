import { NextRequest, NextResponse } from "next/server";
import { getProducts, getProductById } from "@/lib/firebase/firestore";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const ids = request.nextUrl.searchParams.get("ids");

  if (ids) {
    const products = await Promise.all(
      ids
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .map((id) => getProductById(id)),
    );

    return NextResponse.json({ products: products.filter(Boolean) });
  }

  const category = request.nextUrl.searchParams.get("category") ?? undefined;
  const search = request.nextUrl.searchParams.get("q") ?? undefined;
  const sort = (request.nextUrl.searchParams.get("sort") as "popularity" | "price-asc" | "price-desc" | null) ?? undefined;

  const products = await getProducts({ category, search, sort });
  return NextResponse.json({ products });
}
