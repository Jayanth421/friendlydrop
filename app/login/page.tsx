import { LoginAuthPanel } from "@/components/shared/login-auth-panel";
import { getStoreSettings } from "@/lib/firebase/firestore";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const settings = await getStoreSettings();

  return (
    <LoginAuthPanel
      storeName={settings.storeName}
      brandPrefix={settings.brandPrefix}
      logoUrl={settings.logoUrl}
      loginLeftImageUrl={settings.loginLeftImageUrl}
    />
  );
}
