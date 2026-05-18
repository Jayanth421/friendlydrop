"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Filter, Heart, Search, ShoppingBag, SlidersHorizontal } from "lucide-react";
import { Product } from "@/types";
import { ProductGrid } from "@/components/product/product-grid";

type ShopSort = "popularity" | "price-asc" | "price-desc" | "newest";
type Availability = "all" | "in-stock" | "out-of-stock";
type MobileFilterSection = "gender" | "price" | "brand" | "discount" | "category" | "rating" | "availability";

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

const SORT_OPTIONS: Array<{ value: ShopSort; label: string }> = [
  { value: "popularity", label: "Popularity" },
  { value: "newest", label: "Latest" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "price-asc", label: "Price: Low to High" },
];

const DISCOUNT_OPTIONS: Array<{ label: string; value?: number }> = [
  { label: "All Discounts", value: undefined },
  { label: "10% and above", value: 10 },
  { label: "20% and above", value: 20 },
  { label: "30% and above", value: 30 },
  { label: "40% and above", value: 40 },
];

const RATING_OPTIONS: Array<{ label: string; value?: number }> = [
  { label: "All Ratings", value: undefined },
  { label: "4 star & above", value: 4 },
  { label: "3 star & above", value: 3 },
  { label: "2 star & above", value: 2 },
];

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
  const [mobileSortOpen, setMobileSortOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [activeMobileFilterSection, setActiveMobileFilterSection] = useState<MobileFilterSection>("gender");
  const [mobileDraftFilters, setMobileDraftFilters] = useState<ShopFilters>(initialFilters);

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
  const mobileCountLabel = useMemo(() => `${products.length} Items`, [products.length]);
  const activeSortLabel = useMemo(
    () => SORT_OPTIONS.find((option) => option.value === filters.sort)?.label ?? "Popularity",
    [filters.sort],
  );
  const listingTitle = useMemo(() => {
    const source = filters.category || "Girl";
    return `${source.replaceAll("-", " ")} Tshirts`;
  }, [filters.category]);

  const toggleBrand = (brand: string) => {
    setFilters((current) => {
      const exists = current.brands.includes(brand);
      return {
        ...current,
        brands: exists ? current.brands.filter((value) => value !== brand) : [...current.brands, brand],
      };
    });
  };

  const toggleDraftBrand = (brand: string) => {
    setMobileDraftFilters((current) => {
      const exists = current.brands.includes(brand);
      return {
        ...current,
        brands: exists ? current.brands.filter((value) => value !== brand) : [...current.brands, brand],
      };
    });
  };

  const openMobileFilter = () => {
    setMobileDraftFilters(filters);
    setActiveMobileFilterSection("gender");
    setMobileFilterOpen(true);
  };

  const applyMobileFilters = () => {
    setFilters((current) => {
      const minPrice = mobileDraftFilters.minPrice ?? facets.minPrice;
      const maxPrice = mobileDraftFilters.maxPrice ?? facets.maxPrice;
      const normalizedMin = Math.min(minPrice, maxPrice);
      const normalizedMax = Math.max(minPrice, maxPrice);
      return {
        ...current,
        ...mobileDraftFilters,
        minPrice: normalizedMin,
        maxPrice: normalizedMax,
      };
    });
    setMobileFilterOpen(false);
  };

  const closeMobileFilters = () => {
    setMobileDraftFilters(filters);
    setMobileFilterOpen(false);
  };

  const resetAllFilters = () => {
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
    });
  };

  const mobileFilterSections: Array<{ key: MobileFilterSection; label: string }> = [
    { key: "gender", label: "Gender" },
    { key: "price", label: "Price" },
    { key: "brand", label: "Brand" },
    { key: "discount", label: "Discount Range" },
    { key: "category", label: "Tshirts" },
    { key: "rating", label: "Rating" },
    { key: "availability", label: "Stock" },
  ];

  return (
    <>
      <section className="bg-[#f5f5f6] lg:hidden">
        <header className="sticky top-0 z-30 border-b border-[#e5e6ea] bg-white">
          <div className="flex h-[54px] items-center justify-between px-3">
            <div className="flex items-center gap-2">
              <button type="button" className="inline-flex h-8 w-8 items-center justify-center text-[#282c3f]">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-[#ff3f6c] via-[#f26a10] to-[#f7d438] text-sm font-bold text-white">
                F
              </div>
              <div>
                <p className="text-base font-semibold leading-none text-[#282c3f]">{listingTitle}</p>
                <p className="text-xs text-[#6f7383]">{mobileCountLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[#282c3f]">
              <button type="button" className="inline-flex h-8 w-8 items-center justify-center">
                <Search className="h-5 w-5" />
              </button>
              <button type="button" className="inline-flex h-8 w-8 items-center justify-center">
                <Heart className="h-5 w-5" />
              </button>
              <button type="button" className="inline-flex h-8 w-8 items-center justify-center">
                <ShoppingBag className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        <div className="bg-[#b96cae] py-3 text-center text-white">
          <p className="text-lg font-semibold uppercase">UPTO 200 OFF</p>
          <p className="text-base font-semibold uppercase text-[#f9d9f4]">SAVE</p>
        </div>

        <div className="pb-[72px]">
          {products.length ? (
            <ProductGrid products={products} variant="listing" />
          ) : (
            <div className="mx-3 mt-4 border border-dashed border-[#c4c4c4] bg-white px-4 py-10 text-center text-sm text-[#6f7383]">
              No products match these filters.
            </div>
          )}
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#dadce3] bg-white">
          <div className="grid grid-cols-2 divide-x divide-[#e8e9ef]">
            <button
              type="button"
              className="flex h-[58px] items-center justify-center gap-2 text-sm font-semibold tracking-[0.04em] text-[#3e4152]"
              onClick={() => setMobileSortOpen(true)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              SORT
            </button>
            <button
              type="button"
              className="flex h-[58px] items-center justify-center gap-2 text-sm font-semibold tracking-[0.04em] text-[#3e4152]"
              onClick={openMobileFilter}
            >
              <Filter className="h-4 w-4" />
              FILTER
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto hidden w-full max-w-[1400px] gap-8 px-4 pb-12 pt-6 lg:grid lg:grid-cols-[290px_1fr] lg:px-10 lg:pt-10">
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
            onClick={resetAllFilters}
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

      {mobileSortOpen ? (
        <div className="fixed inset-0 z-50 bg-black/55 lg:hidden" onClick={() => setMobileSortOpen(false)}>
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white pb-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-[#eceef3] px-5 py-4">
              <p className="text-base font-semibold tracking-[0.04em] text-[#3e4152]">SORT BY</p>
            </div>
            <div className="px-5 pt-3">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="flex w-full items-center justify-between border-b border-[#f1f2f5] py-4 text-left text-base text-[#3e4152]"
                  onClick={() => {
                    setFilters((current) => ({ ...current, sort: option.value }));
                    setMobileSortOpen(false);
                  }}
                >
                  <span>{option.label}</span>
                  {filters.sort === option.value ? <Check className="h-4 w-4 text-[#ff3f6c]" /> : null}
                </button>
              ))}
              <p className="pt-3 text-center text-xs text-[#7e8190]">Current: {activeSortLabel}</p>
            </div>
          </div>
        </div>
      ) : null}

      {mobileFilterOpen ? (
        <div className="fixed inset-0 z-50 bg-white lg:hidden">
          <div className="flex h-[52px] items-center border-b border-[#ebedf2] px-4">
            <p className="text-lg font-semibold text-[#2d3043]">FILTERS</p>
          </div>

          <div className="grid h-[calc(100vh-108px)] grid-cols-[132px_1fr]">
            <div className="overflow-y-auto border-r border-[#ebedf2] bg-[#f3f4f7]">
              {mobileFilterSections.map((section) => (
                <button
                  key={section.key}
                  type="button"
                  className={`flex h-[48px] w-full items-center border-b border-[#eceef3] px-3 text-left text-sm ${
                    activeMobileFilterSection === section.key
                      ? "bg-[#8d909f] font-semibold text-white"
                      : "text-[#3f4458]"
                  }`}
                  onClick={() => setActiveMobileFilterSection(section.key)}
                >
                  {section.label}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto bg-white px-4 py-3">
              {activeMobileFilterSection === "gender" ? (
                <div className="space-y-5">
                  <button type="button" className="flex w-full items-center justify-between text-left text-base text-[#2f3347]">
                    <span>Boys</span>
                    <span className="text-sm text-[#9ca0ae]">{Math.max(0, Math.floor(products.length * 0.45))}</span>
                  </button>
                  <button type="button" className="flex w-full items-center justify-between text-left text-base text-[#2f3347]">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#8e93a5]" />
                      <span>Girls</span>
                    </div>
                    <span className="text-sm text-[#9ca0ae]">{products.length}</span>
                  </button>
                </div>
              ) : null}

              {activeMobileFilterSection === "category" ? (
                <div className="space-y-4">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between text-left text-base text-[#2f3347]"
                    onClick={() => setMobileDraftFilters((current) => ({ ...current, category: "" }))}
                  >
                    <span>All</span>
                    {mobileDraftFilters.category === "" ? <Check className="h-4 w-4 text-[#ff3f6c]" /> : null}
                  </button>
                  {facets.categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      className="flex w-full items-center justify-between text-left text-base capitalize text-[#2f3347]"
                      onClick={() => setMobileDraftFilters((current) => ({ ...current, category }))}
                    >
                      <span>{category.replaceAll("-", " ")}</span>
                      {mobileDraftFilters.category === category ? <Check className="h-4 w-4 text-[#ff3f6c]" /> : null}
                    </button>
                  ))}
                </div>
              ) : null}

              {activeMobileFilterSection === "brand" ? (
                <div className="space-y-3">
                  {facets.brands.length ? (
                    facets.brands.map((brand) => (
                      <label key={brand} className="flex items-center justify-between text-base text-[#2f3347]">
                        <span>{brand}</span>
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-[#ff3f6c]"
                          checked={mobileDraftFilters.brands.includes(brand)}
                          onChange={() => toggleDraftBrand(brand)}
                        />
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-[#8a8fa0]">No brands available.</p>
                  )}
                </div>
              ) : null}

              {activeMobileFilterSection === "discount" ? (
                <div className="space-y-4">
                  {DISCOUNT_OPTIONS.map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      className="flex w-full items-center justify-between text-left text-base text-[#2f3347]"
                      onClick={() =>
                        setMobileDraftFilters((current) => ({
                          ...current,
                          minDiscount: option.value,
                        }))
                      }
                    >
                      <span>{option.label}</span>
                      {mobileDraftFilters.minDiscount === option.value ? <Check className="h-4 w-4 text-[#ff3f6c]" /> : null}
                    </button>
                  ))}
                </div>
              ) : null}

              {activeMobileFilterSection === "rating" ? (
                <div className="space-y-4">
                  {RATING_OPTIONS.map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      className="flex w-full items-center justify-between text-left text-base text-[#2f3347]"
                      onClick={() =>
                        setMobileDraftFilters((current) => ({
                          ...current,
                          minRating: option.value,
                        }))
                      }
                    >
                      <span>{option.label}</span>
                      {mobileDraftFilters.minRating === option.value ? <Check className="h-4 w-4 text-[#ff3f6c]" /> : null}
                    </button>
                  ))}
                </div>
              ) : null}

              {activeMobileFilterSection === "availability" ? (
                <div className="space-y-4">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between text-left text-base text-[#2f3347]"
                    onClick={() => setMobileDraftFilters((current) => ({ ...current, availability: "all" }))}
                  >
                    <span>All</span>
                    {mobileDraftFilters.availability === "all" ? <Check className="h-4 w-4 text-[#ff3f6c]" /> : null}
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between text-left text-base text-[#2f3347]"
                    onClick={() => setMobileDraftFilters((current) => ({ ...current, availability: "in-stock" }))}
                  >
                    <span>In Stock</span>
                    {mobileDraftFilters.availability === "in-stock" ? <Check className="h-4 w-4 text-[#ff3f6c]" /> : null}
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between text-left text-base text-[#2f3347]"
                    onClick={() => setMobileDraftFilters((current) => ({ ...current, availability: "out-of-stock" }))}
                  >
                    <span>Out of Stock</span>
                    {mobileDraftFilters.availability === "out-of-stock" ? <Check className="h-4 w-4 text-[#ff3f6c]" /> : null}
                  </button>
                </div>
              ) : null}

              {activeMobileFilterSection === "price" ? (
                <div className="space-y-5">
                  <p className="text-sm text-[#8a8fa0]">
                    Range: Rs. {mobileDraftFilters.minPrice ?? facets.minPrice} - Rs. {mobileDraftFilters.maxPrice ?? facets.maxPrice}
                  </p>
                  <label className="block text-sm text-[#3f4458]">
                    Minimum
                    <input
                      type="range"
                      className="mt-2 w-full accent-[#ff3f6c]"
                      min={facets.minPrice}
                      max={Math.max(facets.maxPrice, facets.minPrice + 1)}
                      value={mobileDraftFilters.minPrice ?? facets.minPrice}
                      onChange={(event) => {
                        const nextMin = Number(event.target.value);
                        setMobileDraftFilters((current) => ({
                          ...current,
                          minPrice: nextMin,
                          maxPrice: Math.max(current.maxPrice ?? facets.maxPrice, nextMin),
                        }));
                      }}
                    />
                  </label>
                  <label className="block text-sm text-[#3f4458]">
                    Maximum
                    <input
                      type="range"
                      className="mt-2 w-full accent-[#ff3f6c]"
                      min={facets.minPrice}
                      max={Math.max(facets.maxPrice, facets.minPrice + 1)}
                      value={mobileDraftFilters.maxPrice ?? facets.maxPrice}
                      onChange={(event) => {
                        const nextMax = Number(event.target.value);
                        setMobileDraftFilters((current) => ({
                          ...current,
                          maxPrice: nextMax,
                          minPrice: Math.min(current.minPrice ?? facets.minPrice, nextMax),
                        }));
                      }}
                    />
                  </label>
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid h-[56px] grid-cols-2 border-t border-[#ebedf2]">
            <button type="button" className="text-sm font-medium tracking-[0.05em] text-[#3e4152]" onClick={closeMobileFilters}>
              CLOSE
            </button>
            <button
              type="button"
              className="border-l border-[#ebedf2] text-sm font-semibold tracking-[0.05em] text-[#ff3f6c]"
              onClick={applyMobileFilters}
            >
              APPLY
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
