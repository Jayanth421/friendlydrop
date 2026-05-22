import { SignupAuthPanel } from "@/components/shared/signup-auth-panel";
import { getStoreSettings } from "@/lib/firebase/firestore";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const settings = await getStoreSettings();

  return <SignupAuthPanel loginLeftImageUrl={settings.loginLeftImageUrl} />;
}
