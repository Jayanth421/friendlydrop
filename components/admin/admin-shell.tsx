"use client";

import type { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { AdminFooter } from "@/components/admin/admin-footer";
import { UserRole } from "@/types";

export function AdminShell({
  name,
  role,
  children,
}: {
  name: string;
  role: UserRole;
  children: ReactNode;
}) {
  return (
    <SidebarProvider>
      <AdminSidebar name={name} role={role} />

      <SidebarInset className="bg-stone-10 text-stone-900 grain-texture overflow-hidden">
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <div className="px-3 pt-3 pb-4 lg:px-6 lg:pt-6 lg:pb-6">
            <div className="mb-4 flex items-center gap-3 lg:hidden">
              <SidebarTrigger className="h-10 w-10 rounded-xl border border-stone-200 bg-white text-stone-700 shadow-sm" />
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.18em] text-stone-500">FriendlyDrop Admin</p>
                <p className="truncate text-sm font-semibold text-stone-900">{name}</p>
              </div>
            </div>

            <AdminTopbar name={name} role={role} />
          </div>

          <main className="mx-0 flex-1 max-w-none px-3 pb-4 pt-0 lg:px-6 lg:pb-6">
            <Card className="min-h-[calc(100vh-10rem)] border-stone-200 bg-white/95 shadow-soft">
              <div className="p-4 sm:p-5 lg:p-6">
                {children}
              </div>
            </Card>
            <AdminFooter />
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
