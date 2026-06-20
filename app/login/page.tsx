import { LoginAuthPanel } from "@/components/shared/login-auth-panel";
import { getStoreSettingsSafe } from "@/lib/firebase/firestore";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const settings = await getStoreSettingsSafe({ logLabel: "login.page" });

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-stone-50">Loading...</div>}>
      <LoginAuthPanel
        storeName={settings.storeName}
        brandPrefix={settings.brandPrefix}
        logoUrl={settings.logoUrl}
        loginLeftImageUrl={settings.loginLeftImageUrl}
      />
    </Suspense>
  );
}

