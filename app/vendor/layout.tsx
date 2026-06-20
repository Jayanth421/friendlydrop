import { requireVendorOrAdmin } from "@/lib/auth/session";

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  await requireVendorOrAdmin();

  return children;
}
