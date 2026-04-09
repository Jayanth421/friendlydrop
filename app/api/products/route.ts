import { NextRequest, NextResponse } from "next/server";
import { getProducts, getProductById } from "@/lib/firebase/firestore";

export const runtime = "nodejs";

function parseNumber(value: string | null) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

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
  const sortParam = request.nextUrl.searchParams.get("sort");
  const minPrice = request.nextUrl.searchParams.get("minPrice");
  const maxPrice = request.nextUrl.searchParams.get("maxPrice");
  const minRating = request.nextUrl.searchParams.get("minRating");
  const availability = request.nextUrl.searchParams.get("availability");
  const minDiscount = request.nextUrl.searchParams.get("minDiscount");

  const brandValues = request.nextUrl.searchParams.getAll("brand");
  const brands =
    brandValues.length > 0
      ? brandValues.flatMap((item) => item.split(",")).map((item) => item.trim()).filter(Boolean)
      : undefined;

  const normalizedSort =
    sortParam === "price-low-high"
      ? "price-asc"
      : sortParam === "price-high-low"
        ? "price-desc"
        : sortParam === "newest" || sortParam === "popularity" || sortParam === "price-asc" || sortParam === "price-desc"
          ? sortParam
          : undefined;

  const [products, allProducts] = await Promise.all([
    getProducts({
      category,
      search,
      sort: normalizedSort,
      minPrice: parseNumber(minPrice),
      maxPrice: parseNumber(maxPrice),
      brands,
      minRating: parseNumber(minRating),
      availability: availability === "in-stock" || availability === "out-of-stock" ? availability : undefined,
      minDiscount: parseNumber(minDiscount),
    }),
    getProducts(),
  ]);

  const facets = {
    categories: Array.from(new Set(allProducts.map((product) => product.category))).sort(),
    brands: Array.from(
      new Set(
        allProducts
          .map((product) => product.brand?.trim())
          .filter((brand): brand is string => Boolean(brand)),
      ),
    ).sort((a, b) => a.localeCompare(b)),
    maxPrice: allProducts.reduce((max, product) => Math.max(max, Number(product.price ?? 0)), 0),
    minPrice: allProducts.reduce((min, product) => Math.min(min, Number(product.price ?? 0)), Number.MAX_SAFE_INTEGER),
  };

  if (facets.minPrice === Number.MAX_SAFE_INTEGER) {
    facets.minPrice = 0;
  }

  return NextResponse.json({ products, facets });
}
