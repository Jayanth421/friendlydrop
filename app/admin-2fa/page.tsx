"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminTwoFactorPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/dashboard");
  }, [router]);

  return (
    <main className="max-w-md">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="font-display text-3xl font-bold text-ink">Admin Verification Removed</h1>
        <p className="mt-2 text-sm text-slate-600">Redirecting you to the admin dashboard.</p>
      </div>
    </main>
  );
}
