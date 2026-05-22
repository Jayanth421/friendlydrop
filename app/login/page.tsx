import { LoginAuthPanel } from "@/components/shared/login-auth-panel";
import { getStoreSettingsSafe } from "@/lib/firebase/firestore";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const settings = await getStoreSettingsSafe({ logLabel: "login.page" });

  return (
    <LoginAuthPanel
      storeName={settings.storeName}
      brandPrefix={settings.brandPrefix}
      logoUrl={settings.logoUrl}
      loginLeftImageUrl={settings.loginLeftImageUrl}
    />
  );
}
