"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { FirebaseError } from "firebase/app";
import { Eye, EyeOff } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
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

  const onGoogleSignIn = async () => {
    setSubmitting(true);
    try {
      await loginWithGoogle();
      router.replace(redirect);
    } catch (error) {
      toast.error(getLoginErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="max-w-none py-8 md:py-14">
      <div className="mx-auto w-full max-w-2xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-10">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center font-display text-4xl font-bold tracking-tight text-ink md:text-5xl">
            FriendlyDrop
            <span className="ml-1 text-blue-500">.</span>
          </Link>
          <p className="mt-4 text-lg text-slate-600">Sign in to your account</p>
        </div>

        <Button
          variant="outline"
          className="mt-8 h-14 w-full rounded-2xl border-slate-200 bg-slate-50 text-base font-semibold text-slate-800 hover:bg-slate-100"
          disabled={submitting || loading}
          onClick={onGoogleSignIn}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path
              fill="#EA4335"
              d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.3 14.7 2.4 12 2.4A9.6 9.6 0 0 0 2.4 12c0 5.3 4.3 9.6 9.6 9.6 5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.5z"
            />
            <path fill="#34A853" d="M3.5 7.5 6.7 9.8A6 6 0 0 1 12 5.9c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.3 14.7 2.4 12 2.4c-3.7 0-6.9 2.1-8.5 5.1z" />
            <path fill="#FBBC05" d="M12 21.6c2.6 0 4.8-.9 6.4-2.5l-3-2.4c-.8.6-1.9 1-3.4 1a6 6 0 0 1-5.6-4.1l-3.1 2.4A9.6 9.6 0 0 0 12 21.6z" />
            <path fill="#4285F4" d="M21.1 12.3c0-.6-.1-1.1-.2-1.5H12v3.9h5.5c-.2 1.1-.9 2.2-2.1 3l3 2.4c1.7-1.6 2.7-4 2.7-6.8z" />
          </svg>
          Continue with Google
        </Button>

        <div className="mt-8 flex items-center gap-4 text-sm text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          <span>or sign in with email</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <form className="mt-8 space-y-5" onSubmit={onSubmit}>
          <label className="block text-sm font-semibold text-slate-700">
            Email
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 h-14 rounded-2xl border-slate-200 bg-slate-50 px-4 text-base"
              required
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Password
            <div className="relative mt-2">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-14 rounded-2xl border-slate-200 bg-slate-50 px-4 pr-12 text-base"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </label>

          <Button
            disabled={submitting || loading}
            className="h-14 w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-lg font-semibold text-white shadow-[0_10px_20px_rgba(79,70,229,0.25)] hover:from-indigo-500 hover:to-indigo-500"
            type="submit"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-7 flex items-center justify-between text-sm text-slate-600">
          <Link href="/forgot-password" className="hover:text-indigo-600">Forgot password?</Link>
          <p>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-indigo-600 hover:text-indigo-500">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
