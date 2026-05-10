import Link from "next/link";
import { Sparkles, ScanFace, WandSparkles, Workflow } from "lucide-react";

const experiences = [
  {
    icon: Sparkles,
    title: "AI Fashion Curation",
    description: "Real-time recommendations tuned by style intent, season, and occasion.",
  },
  {
    icon: ScanFace,
    title: "Virtual Trial Studio",
    description: "Preview silhouettes, drapes, and accessory matching before checkout.",
  },
  {
    icon: WandSparkles,
    title: "Luxury Personalization",
    description: "Monogram, logo print, embroidery, and couture gifting workflows.",
  },
  {
    icon: Workflow,
    title: "Smart Automation",
    description: "Fraud checks, abandoned cart recovery, and campaign-level AI operations.",
  },
];

export function LuxuryExperience() {
  return (
    <section className="grid gap-3 lg:grid-cols-[1.1fr_1fr]">
      <div className="glass-panel rounded-3xl p-6 md:p-8">
        <p className="luxe-chip border-slate-300/70 bg-white/70 text-slate-700 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-200">
          Platform Intelligence
        </p>
        <h2 className="luxury-heading mt-4 text-4xl md:text-5xl">A premium commerce stack designed for fashion scale.</h2>
        <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
          Multi-vendor marketplace, high-speed storefront rendering, and AI-first admin orchestration for modern luxury brands.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/products?sort=newest" className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white dark:bg-white dark:text-black">
            Explore New Arrivals
          </Link>
          <Link href="/admin/builder" className="rounded-full border border-slate-400 px-5 py-2 text-sm font-semibold text-slate-700 dark:border-slate-500 dark:text-slate-100">
            Open Visual Builder
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {experiences.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className="glass-panel rounded-2xl p-4">
              <div className="inline-flex rounded-xl bg-black/90 p-2 text-white dark:bg-white dark:text-black">
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="mt-3 font-display text-2xl font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
