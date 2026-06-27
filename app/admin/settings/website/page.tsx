import { requireAdminPermission } from "@/lib/auth/session";
import { getCmsPages, getStoreSettings } from "@/lib/firebase/firestore";
import { WebsiteSettingsForm, type WebsiteSettingsData } from "@/components/admin/website-settings-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Website Settings" };

export default async function WebsiteSettingsPage() {
  await requireAdminPermission("settings:manage");
  const [s, cmsPages] = await Promise.all([getStoreSettings(), getCmsPages()]);

  // Cast to access extra fields stored freely in Firestore
  const extra = s as unknown as Record<string, unknown>;

  const initial: WebsiteSettingsData = {
    storeName: s.storeName ?? "",
    brandPrefix: s.brandPrefix ?? "",
    brandTagline: s.brandTagline ?? "",
    brandDescription: (extra.brandDescription as string) ?? "",
    logoUrl: s.logoUrl ?? "",
    faviconUrl: (extra.faviconUrl as string) ?? "",
    supportEmail: s.supportEmail ?? "",
    supportPhone: s.supportPhone ?? "",
    orgName: (extra.orgName as string) ?? s.storeName ?? "",
    address: (extra.address as string) ?? "",
    landingPage: (extra.landingPage as string) ?? "home",
  };

  const cmsOptions = cmsPages
    .filter((p) => p.status === "published")
    .map((p) => ({ value: p.slug, label: p.title }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <WebsiteSettingsForm initial={initial} cmsPageOptions={cmsOptions} />
    </div>
  );
}
