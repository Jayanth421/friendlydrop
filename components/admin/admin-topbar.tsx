"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserRole } from "@/types";
import { cn } from "@/lib/utils";

export function AdminTopbar({
  name,
  role,
}: {
  name: string;
  role: UserRole;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  return (
    <div className="rounded-2xl border border-stone-100 bg-white/90 px-4 py-4 shadow-sm backdrop-blur sm:px-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-3">
          <SidebarTrigger className="hidden h-10 w-10 rounded-xl border border-stone-200 text-stone-600 shadow-sm xl:inline-flex" />

          <div>
            <p className="text-sm text-stone-500">Welcome back</p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center xl:max-w-2xl">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-stone-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-11 rounded-xl border-stone-200 bg-white pl-9"
              placeholder="Global search: orders, products, users"
            />
          </div>
          <Button
            variant="secondary"
            className={cn("h-11 rounded-xl px-5 colour black")}
            onClick={() => router.push(`/admin/search?q=${encodeURIComponent(query)}`)}
          >
            Search
          </Button>
        </div>

        <div className="inline-flex items-center gap-2 self-start rounded-full border border-stone-200 bg-stone-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-stone-600">
          <ShieldCheck className="h-3 w-3" />
          {role.replace("_", " ")}
        </div>
      </div>
    </div>
  );
}
