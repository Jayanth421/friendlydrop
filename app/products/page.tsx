import { Metadata } from "next";
import { ShopBrowser } from "@/components/product/shop-browser";
import { getProducts } from "@/lib/firebase/firestore";

export const metadata: Metadata = {
  title: "Shop Products",
};

type SearchParams = {
  category?: string;
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  availability?: string;
  minDiscount?: string;
  brand?: string | string[];
};

function normalizeSort(sort?: string): "popularity" | "price-asc" | "price-desc" | "newest" {
  if (sort === "price-asc" || sort === "price-low-high") {
    return "price-asc";
  }

  if (sort === "price-desc" || sort === "price-high-low") {
    return "price-desc";
  }

  if (sort === "newest") {
    return "newest";
  }

  return "popularity";
}

function normalizeBrands(brand?: string | string[]) {
  if (!brand) {
    return [] as string[];
  }

  const values = Array.isArray(brand) ? brand : brand.split(",");
  return values.map((value) => value.trim()).filter(Boolean);
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const brands = normalizeBrands(searchParams.brand);

  const [products, allProducts] = await Promise.all([
    getProducts({
      category: searchParams.category,
      sort: normalizeSort(searchParams.sort),
      minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
      maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
      brands: brands.length ? brands : undefined,
      minRating: searchParams.minRating ? Number(searchParams.minRating) : undefined,
      availability:
        searchParams.availability === "in-stock" || searchParams.availability === "out-of-stock"
          ? searchParams.availability
          : undefined,
      minDiscount: searchParams.minDiscount ? Number(searchParams.minDiscount) : undefined,
    }),
    getProducts(),
  ]);

  const maxPrice = allProducts.reduce((max, product) => Math.max(max, Number(product.price ?? 0)), 0);
  const minPriceCandidate = allProducts.reduce((min, product) => Math.min(min, Number(product.price ?? 0)), Number.MAX_SAFE_INTEGER);
  const minPrice = minPriceCandidate === Number.MAX_SAFE_INTEGER ? 0 : minPriceCandidate;

  return (
    <main className="space-y-6">
      <ShopBrowser
        initialProducts={products}
        initialFacets={{
          categories: Array.from(new Set(allProducts.map((product) => product.category))).sort(),
          brands: Array.from(
            new Set(allProducts.map((product) => product.brand?.trim()).filter((brand): brand is string => Boolean(brand))),
          ).sort((a, b) => a.localeCompare(b)),
          minPrice,
          maxPrice,
        }}
        initialFilters={{
          category: searchParams.category ?? "",
          sort: normalizeSort(searchParams.sort),
          minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : minPrice,
          maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : maxPrice,
          brands,
          minRating: searchParams.minRating ? Number(searchParams.minRating) : undefined,
          availability:
            searchParams.availability === "in-stock" || searchParams.availability === "out-of-stock"
              ? searchParams.availability
              : "all",
          minDiscount: searchParams.minDiscount ? Number(searchParams.minDiscount) : undefined,
        }}
      />
    </main>
  );
}
