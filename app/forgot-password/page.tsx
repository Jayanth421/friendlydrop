"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
function getResetLinkErrorMessage(error: unknown) {
  if (error instanceof Error) {
    const message = error.message;
    if (message.includes("auth/invalid-email")) {
      return "Enter a valid email address.";
    }
    if (message.includes("auth/too-many-requests")) {
      return "Too many attempts. Please wait a bit and try again.";
    }
    return message;
  }
  return "Could not send reset link. Please try again.";
}

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await forgotPassword(email);
      toast.success("Password reset email sent");
    } catch (error) {
      console.error(error);
      toast.error(getResetLinkErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="font-display text-3xl font-bold text-ink">Forgot Password</h1>
        <p className="mt-2 text-sm text-slate-600">We will email you a reset link.</p>

        <form className="mt-5 space-y-3" onSubmit={onSubmit}>
          <Input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <Button className="w-full" disabled={submitting}>
            {submitting ? "Sending..." : "Send Reset Email"}
          </Button>
        </form>
      </div>
    </main>
  );
}
