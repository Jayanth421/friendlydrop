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

  return (
    <section className="grid gap-5 lg:grid-cols-[290px_1fr]">
      <aside className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Category</p>
          <select
            className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-2 text-sm"
            value={filters.category}
            onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
          >
            <option value="">All categories</option>
            {facets.categories.map((category) => (
              <option key={category} value={category}>
                {category.replaceAll("-", " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Price Range</p>
          <div className="mt-3 space-y-2">
            <label className="block text-xs text-slate-600">
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
                className="mt-1 w-full"
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
                className="mt-1 w-full"
              />
            </label>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Brand</p>
          <div className="mt-2 max-h-48 space-y-1 overflow-auto">
            {facets.brands.length ? (
              facets.brands.map((brand) => {
                const checked = filters.brands.includes(brand);
                return (
                  <label key={brand} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          brands: event.target.checked
                            ? [...current.brands, brand]
                            : current.brands.filter((item) => item !== brand),
                        }))
                      }
                    />
                    {brand}
                  </label>
                );
              })
            ) : (
              <p className="text-xs text-slate-500">No brands available</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Customer Rating</p>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={filters.minRating === 4}
              onChange={(event) => setFilters((current) => ({ ...current, minRating: event.target.checked ? 4 : undefined }))}
            />
            4 star and above
          </label>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Availability</p>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="radio" name="availability" checked={filters.availability === "all"} onChange={() => setFilters((current) => ({ ...current, availability: "all" }))} />
            All
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="radio" name="availability" checked={filters.availability === "in-stock"} onChange={() => setFilters((current) => ({ ...current, availability: "in-stock" }))} />
            In stock
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="radio" name="availability" checked={filters.availability === "out-of-stock"} onChange={() => setFilters((current) => ({ ...current, availability: "out-of-stock" }))} />
            Out of stock
          </label>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Discount</p>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={filters.minDiscount === 20}
              onChange={(event) => setFilters((current) => ({ ...current, minDiscount: event.target.checked ? 20 : undefined }))}
            />
            20% and above
          </label>
        </div>

        <button
          className="h-10 w-full rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
          onClick={() =>
            setFilters({
              category: "",
              sort: "popularity",
              minPrice: facets.minPrice,
              maxPrice: facets.maxPrice,
              brands: [],
              availability: "all",
            })
          }
        >
          Reset Filters
        </button>
      </aside>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-ink">Shop Products</h1>
            <p className="text-sm text-slate-600">{loading ? "Updating products..." : productCountLabel}</p>
          </div>
          <label className="text-sm text-slate-600">
            Sort:
            <select
              className="ml-2 h-10 rounded-lg border border-slate-200 px-2 text-sm"
              value={filters.sort}
              onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value as ShopSort }))}
            >
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest arrivals</option>
              <option value="popularity">Popularity</option>
            </select>
          </label>
        </div>

        {products.length ? (
          <ProductGrid products={products} />
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No products match these filters. Try adjusting category, price, or brand.
          </div>
        )}
      </div>
    </section>
  );
}
