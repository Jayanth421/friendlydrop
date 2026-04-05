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
        return "This email is already in use. Try logging in instead.";
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

export default function SignupPage() {
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await signup(name, email, password);
      toast.success("Account created");
      router.push("/");
    } catch (error) {
      console.error(error);
      toast.error(getSignupErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="font-display text-3xl font-bold text-ink">Create account</h1>

        <form className="mt-6 space-y-3" onSubmit={onSubmit}>
          <Input placeholder="Name" value={name} onChange={(event) => setName(event.target.value)} required />
          <Input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />
          <Button disabled={submitting} className="w-full" type="submit">
            {submitting ? "Creating..." : "Create Account"}
          </Button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Already have an account? <Link href="/login" className="text-accent">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
