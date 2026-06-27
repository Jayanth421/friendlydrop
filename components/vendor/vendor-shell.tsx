"use client";

import { ReactNode, Suspense } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import { VendorSidebar } from "@/components/vendor/vendor-sidebar";
import { VendorTopbar } from "@/components/vendor/vendor-topbar";
import { VendorFooter } from "@/components/vendor/vendor-footer";

export function VendorShell({
  name,
  email,
  phone,
  children,
}: {
  name: string;
  email?: string;
  phone?: string;
  children: ReactNode;
}) {
  return (
    <SidebarProvider>
      <Suspense fallback={<div className="w-64 bg-deep-navy h-screen" />}>
        <VendorSidebar name={name} email={email} phone={phone} />
      </Suspense>

      <SidebarInset className="bg-stone-10 text-stone-900 grain-texture overflow-hidden">
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <div className="px-3 pt-3 pb-4 lg:px-6 lg:pt-6 lg:pb-6">
            <div className="mb-4 flex items-center gap-3 lg:hidden">
              <SidebarTrigger className="h-10 w-10 rounded-xl border border-stone-200 bg-white text-stone-700 shadow-sm" />
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.18em] text-stone-500">FriendlyDrop Vendor</p>
                <p className="truncate text-sm font-semibold text-stone-900">{name}</p>
              </div>
            </div>

            <VendorTopbar name={name} />
          </div>

          <main className="mx-0 flex-1 max-w-none px-3 pb-4 pt-0 lg:px-6 lg:pb-6">
            <Card className="min-h-[calc(100vh-10rem)] border-stone-200 bg-white/95 shadow-soft">
              <div className="p-4 sm:p-5 lg:p-6">
                {children}
              </div>
            </Card>
            <VendorFooter />
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
