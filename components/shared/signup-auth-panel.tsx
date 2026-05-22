"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SignupAuthPanelProps {
  loginLeftImageUrl?: string;
}

function getSignupErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/email-already-in-use":
        return "This email is already in use. Try signing in instead.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/weak-password":
        return "Password is too weak. Use at least 6 characters.";
      case "auth/operation-not-allowed":
        return "Email/password sign-up is disabled in Firebase Auth.";
      case "auth/network-request-failed":
        return "Network error. Check your internet and try again.";
      default:
        return `Signup failed (${error.code}).`;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Signup failed.";
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "").trim();
}

export function SignupAuthPanel({ loginLeftImageUrl }: SignupAuthPanelProps) {
  const { signup, loginWithGoogle, loading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanedPhone = normalizePhone(phone);

    if (cleanedPhone.length < 8) {
      toast.error("Please enter a valid mobile number.");
      return;
    }

    setSubmitting(true);

    try {
      await signup(name, email, password, cleanedPhone);
      toast.success("Account created");
      router.push("/");
    } catch (error) {
      console.error(error);
      toast.error(getSignupErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogleSignup = async () => {
    setSubmitting(true);
    try {
      await loginWithGoogle();
      toast.success("Signed in with Google");
      router.push("/");
    } catch (error) {
      toast.error(getSignupErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="max-w-none px-4 py-8 md:px-8 md:py-14">
      <section className="mx-auto max-w-6xl rounded-[16px] border border-[#010101] bg-[#f7f7f7] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.04)] md:p-6">
        <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative hidden min-h-[640px] overflow-hidden rounded-[34px] bg-[#d9d9d9] lg:block">
            {loginLeftImageUrl ? (
              <div role="img" aria-label="Signup artwork" className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${loginLeftImageUrl})` }} />
            ) : (
              <>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,#f8f8f8_0,#d8d8d8_62%)]" />
                <div className="absolute -left-16 -top-16 h-72 w-72 rounded-full border-[24px] border-[#dbaf2f] opacity-90" />
                <div className="absolute right-12 top-16 h-44 w-44 rounded-full bg-[#5b73ff]/85 blur-[1px]" />
                <div className="absolute bottom-[-44px] left-[-20px] h-40 w-24 rounded-full bg-[#5f66ff]/90" />
                <div className="absolute bottom-[-28px] right-[-18px] h-56 w-32 rotate-[22deg] rounded-[42px] bg-[#4a58ff]/90" />
              </>
            )}
          </div>

          <div className="flex items-center">
            <div className="w-full px-1 py-3 sm:px-5 lg:px-9">
              <h1 className="text-center text-4xl font-bold text-[#121212] lg:text-left">Create Account</h1>
              <p className="mt-2 text-center text-sm text-slate-500 lg:text-left">Enter your details below</p>

              <form className="mt-10 space-y-7" onSubmit={onSubmit}>
                <label className="block">
                  <span className="text-sm text-slate-500">Name</span>
                  <Input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your full name"
                    className="mt-2 h-11 rounded-none border-0 border-b border-[#010101] bg-transparent px-0 text-base text-[#131313] placeholder:text-[#8b8b8b] focus-visible:ring-0 focus-visible:ring-offset-0"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-sm text-slate-500">Email</span>
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
                  <span className="text-sm text-slate-500">Mobile number</span>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="+91 98765 43210"
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
                      placeholder="............"
                      minLength={6}
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

                <Button
                  type="submit"
                  disabled={submitting || loading}
                  className="h-14 w-full rounded-full bg-[#12131a] text-base font-medium text-white hover:bg-[#12131a]/90"
                >
                  {submitting ? "Creating..." : "Create Account"}
                </Button>
              </form>

              <Button
                type="button"
                variant="outline"
                className="mt-4 h-12 w-full rounded-full border-[#010101] bg-[#f1f1f1] text-sm font-medium text-[#242424] hover:bg-[#e9e9e9]"
                disabled={submitting || loading}
                onClick={onGoogleSignup}
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
                Sign up with Google
              </Button>

              <p className="mt-10 text-center text-sm text-slate-500">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-slate-900 hover:text-slate-700">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
