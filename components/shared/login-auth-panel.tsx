"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resolveMediaUrl } from "@/lib/media";
interface LoginAuthPanelProps {
  storeName: string;
  brandPrefix?: string;
  logoUrl?: string;
  loginLeftImageUrl?: string;
}

function getLoginErrorMessage(error: unknown) {
  if (error instanceof Error) {
    const message = error.message;
    if (message.includes("auth/invalid-credential") || message.includes("auth/user-not-found") || message.includes("auth/wrong-password")) {
      return "Invalid email or password.";
    }
    if (message.includes("auth/too-many-requests")) {
      return "Too many attempts. Please wait and try again.";
    }
    return message;
  }

  return "Login failed.";
}

/**
 * Returns the internal route for a given role.
 * Returns null for regular "user" role (stays on main app).
 */
const ADMIN_ROLES = new Set(["staff", "manager", "admin", "super_admin"]);

/**
 * Returns the full URL to redirect to after login, based on the user's role.
 * - Vendors  → vendor.friendlydrop.in (or vendor.localhost:PORT in dev)
 * - Admins   → admin.friendlydrop.in  (or admin.localhost:PORT in dev)
 * - Customers → null (stays on main domain)
 */
function getRoleRedirectUrl(role: string): string | null {
  const vendorUrl = process.env.NEXT_PUBLIC_VENDOR_URL;
  const adminUrl  = process.env.NEXT_PUBLIC_ADMIN_URL;

  // Fall back to subdomain.localhost when env vars aren't set (local dev)
  const isLocalhost =
    typeof window !== "undefined" && window.location.hostname === "localhost";
  const port = typeof window !== "undefined" ? window.location.port : "3000";

  if (role === "vendor") {
    if (vendorUrl) return `${vendorUrl}/dashboard`;
    if (isLocalhost) return `http://vendor.localhost:${port}/dashboard`;
    return "https://vendor.friendlydrop.in/dashboard";
  }

  if (ADMIN_ROLES.has(role)) {
    if (adminUrl) return `${adminUrl}/control-tower`;
    if (isLocalhost) return `http://admin.localhost:${port}/control-tower`;
    return "https://admin.friendlydrop.in/control-tower";
  }

  return null; // Regular customer stays on main domain
}

/** @deprecated Use getRoleRedirectUrl instead */
function getRoleRedirectPath(role: string): string | null {
  if (role === "vendor") return "/vendor/dashboard";
  if (ADMIN_ROLES.has(role)) return "/admin/dashboard";
  return null;
}

export function LoginAuthPanel({ storeName, brandPrefix, logoUrl, loginLeftImageUrl }: LoginAuthPanelProps) {
  const { login, loading, user, role } = useAuth();
  const loginArtwork = resolveMediaUrl(loginLeftImageUrl, { width: 1200, quality: 70, format: "webp" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();

  const brandName = brandPrefix?.trim() ? `${brandPrefix.trim()} ${storeName}` : storeName;

  const redirect = useMemo(() => {
    const target = searchParams.get("redirect") ?? "/";

    if (!target.startsWith("/") || target === "/login") {
      return "/";
    }

    return target;
  }, [searchParams]);

  useEffect(() => {
    if (!loading && user) {
      const redirectUrl = getRoleRedirectUrl(role);
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        router.replace(redirect);
      }
    }
  }, [loading, redirect, role, router, user]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const resolvedRole = await login(email, password);
      toast.success("Welcome back");
      const redirectUrl = getRoleRedirectUrl(resolvedRole);
      if (redirectUrl) {
        // Full navigation to the correct subdomain
        window.location.href = redirectUrl;
      } else {
        router.replace(redirect);
      }
    } catch (error) {
      console.error(error);
      toast.error(getLoginErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-[2px] md:px-8">
      <section className="relative w-full max-w-6xl overflow-y-auto rounded-[16px] border border-[#010101] bg-[#f7f7f7] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.3)] md:max-h-[94vh] md:p-6">
        <Link
          href="/"
          aria-label="Close login popup"
          className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d2d2d2] bg-white text-[#2f3347] transition hover:bg-[#f4f4f4]"
        >
          <X className="h-4 w-4" />
        </Link>
        <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative hidden min-h-[640px] overflow-hidden rounded-[34px] bg-[#d9d9d9] lg:block">
            {loginArtwork ? (
              <div role="img" aria-label="Login artwork" className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${loginArtwork})` }} />
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
