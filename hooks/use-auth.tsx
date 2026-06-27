"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import {
  getFirebaseAuth,
} from "@/lib/firebase/client";
import { UserRole } from "@/types";

type AuthContextValue = {
  user: User | null;
  role: UserRole;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserRole>;
  signup: (name: string, email: string, password: string, phone?: string, isVendor?: boolean, businessName?: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getSessionRouteHint(response: Response) {
  if (!response.url.includes("/api/auth/session")) {
    return null;
  }

  if (response.status === 404) {
    return "Auth API route not found. Ensure you are using the Next.js app host (for local dev: http://localhost:3000).";
  }

  if (response.status >= 500) {
    return "Auth API is reachable but failing on the server. Check server logs and Firebase env vars.";
  }

  return null;
}

async function readErrorMessage(response: Response) {
  let message: string | undefined;

  try {
    const data = (await response.clone().json()) as { error?: string };
    message = data.error;
  } catch {
    try {
      const text = (await response.clone().text()).trim();
      if (text && !text.startsWith("<!DOCTYPE") && !text.startsWith("<html")) {
        message = text.slice(0, 300);
      }
    } catch {
      message = undefined;
    }
  }

  const hint = getSessionRouteHint(response);
  const fallback = `Request failed with ${response.status}`;

  return [message ?? fallback, hint].filter(Boolean).join(" ");
}

const auth = getFirebaseAuth();

async function syncSession(idToken: string | null, options?: { phone?: string }) {
  if (idToken) {
    const body: { idToken: string; phone?: string } = { idToken };
    if (options?.phone) body.phone = options.phone;

    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const message = await readErrorMessage(response);
      throw new Error(`Could not create server session (${response.status}): ${message}`);
    }

    return;
  }

  const response = await fetch("/api/auth/session", { method: "DELETE" });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(`Could not clear server session (${response.status}): ${message}`);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>("user");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (currentUser) => {
      try {
        setUser(currentUser);

        if (!currentUser) {
          await syncSession(null).catch(() => undefined);
          setRole("user");
          return;
        }

        const idToken = await currentUser.getIdToken();
        await syncSession(idToken);

        const response = await fetch("/api/me", { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          setRole(data.user.role as UserRole);
        }
      } catch (error) {
        console.error(error);
        setUser(null);
        setRole("user");
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role,
      loading,
      login: async (email, password) => {
        const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const idToken = await credential.user.getIdToken();
        await syncSession(idToken);
        setUser(credential.user);
        const response = await fetch("/api/me", { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          const resolvedRole = data.user.role as UserRole;
          setRole(resolvedRole);
          return resolvedRole;
        }
        return "user" as UserRole;
      },
      signup: async (name, email, password, phone, isVendor, businessName) => {
        const signupResponse = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, phone, isVendor, businessName }),
        });

        if (!signupResponse.ok) {
          const message = await readErrorMessage(signupResponse);
          throw new Error(message);
        }

        const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const idToken = await credential.user.getIdToken();
        await syncSession(idToken, { phone });
        setUser(credential.user);
        const meResponse = await fetch("/api/me", { cache: "no-store" });
        if (meResponse.ok) {
          const data = await meResponse.json();
          setRole(data.user.role as UserRole);
        }
      },
      logout: async () => {
        await signOut(auth);
        await syncSession(null);
        setUser(null);
        setRole("user");
      },
      forgotPassword: async (email) => {
        await sendPasswordResetEmail(auth, email.trim(), { url: `${window.location.origin}/reset-password` });
      },
    }),
    [loading, role, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
