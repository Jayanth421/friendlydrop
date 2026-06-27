import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";
import { CatalogCategory } from "@/types";

export function CategoryStrip({ categories }: { categories?: CatalogCategory[] }) {
  const dynamicCategories =
    categories?.length
      ? categories.map((category) => ({
          key: category.id,
          label: category.name,
          value: category.slug,
          description: category.description ?? "Explore curated products in this category.",
        }))
      : CATEGORIES.map((category) => ({
          key: category.value,
          label: category.label,
          value: category.value,
          description: "Minimal, clean, and premium customizable styles.",
        }));

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {dynamicCategories.map((category) => (
        <Link
          key={category.key}
          href={`/products?category=${category.value}`}
          className="glass-panel group rounded-2xl p-4 transition hover:-translate-y-0.5 hover:border-black/60 dark:hover:border-white/60"
        >
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-gold" />
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">Category</p>
          </div>
          <h3 className="mt-2 font-display text-2xl font-semibold">{category.label}</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{category.description}</p>
        </Link>
      ))}
    </section>
  );
}
