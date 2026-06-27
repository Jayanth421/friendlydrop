import { Metadata } from "next";
import { notFound } from "next/navigation";
import { CmsPageContent } from "@/components/cms/cms-page-content";
import { getCmsPageBySlug } from "@/lib/firebase/firestore";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const page = await getCmsPageBySlug(params.slug);
  if (!page || page.status !== "published") {
    return {};
  }

  return {
    title: page.seo?.metaTitle || page.title,
    description: page.seo?.metaDescription || page.excerpt || "",
  };
}

export default async function CmsDynamicPage({ params }: { params: { slug: string } }) {
  const page = await getCmsPageBySlug(params.slug);

  if (!page || page.status !== "published") {
    notFound();
  }

  return <CmsPageContent page={page} fallbackTitle={page.title} fallbackDescription={page.content} />;
}
