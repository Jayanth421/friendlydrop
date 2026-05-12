"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  User,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { UserRole } from "@/types";

type AuthContextValue = {
  user: User | null;
  role: UserRole;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
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
    return "Auth API is reachable but failing on the server. Check server logs and Firebase admin env vars.";
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

async function syncSession(user: User | null, options?: { phone?: string }) {
  if (user) {
    const idToken = await user.getIdToken(true);

    const body: { idToken: string; phone?: string } = { idToken };
    if (options?.phone) {
      body.phone = options.phone;
    }

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
    const unsub = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      setUser(firebaseUser);

      try {
        await syncSession(firebaseUser);
      } catch (error) {
        console.error(error);

        if (firebaseUser) {
          await signOut(firebaseAuth).catch(() => undefined);
          setUser(null);
        }

        setRole("user");
        setLoading(false);
        return;
      }

      if (firebaseUser) {
        const response = await fetch("/api/me", { cache: "no-store" });

        if (response.ok) {
          const data = await response.json();
          setRole(data.user.role as UserRole);
        }
      } else {
        setRole("user");
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role,
      loading,
      login: async (email, password) => {
        try {
          const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
          await syncSession(cred.user);
        } catch (error) {
          await signOut(firebaseAuth).catch(() => undefined);
          throw error;
        }
      },
      signup: async (name, email, password, phone) => {
        try {
          const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
          await updateProfile(cred.user, { displayName: name });
          await syncSession(cred.user, { phone });
        } catch (error) {
          await signOut(firebaseAuth).catch(() => undefined);
          throw error;
        }
      },
      loginWithGoogle: async () => {
        try {
          const cred = await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
          await syncSession(cred.user);
        } catch (error) {
          await signOut(firebaseAuth).catch(() => undefined);
          throw error;
        }
      },
      logout: async () => {
        await signOut(firebaseAuth);
        await syncSession(null);
      },
      forgotPassword: async (email) => {
        await sendPasswordResetEmail(firebaseAuth, email.trim(), {
          url: `${window.location.origin}/login`,
        });
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
