import Link from "next/link";
import { requireVendorOrAdmin } from "@/lib/auth/session";

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireVendorOrAdmin();

  return (
    <main className="space-y-4">
      <header className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Vendor Console</p>
        <div className="mt-1 flex items-center justify-between">
          <h1 className="font-display text-2xl font-semibold text-ink">{user.name}</h1>
          <nav className="flex gap-3 text-sm">
            <Link href="/vendor/dashboard" className="rounded border border-slate-200 px-2 py-1">
              Dashboard
            </Link>
            <Link href="/admin/control-tower" className="rounded border border-slate-200 px-2 py-1">
              Admin Control Tower
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </main>
  );
}
