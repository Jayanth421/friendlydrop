"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FirebaseError } from "firebase/app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";

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

export default function SignupPage() {
  const { signup, loginWithGoogle, loading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
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
    <main className="max-w-none py-8 md:py-14">
      <div className="mx-auto w-full max-w-2xl rounded-[8px] border border-[#cdced3] bg-[#f7f7f8] p-7 md:p-10">
        <h1 className="text-4xl text-[#0f1b2d] md:text-4xl">Create account</h1>
       

        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <Input
            placeholder="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-14 rounded-xl border-[#ccd2dc] bg-white px-4 text-xl text-[#2a3850] placeholder:text-[#7083a2]"
            required
          />
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-14 rounded-xl border-[#ccd2dc] bg-white px-4 text-xl text-[#0f1b2d] placeholder:text-[#7083a2]"
            required
          />
          <Input
            type="tel"
            placeholder="Mobile number"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="h-14 rounded-xl border-[#ccd2dc] bg-white px-4 text-xl text-[#2a3850] placeholder:text-[#7083a2]"
            required
          />
          <Input
            type="password"
            placeholder="••••••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            className="h-14 rounded-xl border-[#ccd2dc] bg-white px-4 text-xl text-[#0f1b2d] placeholder:text-[#7083a2]"
            required
          />

          <Button
            disabled={submitting || loading}
            className="h-14 w-full rounded-xl bg-black text-[18px] font-medium text-white hover:bg-black/90"
            type="submit"
          >
            {submitting ? "Creating..." : "Create Account"}
          </Button>
        </form>

        <Button
          type="button"
          variant="outline"
          className="mt-3 h-12 w-full rounded-xl border-[#ccd2dc] bg-white text-[18px] text-[#1f2937] hover:bg-[#f8fafc]"
          disabled={submitting || loading}
          onClick={onGoogleSignup}
        >
          <svg viewBox="0 0 24 24" width="25" height="25" aria-hidden="true">
            <path
              fill="#EA4335"
              d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.3 14.7 2.4 12 2.4A9.6 9.6 0 0 0 2.4 12c0 5.3 4.3 9.6 9.6 9.6 5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.5z"
            />
            <path fill="#00ff44" d="M3.5 7.5 6.7 9.8A6 6 0 0 1 12 5.9c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.3 14.7 2.4 12 2.4c-3.7 0-6.9 2.1-8.5 5.1z" />
            <path fill="#FBBC05" d="M12 21.6c2.6 0 4.8-.9 6.4-2.5l-3-2.4c-.8.6-1.9 1-3.4 1a6 6 0 0 1-5.6-4.1l-3.1 2.4A9.6 9.6 0 0 0 12 21.6z" />
            <path fill="#4285F4" d="M21.1 12.3c0-.6-.1-1.1-.2-1.5H12v3.9h5.5c-.2 1.1-.9 2.2-2.1 3l3 2.4c1.7-1.6 2.7-4 2.7-6.8z" />
          </svg>
          Continue with Google
        </Button>

        <p className="mt-5 text-[15px] text-[#000000] md:text-[20px]">
          Already have an account?{" "}
          <Link href="/login" className="text-[#00ff44] hover:text-[#757575]">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
