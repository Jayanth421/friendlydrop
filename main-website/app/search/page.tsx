import { getProducts } from "@/lib/firebase/firestore";
import { ProductGrid } from "@/components/product/product-grid";

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q ?? "";
  const products = await getProducts({ search: query });

  return (
    <main className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="font-display text-4xl font-bold text-ink">Search</h1>
        <form className="mt-4">
          <input
            defaultValue={query}
            name="q"
            placeholder="Search products"
            className="w-full rounded-xl border border-slate-200 px-4 py-3"
          />
        </form>
      </div>

      <ProductGrid products={products} />
    </main>
  );
}

