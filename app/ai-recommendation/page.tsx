import Link from "next/link";
import { Sparkles, Mic, ScanSearch, MessageCircle } from "lucide-react";
import { ProductGrid } from "@/components/product/product-grid";
import { getProducts } from "@/lib/firebase/firestore";

const recommendationSignals = [
  {
    icon: Mic,
    title: "Voice Prompt Styling",
    description: "Describe an event and get instant outfit and accessory matching.",
  },
  {
    icon: ScanSearch,
    title: "Smart Visual Search",
    description: "Upload references to discover similar silhouettes and fabric moods.",
  },
  {
    icon: MessageCircle,
    title: "AI Concierge Chat",
    description: "Chat with a brand assistant trained on collections and lookbook logic.",
  },
];

export default async function AiRecommendationPage() {
  const products = await getProducts({ sort: "popularity" });
  const picks = products.slice(0, 8);

  return (
    <main className="space-y-6">
      <section className="glass-panel rounded-3xl p-6 md:p-10">
        <p className="luxe-chip border-slate-300 bg-white/70 text-slate-700 dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-200">
          AI Recommendation Studio
        </p>
        <h1 className="luxury-heading mt-4 text-4xl md:text-6xl">Find your next signature look in seconds.</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
          Our recommendation engine combines style preferences, trending demand, and fit intent to rank luxury-ready products for each customer.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/products" className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white dark:bg-white dark:text-black">
            Explore All Products
          </Link>
          <Link href="/search" className="rounded-full border border-slate-400 px-5 py-2 text-sm font-semibold text-slate-700 dark:border-slate-500 dark:text-slate-100">
            Start Smart Search
          </Link>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {recommendationSignals.map((signal) => {
          const Icon = signal.icon;
          return (
            <article key={signal.title} className="glass-panel rounded-2xl p-4">
              <div className="inline-flex rounded-xl bg-black p-2 text-white dark:bg-white dark:text-black">
                <Icon className="h-4 w-4" />
              </div>
              <h2 className="mt-3 font-display text-2xl font-semibold">{signal.title}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{signal.description}</p>
            </article>
          );
        })}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="luxury-heading text-3xl font-semibold">Recommended for You</h2>
          <span className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">
            <Sparkles className="h-3.5 w-3.5" /> AI ranked
          </span>
        </div>
        <ProductGrid products={picks} />
      </section>
    </main>
  );
}
