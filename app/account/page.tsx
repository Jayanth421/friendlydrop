import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <main className="space-y-5 max-w-2xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="font-display text-3xl font-bold text-ink">My Account</h1>
        <p className="mt-3 text-sm text-slate-600">Name: {user.name}</p>
        <p className="text-sm text-slate-600">Email: {user.email}</p>
        <p className="text-sm text-slate-600">Role: {user.role}</p>

        <div className="mt-5 flex gap-3">
          <Link href="/orders"><Button>View Orders</Button></Link>
          <Link href="/wishlist"><Button variant="secondary">Wishlist</Button></Link>
        </div>
      </div>
    </main>
  );
}
