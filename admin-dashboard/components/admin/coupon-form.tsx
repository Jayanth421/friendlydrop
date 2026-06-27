"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function CouponForm() {
  const [form, setForm] = useState({ code: "", type: "percent", value: 10, usageLimit: 100, active: true, expiresAt: "" });

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    const response = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        value: Number(form.value),
        usageLimit: Number(form.usageLimit),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      }),
    });

    if (!response.ok) {
      toast.error("Could not create coupon");
      return;
    }

    toast.success("Coupon created");
    setForm({ code: "", type: "percent", value: 10, usageLimit: 100, active: true, expiresAt: "" });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Create Coupon</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-2 sm:grid-cols-5">
          <Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} placeholder="CODE" required />
          <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className="h-10 rounded-md border border-slate-200 px-2 text-sm">
            <option value="percent">Percent</option>
            <option value="flat">Flat</option>
          </select>
          <Input type="number" value={form.value} onChange={(event) => setForm({ ...form, value: Number(event.target.value) })} placeholder="Value" />
          <Input type="number" value={form.usageLimit} onChange={(event) => setForm({ ...form, usageLimit: Number(event.target.value) })} placeholder="Usage limit" />
          <Input type="date" value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} />
          <button className="rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white sm:col-span-5">Create Coupon</button>
        </form>
      </CardContent>
    </Card>
  );
}
