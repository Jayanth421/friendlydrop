import { CmsPageContent } from "@/components/cms/cms-page-content";
import { getCmsPageBySlug, getStoreSettingsSafe } from "@/lib/firebase/firestore";

export default async function ContactPage() {
  const [record, settings] = await Promise.all([getCmsPageBySlug("contact"), getStoreSettingsSafe({ logLabel: "contact.page" })]);
  const page = record?.status === "published" ? record : null;

  return (
    <>
      <CmsPageContent
        page={page}
        fallbackTitle="Contact FriendlyDrop"
        fallbackDescription="Reach our concierge for partnership, stylist support, or order assistance."
      />
      <section className="grid gap-3 md:grid-cols-3">
        <article className="glass-panel rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">Email</p>
          <p className="mt-1 text-sm font-semibold">{settings.supportEmail}</p>
        </article>
        <article className="glass-panel rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">Phone</p>
          <p className="mt-1 text-sm font-semibold">{settings.supportPhone}</p>
        </article>
        <article className="glass-panel rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">Response SLA</p>
          <p className="mt-1 text-sm font-semibold">Under 2 business hours</p>
        </article>
      </section>
    </>
  );
}

