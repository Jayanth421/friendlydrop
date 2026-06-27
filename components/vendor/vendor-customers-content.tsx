"use client";

import { useState } from "react";
import { Search, Users, ShoppingBag, Mail, Phone, Star, ChevronRight, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { UserProfile } from "@/types";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  orderCount: number;
  totalSpend: number;
  lastOrder: string;
  segment: "new" | "repeat" | "vip";
  rating?: number;
}


function segmentBadge(segment: Customer["segment"]) {
  switch (segment) {
    case "vip": return <Badge className="bg-violet-50 text-violet-700 border border-violet-200 text-xs">VIP</Badge>;
    case "repeat": return <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-xs">Repeat</Badge>;
    case "new": return <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs">New</Badge>;
  }
}

export function VendorCustomersContent({ initialCustomers }: { initialCustomers: UserProfile[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "vip" | "repeat" | "new">("all");
  const [selected, setSelected] = useState<Customer | null>(null);

  const customers: Customer[] = initialCustomers.map(u => ({
    id: u.id,
    name: u.name || "Unknown",
    email: u.email,
    phone: u.phone || "N/A",
    orderCount: u.orderCount || 1,
    totalSpend: u.totalSpend || 0,
    lastOrder: u.lastCartActivityAt || u.createdAt,
    segment: u.segment || "new",
    rating: 0
  }));

  const filtered = customers.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || c.segment === filter;
    return matchSearch && matchFilter;
  });

  const totalCustomers = customers.length;
  const vipCount = customers.filter((c) => c.segment === "vip").length;
  const totalRevenue = customers.reduce((s, c) => s + c.totalSpend, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-stone-900">Customers</h1>
        <p className="mt-0.5 text-sm text-stone-500">Manage your customer base and view purchase history</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Customers", value: totalCustomers, icon: Users, color: "stone" },
          { label: "VIP Customers", value: vipCount, icon: Star, color: "violet" },
          { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString("en-IN")}`, icon: ShoppingBag, color: "stone" },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-stone-200 bg-stone-50">
                <Icon className="h-5 w-5 text-stone-700" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">{label}</p>
                <p className="text-xl font-bold text-stone-900">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-xl border-stone-200" placeholder="Search customers..." />
        </div>
        <div className="flex gap-1 rounded-xl border border-stone-200 bg-stone-50 p-1">
          {(["all", "vip", "repeat", "new"] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${filter === f ? "bg-stone-900 text-white" : "text-stone-600 hover:text-stone-900"}`}
            >
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Cards */}
      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelected(selected?.id === c.id ? null : c)}
            className="rounded-xl border border-stone-200 bg-white p-4 text-left shadow-sm hover:border-stone-400 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-900 text-sm font-bold text-white">
                  {c.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-stone-900">{c.name}</p>
                  <p className="truncate text-xs text-stone-500">{c.email}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {segmentBadge(c.segment)}
                <ChevronRight className={`h-4 w-4 text-stone-400 transition ${selected?.id === c.id ? "rotate-90" : ""}`} />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-stone-50 px-2 py-1.5">
                <p className="text-xs text-stone-500">Orders</p>
                <p className="text-sm font-bold text-stone-900">{c.orderCount}</p>
              </div>
              <div className="rounded-lg bg-stone-50 px-2 py-1.5">
                <p className="text-xs text-stone-500">Total Spend</p>
                <p className="text-sm font-bold text-stone-900">₹{c.totalSpend.toLocaleString("en-IN")}</p>
              </div>
              <div className="rounded-lg bg-stone-50 px-2 py-1.5">
                <p className="text-xs text-stone-500">Rating</p>
                <p className="text-sm font-bold text-stone-900">{c.rating ? `${c.rating} ★` : "—"}</p>
              </div>
            </div>

            {selected?.id === c.id && (
              <div className="mt-3 space-y-2 border-t border-stone-100 pt-3">
                <div className="flex items-center gap-2 text-sm text-stone-600">
                  <Phone className="h-3.5 w-3.5" />
                  {c.phone}
                </div>
                <div className="flex items-center gap-2 text-sm text-stone-600">
                  <Mail className="h-3.5 w-3.5" />
                  {c.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-stone-600">
                  <UserCheck className="h-3.5 w-3.5" />
                  Last order: {new Date(c.lastOrder).toLocaleDateString("en-IN")}
                </div>
              </div>
            )}
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 rounded-xl border border-dashed border-stone-300 p-10 text-center text-stone-400">
            <Users className="mx-auto mb-2 h-8 w-8 text-stone-300" />
            No customers found
          </div>
        )}
      </div>
    </div>
  );
}
