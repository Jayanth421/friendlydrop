"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { StoreSettings } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StoreSettingsForm({ settings }: { settings: StoreSettings }) {
  const [form, setForm] = useState(settings);

  const save = async (event: FormEvent) => {
    event.preventDefault();

    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      toast.error("Could not save settings");
      return;
    }

    toast.success("Settings saved");
  };

  return (
    <Card>
      <CardHeader><CardTitle>Store Settings</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={save} className="grid gap-2 sm:grid-cols-2">
          <input value={form.storeName} onChange={(event) => setForm({ ...form, storeName: event.target.value })} placeholder="Store name" className="h-10 rounded border border-slate-200 px-2" />
          <input value={form.supportEmail} onChange={(event) => setForm({ ...form, supportEmail: event.target.value })} placeholder="Support email" className="h-10 rounded border border-slate-200 px-2" />
          <input value={form.supportPhone} onChange={(event) => setForm({ ...form, supportPhone: event.target.value })} placeholder="Support phone" className="h-10 rounded border border-slate-200 px-2" />
          <input
            value={form.taxRate}
            onChange={(event) => setForm({ ...form, taxRate: Number(event.target.value) })}
            type="number"
            min={0}
            max={100}
            placeholder="GST rate (%)"
            className="h-10 rounded border border-slate-200 px-2"
          />
          <input
            value={form.deliveryFee}
            onChange={(event) => setForm({ ...form, deliveryFee: Number(event.target.value) })}
            type="number"
            min={0}
            placeholder="Delivery fee"
            className="h-10 rounded border border-slate-200 px-2"
          />
          <input value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })} placeholder="Currency" className="h-10 rounded border border-slate-200 px-2" />
          <input value={form.themeColor} onChange={(event) => setForm({ ...form, themeColor: event.target.value })} placeholder="Theme color" className="h-10 rounded border border-slate-200 px-2" />
          <button className="rounded bg-ink px-3 py-2 text-sm font-semibold text-white sm:col-span-2">Save settings</button>
        </form>
      </CardContent>
    </Card>
  );
}
