"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function BannerForm() {
  const [form, setForm] = useState<{
    title: string;
    type: "hero" | "offer" | "category";
    imageDesktop: string;
    imageMobile: string;
    linkType: "product" | "category" | "external";
    linkTarget: string;
    position: number;
    active: boolean;
  }>({
    title: "",
    type: "hero",
    imageDesktop: "",
    imageMobile: "",
    linkType: "category",
    linkTarget: "",
    position: 0,
    active: true,
  });
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...form,
        imageMobile: form.imageMobile.trim() ? form.imageMobile : undefined,
      };

      const response = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error ?? "Could not save banner");
        return;
      }

      toast.success("Banner saved");
      setForm({ ...form, title: "", imageDesktop: "", imageMobile: "", linkTarget: "" });
    } catch {
      toast.error("Could not save banner");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
      <Input placeholder="Banner title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
      <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as "hero" | "offer" | "category" })} className="h-10 rounded border border-slate-200 px-2 text-sm">
        <option value="hero">hero</option>
        <option value="offer">offer</option>
        <option value="category">category</option>
      </select>
      <Input placeholder="Desktop image URL" value={form.imageDesktop} onChange={(event) => setForm({ ...form, imageDesktop: event.target.value })} required />
      <Input placeholder="Mobile image URL" value={form.imageMobile} onChange={(event) => setForm({ ...form, imageMobile: event.target.value })} />
      <select value={form.linkType} onChange={(event) => setForm({ ...form, linkType: event.target.value as "product" | "category" | "external" })} className="h-10 rounded border border-slate-200 px-2 text-sm">
        <option value="product">product</option>
        <option value="category">category</option>
        <option value="external">external</option>
      </select>
      <Input placeholder="Link target" value={form.linkTarget} onChange={(event) => setForm({ ...form, linkTarget: event.target.value })} required />
      <Input type="number" placeholder="Position" value={form.position} onChange={(event) => setForm({ ...form, position: Number(event.target.value) })} />
      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
        Active
      </label>
      <Button disabled={saving} className="sm:justify-self-start">
        {saving ? "Saving..." : "Save Banner"}
      </Button>
    </form>
  );
}
