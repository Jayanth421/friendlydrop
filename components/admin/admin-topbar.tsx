"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/types";

export function AdminTopbar({ name, role }: { name: string; role: UserRole }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm text-slate-500">Welcome back</p>
        <h2 className="font-display text-2xl font-semibold text-ink">{name}</h2>
      </div>

      <div className="flex w-full max-w-xl items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
            placeholder="Global admin search: orders, users, products"
          />
        </div>
        <Button variant="secondary" onClick={() => router.push(`/admin/search?q=${encodeURIComponent(query)}`)}>
          Search
        </Button>
      </div>

      <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-600">
        <ShieldCheck className="h-3.5 w-3.5" />
        {role.replace("_", " ")}
      </div>
    </div>
  );
}
