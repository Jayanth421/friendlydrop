import { requireAdmin } from "@/lib/auth/session";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return (
    <main className="space-y-4">
      <AdminTopbar name={user.name} role={user.role} />
      <div className="grid gap-4 lg:grid-cols-[250px_1fr]">
        <AdminSidebar role={user.role} />
        <section className="min-w-0">{children}</section>
      </div>
    </main>
  );
}
