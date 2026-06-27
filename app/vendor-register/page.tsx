import { VendorSignupAuthPanel } from "@/components/shared/vendor-signup-auth-panel";
import { getStoreSettingsSafe } from "@/lib/firebase/firestore";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Seller Registration",
  description: "Register to become a seller on our platform",
};

export default async function VendorRegisterPage() {
  const settings = await getStoreSettingsSafe({ logLabel: "vendor-register.page" });

  return <VendorSignupAuthPanel loginLeftImageUrl={settings.loginLeftImageUrl} />;
}
