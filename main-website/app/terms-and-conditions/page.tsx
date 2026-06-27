import { CmsPageContent } from "@/components/cms/cms-page-content";
import { getCmsPageBySlug } from "@/lib/firebase/firestore";

export default async function TermsAndConditionsPage() {
  const record = await getCmsPageBySlug("terms-and-conditions");
  const page = record?.status === "published" ? record : null;

  return (
    <CmsPageContent
      page={page}
      fallbackTitle="Terms and Conditions"
      fallbackDescription="By placing orders, users agree to our fulfillment timelines, returns workflow, anti-fraud checks, and account usage policies."
    />
  );
}

