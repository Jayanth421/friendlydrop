import { SignupAuthPanel } from "@/components/shared/signup-auth-panel";
import { getStoreSettingsSafe } from "@/lib/firebase/firestore";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const settings = await getStoreSettingsSafe({ logLabel: "signup.page" });

  return <SignupAuthPanel loginLeftImageUrl={settings.loginLeftImageUrl} />;
}

