import { requireVendorOrAdmin } from "@/lib/auth/session";
import { getUserById } from "@/lib/firebase/firestore";
import { VendorShell } from "@/components/vendor/vendor-shell";
import { notFound } from "next/navigation";

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireVendorOrAdmin();
  const profile = await getUserById(user.uid);

  if (!profile) {
    notFound();
  }

  return (
    <VendorShell
      name={profile.name || "Store"}
      email={profile.email}
      phone={profile.phone}
    >
      {children}
    </VendorShell>
  );
}

