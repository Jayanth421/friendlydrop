"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LoginAuthPanelProps {
  storeName: string;
  brandPrefix?: string;
  logoUrl?: string;
  loginLeftImageUrl?: string;
}

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

export function LoginAuthPanel({ storeName, brandPrefix, logoUrl, loginLeftImageUrl }: LoginAuthPanelProps) {
  const { login, loginWithGoogle, loading, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();

  const brandName = brandPrefix?.trim() ? `${brandPrefix.trim()} ${storeName}` : storeName;

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

  const avatarLabel = brandName.trim().charAt(0).toUpperCase() || "F";

  return (
    <main className="max-w-none px-4 py-8 md:px-8 md:py-14">
      <div className="mx-auto mb-6 flex w-fit items-center gap-3  px-50 py-15 ">
        
        
      </div>

      <section className="mx-auto max-w-6xl rounded-[16px] border border-[#010101] bg-[#f7f7f7] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.04)] md:p-6">
        <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative hidden min-h-[640px] overflow-hidden rounded-[34px] bg-[#d9d9d9] lg:block">
            {loginLeftImageUrl ? (
              <div role="img" aria-label="Login artwork" className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${loginLeftImageUrl})` }} />
            ) : (
              <>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,#f8f8f8_0,#d8d8d8_62%)]" />
                <div className="absolute -left-16 -top-16 h-72 w-72 rounded-full border-[24px] border-[#dbaf2f] opacity-90" />
                <div className="absolute right-12 top-16 h-44 w-44 rounded-full bg-[#5b73ff]/85 blur-[1px]" />
                <div className="absolute bottom-[-44px] left-[-20px] h-40 w-24 rounded-full bg-[#5f66ff]/90" />
                <div className="absolute bottom-[-28px] right-[-18px] h-56 w-32 rounded-[42px] bg-[#4a58ff]/90 rotate-[22deg]" />
              </>
            )}
          </div>

          <div className="flex items-center">
            <div className="w-full px-1 py-3 sm:px-5 lg:px-9">
              

              <h1 className="text-center text-4xl font-bold text-[#121212] lg:text-left">Welcome Back!</h1>
              <p className="mt-2 text-center text-sm text-slate-500 lg:text-left">Enter your details below</p>

              <form className="mt-10 space-y-7" onSubmit={onSubmit}>
                <label className="block">
                  <span className="text-sm text-#010101 text-slate-500">Email</span>
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="hello@example.com"
                    className="mt-2 h-11 rounded-none border-0 border-b border-[#010101] bg-transparent px-0 text-base text-[#131313] placeholder:text-[#8b8b8b] focus-visible:ring-0 focus-visible:ring-offset-0"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-sm text-slate-500">Password</span>
                  <div className="relative mt-2">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••••••"
                      className="h-11 rounded-none border-0 border-b border-[#010101] bg-transparent px-0 pr-10 text-base text-[#131313] placeholder:text-[#8b8b8b] focus-visible:ring-0 focus-visible:ring-offset-0"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>

                <div className="flex items-center justify-between text-sm text-slate-500">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      className="size-4 rounded border-slate-300"
                    />
                    Remember me
                  </label>
                  <Link href="/forgot-password" className="hover:text-slate-700">
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  disabled={submitting || loading}
                  className="h-14 w-full rounded-full bg-[#12131a] text-base font-medium text-white hover:bg-[#12131a]/90"
                >
                  {submitting ? "Signing in..." : "Log in"}
                </Button>
              </form>

              <Button
                type="button"
                variant="outline"
                className="mt-4 h-12 w-full rounded-full border-[#010101] bg-[#f1f1f1] text-sm font-medium text-[#242424] hover:bg-[#e9e9e9]"
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
                Log in with Google
              </Button>

              <p className="mt-10 text-center  text-sm text-slate-500">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="font-semibold text-slate-900 hover:text-slate-700">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
