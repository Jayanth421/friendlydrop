"use client";

import { PropsWithChildren } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/hooks/use-auth";
import { StoreSync } from "@/components/providers/store-sync";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AuthProvider>
      <StoreSync />
      {children}
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}
