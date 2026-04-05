"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { FirebaseError } from "firebase/app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";

function getLoginErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
      case "auth/invalid-login-credentials":
        return "Invalid email or password.";
      case "auth/too-many-requests":
        return "Too many attempts. Please wait and try again.";
      case "auth/network-request-failed":
        return "Network error. Check your internet and try again.";
      default:
        return `Login failed (${error.code}).`;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Login failed.";
}

export default function LoginPage() {
  const { login, loginWithGoogle, loading, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const redirect = useMemo(() => {
    const target = searchParams.get("redirect") ?? "/account";

    if (!target.startsWith("/") || target === "/login") {
      return "/account";
    }

    return target;
  }, [searchParams]);

  useEffect(() => {
    if (!loading && user) {
      router.replace(redirect);
    }
  }, [loading, redirect, router, user]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success("Welcome back");
      router.replace(redirect);
    } catch (error) {
      console.error(error);
      toast.error(getLoginErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="font-display text-3xl font-bold text-ink">Sign in</h1>
        <p className="mt-2 text-sm text-slate-600">Continue to FriendlyDrop</p>

        <form className="mt-6 space-y-3" onSubmit={onSubmit}>
          <Input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <Button disabled={submitting || loading} className="w-full" type="submit">
            {submitting ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <Button
          variant="secondary"
          className="mt-3 w-full"
          onClick={async () => {
            try {
              await loginWithGoogle();
              router.replace(redirect);
            } catch (error) {
              toast.error(getLoginErrorMessage(error));
            }
          }}
        >
          Continue with Google
        </Button>

        <div className="mt-4 flex justify-between text-sm">
          <Link href="/forgot-password" className="text-accent">Forgot password?</Link>
          <Link href="/signup" className="text-accent">Create account</Link>
        </div>
      </div>
    </main>
  );
}
