"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeMediaReference, resolveMediaUrl } from "@/lib/media";

export function CategoryForm() {
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    image: "",
    parentId: "",
    level: 0,
    tags: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const uploadCategoryImage = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "categories");
      formData.append("record", "false");

      const response = await fetch("/api/uploads", { method: "POST", body: formData });
      const data = (await response.json()) as { path?: string; imageUrl?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Upload failed");
      }

      const reference = normalizeMediaReference(data.path ?? data.imageUrl);
      if (!reference) {
        throw new Error("Missing media reference");
      }

      setForm((prev) => ({ ...prev, image: reference }));
      toast.success("Category image uploaded");
    } catch (error) {
      console.error(error);
      toast.error("Could not upload category image");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...form,
        image: normalizeMediaReference(form.image.trim() ? form.image : undefined),
        parentId: form.parentId || null,
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };

      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error ?? "Could not save category");
        return;
      }

      toast.success("Category saved");
      setForm({ name: "", slug: "", description: "", image: "", parentId: "", level: 0, tags: "" });
    } catch {
      toast.error("Could not save category");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
      <Input placeholder="Category name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
      <Input placeholder="Slug (optional)" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} />
      <Input className="sm:col-span-2" placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
      <div className="space-y-2">
        <Input placeholder="Category image media path" value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} />
        <input
          type="file"
          accept="image/*"
          className="text-xs"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              uploadCategoryImage(file);
            }
          }}
        />
        {uploading ? <p className="text-xs text-slate-500">Uploading image...</p> : null}
        {form.image ? <img src={resolveMediaUrl(form.image) || ""} alt="Category preview" className="h-16 w-full rounded border object-cover" /> : null}
      </div>
      <Input placeholder="Parent ID (optional)" value={form.parentId} onChange={(event) => setForm({ ...form, parentId: event.target.value })} />
      <Input type="number" min={0} placeholder="Level" value={form.level} onChange={(event) => setForm({ ...form, level: Number(event.target.value) })} />
      <Input className="sm:col-span-2" placeholder="Tags (comma-separated)" value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} />
      <Button disabled={saving} className="sm:justify-self-start">
        {saving ? "Saving..." : "Save Category"}
      </Button>
    </form>
  );
}
