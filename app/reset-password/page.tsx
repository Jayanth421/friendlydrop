"use client";

import { FormEvent, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { confirmPasswordReset } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();
  const oobCode = params.get("oobCode");
  const [password, setPassword] = useState("");

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!oobCode) {
      toast.error("Invalid reset link");
      return;
    }

    try {
      await confirmPasswordReset(firebaseAuth, oobCode, password);
      toast.success("Password reset successful");
      router.push("/login");
    } catch {
      toast.error("Could not reset password");
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
