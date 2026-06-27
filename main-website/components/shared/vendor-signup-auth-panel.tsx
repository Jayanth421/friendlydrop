"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resolveMediaUrl } from "@/lib/media";

interface VendorSignupAuthPanelProps {
  loginLeftImageUrl?: string;
}

function getSignupErrorMessage(error: unknown) {
  if (error instanceof Error) {
    const message = error.message;
    if (message.includes("auth/email-already-in-use")) {
      return "This email is already in use. Try signing in instead.";
    }
    if (message.includes("auth/invalid-email")) {
      return "Please enter a valid email address.";
    }
    if (message.includes("auth/weak-password")) {
      return "Password is too weak. Use at least 6 characters.";
    }
    return message;
  }

  return "Signup failed.";
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "").trim();
}

export function VendorSignupAuthPanel({ loginLeftImageUrl }: VendorSignupAuthPanelProps) {
  const { signup, loading } = useAuth();
  const signupArtwork = resolveMediaUrl(loginLeftImageUrl, { width: 1200, quality: 70, format: "webp" });
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
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

    if (!businessName.trim()) {
      toast.error("Please enter your business name.");
      return;
    }

    setSubmitting(true);

    try {
      await signup(name, email, password, cleanedPhone, true, businessName.trim());
      toast.success("Vendor account created");
      router.push("/vendor/dashboard");
    } catch (error) {
      console.error(error);
      toast.error(getSignupErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-[2px] md:px-8">
      <section className="relative w-full max-w-6xl overflow-y-auto rounded-[16px] border border-[#010101] bg-[#f7f7f7] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.3)] md:max-h-[94vh] md:p-6">
        <Link
          href="/"
          aria-label="Close signup popup"
          className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d2d2d2] bg-white text-[#2f3347] transition hover:bg-[#f4f4f4]"
        >
          <X className="h-4 w-4" />
        </Link>
        <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative hidden min-h-[640px] overflow-hidden rounded-[34px] bg-[#d9d9d9] lg:block">
            {signupArtwork ? (
              <div role="img" aria-label="Signup artwork" className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${signupArtwork})` }} />
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
              <h1 className="text-center text-4xl font-bold text-[#121212] lg:text-left">Become a Seller</h1>
              <p className="mt-2 text-center text-sm text-slate-500 lg:text-left">Register to start selling on FriendlyDrop</p>

              <form className="mt-8 space-y-5" onSubmit={onSubmit}>
                <label className="block">
                  <span className="text-sm text-slate-500">Business Name</span>
                  <Input
                    value={businessName}
                    onChange={(event) => setBusinessName(event.target.value)}
                    placeholder="Your brand or company name"
                    className="mt-1 h-10 rounded-none border-0 border-b border-[#010101] bg-transparent px-0 text-base text-[#131313] placeholder:text-[#8b8b8b] focus-visible:ring-0 focus-visible:ring-offset-0"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-sm text-slate-500">Owner Name</span>
                  <Input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your full name"
                    className="mt-1 h-10 rounded-none border-0 border-b border-[#010101] bg-transparent px-0 text-base text-[#131313] placeholder:text-[#8b8b8b] focus-visible:ring-0 focus-visible:ring-offset-0"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-sm text-slate-500">Email</span>
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="business@example.com"
                    className="mt-1 h-10 rounded-none border-0 border-b border-[#010101] bg-transparent px-0 text-base text-[#131313] placeholder:text-[#8b8b8b] focus-visible:ring-0 focus-visible:ring-offset-0"
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
                    className="mt-1 h-10 rounded-none border-0 border-b border-[#010101] bg-transparent px-0 text-base text-[#131313] placeholder:text-[#8b8b8b] focus-visible:ring-0 focus-visible:ring-offset-0"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-sm text-slate-500">Password</span>
                  <div className="relative mt-1">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="............"
                      minLength={6}
                      className="h-10 rounded-none border-0 border-b border-[#010101] bg-transparent px-0 pr-10 text-base text-[#131313] placeholder:text-[#8b8b8b] focus-visible:ring-0 focus-visible:ring-offset-0"
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
                  className="mt-6 h-14 w-full rounded-full bg-[#12131a] text-base font-medium text-white hover:bg-[#12131a]/90"
                >
                  {submitting ? "Creating..." : "Create Vendor Account"}
                </Button>
              </form>

              <p className="mt-8 text-center text-sm text-slate-500">
                Already a vendor?{" "}
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
