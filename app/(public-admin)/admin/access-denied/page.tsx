import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";

export default async function AdminAccessDeniedPage() {
  const user = await getSessionUser();

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Admin access required</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950">This account cannot open the admin panel yet.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {user
            ? `Signed in as ${user.email || user.name} with role "${user.role}". Ask a super admin to set this user to staff, manager, admin, or super_admin.`
            : "Please log in with an admin account."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/login?redirect=%2Fadmin%2Fdashboard">Login Again</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
