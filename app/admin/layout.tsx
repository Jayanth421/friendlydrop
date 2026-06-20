import { requireAdmin } from "@/lib/auth/session";
import { AdminShell } from "@/components/admin/admin-shell";
import type { ReactNode } from "react";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();

  return <AdminShell name={user.name} role={user.role}>{children}</AdminShell>;
}
