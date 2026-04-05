import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";

export function CategoryStrip() {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {CATEGORIES.map((category) => (
        <Link
          key={category.value}
          href={`/products?category=${category.value}`}
          className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-black"
        >
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Category</p>
          </div>
          <h3 className="mt-2 font-display text-2xl font-semibold text-black">{category.label}</h3>
          <p className="mt-1 text-sm text-slate-600">Minimal, clean, and premium customizable styles.</p>
        </Link>
      ))}
    </section>
  );
}
