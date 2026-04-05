"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AdminTwoFactorPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const requestCode = async () => {
    setLoading(true);
    const response = await fetch("/api/admin/2fa/request", { method: "POST" });
    setLoading(false);

    if (!response.ok) {
      toast.error("Could not send verification code");
      return;
    }

    toast.success("Verification code sent");
  };

  const verify = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    const response = await fetch("/api/admin/2fa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    setLoading(false);

    if (!response.ok) {
      toast.error("Invalid code");
      return;
    }

    toast.success("2FA verified");
    router.push("/admin/dashboard");
  };

  return (
    <main className="max-w-md">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="font-display text-3xl font-bold text-ink">Admin Verification</h1>
        <p className="mt-2 text-sm text-slate-600">Enter the 6-digit code sent to your admin email.</p>

        <button onClick={requestCode} disabled={loading} className="mt-4 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white">
          {loading ? "Sending..." : "Send Code"}
        </button>

        <form onSubmit={verify} className="mt-4 space-y-2">
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="123456"
            className="h-10 w-full rounded-md border border-slate-200 px-3"
            maxLength={6}
          />
          <button className="w-full rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white">Verify</button>
        </form>
      </div>
    </main>
  );
}
