import { CmsPageContent } from "@/components/cms/cms-page-content";
import { getCmsPageBySlug } from "@/lib/firebase/firestore";

export default async function PrivacyPolicyPage() {
  const record = await getCmsPageBySlug("privacy-policy");
  const page = record?.status === "published" ? record : null;

  return (
    <CmsPageContent
      page={page}
      fallbackTitle="Privacy Policy"
      fallbackDescription="We process customer data for account security, order fulfillment, personalization, and fraud prevention. Sensitive payment data stays with certified payment providers."
    />
  );
}

