"use client";

import { FormEvent, useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { confirmPasswordReset } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function ResetPasswordContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [accessToken, setAccessToken] = useState(params.get("oobCode") ?? params.get("access_token") ?? "");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (accessToken || typeof window === "undefined") {
      return;
    }

    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const token = hashParams.get("oobCode") ?? hashParams.get("access_token");
    if (token) {
      setAccessToken(token);
    }
  }, [accessToken]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!accessToken) {
      toast.error("Invalid reset link");
      return;
    }

    try {
      const auth = getFirebaseAuth();
      await confirmPasswordReset(auth, accessToken, password);
      toast.success("Password reset successful");
      router.push("/login");
    } catch (error) {
      console.error(error);
      toast.error("Could not reset password. The link may have expired.");
    }
  };

  return (
    <main className="max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="font-display text-3xl font-bold text-ink">Set New Password</h1>
        <form className="mt-5 space-y-3" onSubmit={onSubmit}>
          <Input type="password" placeholder="New password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required />
          <Button className="w-full">Reset Password</Button>
        </form>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="max-w-md p-6 bg-white border border-slate-200 rounded-2xl">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

