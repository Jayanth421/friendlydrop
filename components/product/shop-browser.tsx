"use client";

import { useEffect, useMemo, useState } from "react";
import { Product } from "@/types";
import { ProductGrid } from "@/components/product/product-grid";

type ShopSort = "popularity" | "price-asc" | "price-desc" | "newest";
type Availability = "all" | "in-stock" | "out-of-stock";

interface ShopFacets {
  categories: string[];
  brands: string[];
  minPrice: number;
  maxPrice: number;
}

interface ShopFilters {
  search?: string;
  category: string;
  sort: ShopSort;
  minPrice?: number;
  maxPrice?: number;
  brands: string[];
  minRating?: number;
  availability: Availability;
  minDiscount?: number;
}

function buildQuery(filters: ShopFilters) {
  const params = new URLSearchParams();

  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters.category) {
    params.set("category", filters.category);
  }

  params.set("sort", filters.sort);

  if (typeof filters.minPrice === "number") {
    params.set("minPrice", String(filters.minPrice));
  }

  if (typeof filters.maxPrice === "number") {
    params.set("maxPrice", String(filters.maxPrice));
  }

  for (const brand of filters.brands) {
    params.append("brand", brand);
  }

  if (typeof filters.minRating === "number") {
    params.set("minRating", String(filters.minRating));
  }

  if (filters.availability !== "all") {
    params.set("availability", filters.availability);
  }

  if (typeof filters.minDiscount === "number") {
    params.set("minDiscount", String(filters.minDiscount));
  }

  return params;
}

export function ShopBrowser({
  initialProducts,
  initialFacets,
  initialFilters,
}: {
  initialProducts: Product[];
  initialFacets: ShopFacets;
  initialFilters: ShopFilters;
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [facets, setFacets] = useState<ShopFacets>(initialFacets);
  const [filters, setFilters] = useState<ShopFilters>(initialFilters);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = buildQuery(filters);
    const query = params.toString();
    const nextUrl = query ? `/products?${query}` : "/products";
    window.history.replaceState(null, "", nextUrl);

    const abortController = new AbortController();
    setLoading(true);

    fetch(`/api/products?${query}`, {
      signal: abortController.signal,
      cache: "no-store",
    })
      .then((response) => response.json())
      .then((data: { products?: Product[]; facets?: ShopFacets }) => {
        setProducts(data.products ?? []);
        if (data.facets) {
          setFacets(data.facets);
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));

    return () => abortController.abort();
  }, [filters]);

  useEffect(() => {
    if (typeof filters.minPrice !== "number" && typeof filters.maxPrice !== "number") {
      setFilters((current) => ({
        ...current,
        minPrice: facets.minPrice,
        maxPrice: facets.maxPrice,
      }));
    }
  }, [facets.maxPrice, facets.minPrice, filters.maxPrice, filters.minPrice]);

  const productCountLabel = useMemo(() => `${products.length} product${products.length === 1 ? "" : "s"}`, [products.length]);

  const toggleBrand = (brand: string) => {
    setFilters((current) => {
      const exists = current.brands.includes(brand);
      return {
        ...current,
        brands: exists ? current.brands.filter((value) => value !== brand) : [...current.brands, brand],
      };
    });
  };

  return (
    <section className="mx-auto grid w-full max-w-[1400px] gap-8 px-4 pb-12 pt-6 lg:grid-cols-[290px_1fr] lg:px-10 lg:pt-10">
      <aside className="h-fit space-y-6 border border-[#dddbdc] bg-white p-5">
        <div className="border-b border-[#ecebeb] pb-5">
          <p className="text-xs uppercase tracking-[0.12em] text-[#737373]">Trend picks</p>
          <p className="mt-2 text-3xl text-[#262626]">Super Sale</p>
          <p className="mt-2 text-sm uppercase tracking-[0.08em] text-[#737373]">Up to 50% off with instant coupons.</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.1em] text-[#737373]">Search</p>
          <input
            className="mt-2 h-11 w-full border border-[#dddbdc] bg-white px-3 text-sm text-[#262626] outline-none focus:border-[#262626]"
            value={filters.search ?? ""}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            placeholder="Explore fashion"
          />
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.1em] text-[#737373]">Category</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilters((current) => ({ ...current, category: "" }))}
              className={`border px-2.5 py-1.5 text-[11px] uppercase tracking-[0.08em] ${
                filters.category === ""
                  ? "border-[#262626] bg-[#262626] text-white"
                  : "border-[#dddbdc] text-[#737373]"
              }`}
            >
              All
            </button>
            {facets.categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setFilters((current) => ({ ...current, category }))}
                className={`border px-2.5 py-1.5 text-[11px] uppercase tracking-[0.08em] ${
                  filters.category === category
                    ? "border-[#262626] bg-[#262626] text-white"
                    : "border-[#dddbdc] text-[#737373]"
                }`}
              >
                {category.replaceAll("-", " ")}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.1em] text-[#737373]">Price Range</p>
          <div className="mt-3 space-y-2">
            <label className="block text-xs uppercase tracking-[0.08em] text-[#737373]">
              Min: Rs. {filters.minPrice ?? facets.minPrice}
              <input
                type="range"
                min={facets.minPrice}
                max={Math.max(facets.maxPrice, facets.minPrice + 1)}
                value={filters.minPrice ?? facets.minPrice}
                onChange={(event) => {
                  const nextMin = Number(event.target.value);
                  setFilters((current) => ({
                    ...current,
                    minPrice: nextMin,
                    maxPrice: Math.max(current.maxPrice ?? facets.maxPrice, nextMin),
                  }));
                }}
                className="mt-1 w-full accent-[#74f941]"
              />
            </label>
            <label className="block text-xs text-slate-600">
              Max: Rs. {filters.maxPrice ?? facets.maxPrice}
              <input
                type="range"
                min={facets.minPrice}
                max={Math.max(facets.maxPrice, facets.minPrice + 1)}
                value={filters.maxPrice ?? facets.maxPrice}
                onChange={(event) => {
                  const nextMax = Number(event.target.value);
                  setFilters((current) => ({
                    ...current,
                    maxPrice: nextMax,
                    minPrice: Math.min(current.minPrice ?? facets.minPrice, nextMax),
                  }));
                }}
                className="mt-1 w-full accent-[#262626]"
              />
            </label>
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.1em] text-[#737373]">Brand</p>
          <div className="mt-2 max-h-40 space-y-1 overflow-y-auto border border-[#ecebeb] p-2">
            {facets.brands.length ? (
              facets.brands.map((brand) => (
                <label key={brand} className="flex cursor-pointer items-center gap-2 text-xs uppercase tracking-[0.06em] text-[#262626]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 border-[#bbb] accent-[#262626]"
                    checked={filters.brands.includes(brand)}
                    onChange={() => toggleBrand(brand)}
                  />
                  <span>{brand}</span>
                </label>
              ))
            ) : (
              <p className="text-xs uppercase tracking-[0.08em] text-[#737373]">No brands available</p>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.1em] text-[#737373]">Rating</p>
          <select
            className="mt-2 h-11 w-full border border-[#dddbdc] px-3 text-sm text-[#262626] outline-none focus:border-[#262626]"
            value={filters.minRating ?? 0}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                minRating: Number(event.target.value) || undefined,
              }))
            }
          >
            <option value={0}>All ratings</option>
            <option value={4}>4 stars & up</option>
            <option value={3}>3 stars & up</option>
            <option value={2}>2 stars & up</option>
          </select>
        </div>

        <button
          className="h-11 w-full bg-[#262626] text-xs uppercase tracking-[0.12em] text-white hover:bg-black"
          onClick={() =>
            setFilters({
              search: "",
              category: "",
              sort: "popularity",
              minPrice: facets.minPrice,
              maxPrice: facets.maxPrice,
              brands: [],
              minRating: undefined,
              availability: "all",
              minDiscount: undefined,
            })
          }
        >
          Reset Filters
        </button>
      </aside>

      <div className="space-y-4">
        <div className="border border-[#dddbdc] bg-white p-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl text-[#262626] md:text-4xl">Shop All Products</h1>
              <p className="mt-1 text-xs uppercase tracking-[0.1em] text-[#737373]">
                {loading ? "Updating products..." : productCountLabel}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="h-10 border border-[#dddbdc] px-3 text-xs uppercase tracking-[0.08em] text-[#262626] outline-none focus:border-[#262626]"
                value={filters.availability}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    availability: event.target.value as Availability,
                  }))
                }
              >
                <option value="all">All stock states</option>
                <option value="in-stock">In stock</option>
                <option value="out-of-stock">Out of stock</option>
              </select>
              <select
                className="h-10 border border-[#dddbdc] px-3 text-xs uppercase tracking-[0.08em] text-[#262626] outline-none focus:border-[#262626]"
                value={filters.sort}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    sort: event.target.value as ShopSort,
                  }))
                }
              >
                <option value="popularity">Sort: Popularity</option>
                <option value="newest">Sort: Newest</option>
                <option value="price-asc">Sort: Price Low to High</option>
                <option value="price-desc">Sort: Price High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {products.length ? (
          <ProductGrid products={products} variant="listing" />
        ) : (
          <div className="border border-dashed border-[#c4c4c4] bg-white p-8 text-center text-sm uppercase tracking-[0.08em] text-[#737373]">
            No products match these filters. Try adjusting category, price, or search.
          </div>
        )}
      </div>
    </section>
  );
}
