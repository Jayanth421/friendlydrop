import { CmsPageConfig } from "@/types";
import { resolveMediaUrl } from "@/lib/media";

export function CmsPageContent({
  page,
  fallbackTitle,
  fallbackDescription,
}: {
  page: CmsPageConfig | null;
  fallbackTitle: string;
  fallbackDescription?: string;
}) {
  const title = page?.title || fallbackTitle;
  const content = page?.content?.trim() || fallbackDescription || "";
  const excerpt = page?.excerpt?.trim();
  const heroImage = resolveMediaUrl(page?.heroImageUrl, { width: 1600, quality: 75, format: "webp" });
  const sections = content.split("\n").map((item) => item.trim()).filter(Boolean);

  return (
    <main className="space-y-4">
      <section className="glass-panel overflow-hidden rounded-3xl p-6 md:p-10">
        {heroImage ? (
          <div className="mb-5 overflow-hidden rounded-2xl">
            <img src={heroImage} alt={title} className="h-56 w-full object-cover md:h-72" loading="lazy" />
          </div>
        ) : null}
        <h1 className="font-display text-4xl font-semibold md:text-5xl">{title}</h1>
        {excerpt ? <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">{excerpt}</p> : null}
        <div className="mt-4 space-y-3">
          {sections.map((line, index) => (
            <p key={`${line}-${index}`} className="text-sm leading-7 text-slate-700 dark:text-slate-200">
              {line}
            </p>
          ))}
        </div>
      </section>
    </main>
  );
}
