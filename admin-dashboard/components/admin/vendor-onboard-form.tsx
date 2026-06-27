"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function VendorOnboardForm() {
  const [form, setForm] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    commissionPercent: 12,
  });
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/admin/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error ?? "Could not onboard vendor");
        return;
      }

      toast.success("Vendor onboarded");
      setForm({
        businessName: "",
        ownerName: "",
        email: "",
        phone: "",
        commissionPercent: 12,
      });
    } catch {
      toast.error("Could not onboard vendor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
      <Input placeholder="Business name" value={form.businessName} onChange={(event) => setForm({ ...form, businessName: event.target.value })} required />
      <Input placeholder="Owner name" value={form.ownerName} onChange={(event) => setForm({ ...form, ownerName: event.target.value })} required />
      <Input type="email" placeholder="Vendor email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
      <Input placeholder="Phone number" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} required />
      <Input
        type="number"
        min={0}
        max={100}
        placeholder="Commission %"
        value={form.commissionPercent}
        onChange={(event) => setForm({ ...form, commissionPercent: Number(event.target.value) })}
        required
      />
      <Button disabled={saving} className="sm:justify-self-start">
        {saving ? "Saving..." : "Create Vendor"}
      </Button>
    </form>
  );
}
