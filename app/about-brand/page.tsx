import { CmsPageContent } from "@/components/cms/cms-page-content";
import { getCmsPageBySlug } from "@/lib/firebase/firestore";

export default async function AboutBrandPage() {
  const record = await getCmsPageBySlug("about-brand");
  const page = record?.status === "published" ? record : null;

  return (
    <CmsPageContent
      page={page}
      fallbackTitle="About Brand"
      fallbackDescription="FriendlyDrop is evolving into a premium multi-vendor fashion destination focused on personalization, fast operations, and elevated digital experience."
    />
  );
}

