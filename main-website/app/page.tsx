import { redirect } from "next/navigation";
import { EverlaneHome } from "@/components/home/everlane-home";
import { getCmsPageBySlug, getFeaturedProducts, getProducts, getStoreSettings } from "@/lib/firebase/firestore";
import { CmsPageContent } from "@/components/cms/cms-page-content";
import { getBanners } from "@/lib/enterprise";

export default async function HomePage() {
  const settings = await getStoreSettings();
  const landingPage = (settings as unknown as Record<string, unknown>).landingPage as string | undefined ?? "home";

  // ── Redirect to non-home landing pages ─────────────────────────────────────
  if (landingPage === "shop") redirect("/products");
  if (landingPage === "login") redirect("/login");

  // ── Custom CMS page as landing page ────────────────────────────────────────
  if (landingPage !== "home") {
    const cmsPage = await getCmsPageBySlug(landingPage);
    if (cmsPage?.status === "published") {
      return (
        <div className="mx-auto max-w-5xl px-4 py-8">
          <CmsPageContent page={cmsPage} fallbackTitle={cmsPage.title} />
        </div>
      );
    }
    // If CMS page not found/published, fall through to default home
  }

  // ── Default home page ───────────────────────────────────────────────────────
  const [featuredProducts, latestProducts, allProducts, homeCmsPage, heroBanners] = await Promise.all([
    getFeaturedProducts(),
    getProducts({ sort: "newest" }),
    getProducts(),
    getCmsPageBySlug("home"),
    getBanners(),
  ]);

  const activeHeroBanners = heroBanners.filter((b) => b.active);

  return (
    <EverlaneHome
      featuredProducts={featuredProducts}
      latestProducts={latestProducts}
      allProducts={allProducts}
      cmsPage={homeCmsPage?.status === "published" ? homeCmsPage : null}
      heroBanners={activeHeroBanners}
    />
  );
}