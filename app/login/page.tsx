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
      <div className="mx-auto w-[full] max-w-2xl rounded-[8px] border border-[#cdced3] bg-[#f7f7f8] p-5 md:p-10">
        <h1 className="text-4xl text-[#0f1b2d] md:text-4xl">Sign in</h1>

        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-14 rounded-xl border-[#ccd2dc] bg-white px-4 text-xl text-[#0f1b2d] placeholder:text-[#7083a2]"
            required
          />
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-14 rounded-xl border-[#ccd2dc] bg-white px-4 pr-12 text-xl text-[#0f1b2d] placeholder:text-[#7083a2]"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7083a2] transition hover:text-[#2a3850]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <Button
            disabled={submitting || loading}
            className="h-14 w-full rounded-xl bg-black text-[20px] font-medium text-white hover:bg-black/90"
            type="submit"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <Button
          type="button"
          variant="outline"
          className="mt-3 h-12 w-full rounded-xl border-[#ccd2dc] bg-white text-[20px] text-[#1f2937] hover:bg-[#f8fafc]"
          disabled={submitting || loading}
          onClick={onGoogleSignIn}
        >
          <svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true">
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

        <div className="mt-5 flex items-center justify-between text-[15px] text-[#2d3f5c] md:text-[20px]">
          <Link href="/forgot-password" className="hover:text-[#2525525]">
            Forgot password?
          </Link>
          <p>
            New here?{" "}
            <Link href="/signup" className="text-[#71f465] hover:text-[#757575]">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
