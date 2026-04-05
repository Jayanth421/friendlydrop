"use client";

import { DragEvent, useState } from "react";
import { toast } from "sonner";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { firebaseStorage } from "@/lib/firebase/client";

interface ProductFormValues {
  id?: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  subcategory?: string;
  stock: number;
  sku?: string;
  tags?: string[];
  featured?: boolean;
  popularity?: number;
  status?: "draft" | "published" | "archived";
  visibility?: "public" | "private";
  seo?: { metaTitle?: string; metaDescription?: string };
}

export function ProductForm({ defaultValues }: { defaultValues?: ProductFormValues }) {
  const [form, setForm] = useState<ProductFormValues>(
    defaultValues ?? {
      name: "",
      description: "",
      price: 499,
      images: [],
      category: "photo-prints",
      subcategory: "",
      stock: 20,
      sku: "",
      tags: [],
      featured: true,
      popularity: 80,
      status: "published",
      visibility: "public",
      seo: { metaTitle: "", metaDescription: "" },
    },
  );
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file: File) => {
    setUploading(true);

    try {
      const fileRef = ref(firebaseStorage, `products/${Date.now()}-${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setForm((prev) => ({ ...prev, images: [...prev.images, url] }));
      toast.success("Image uploaded");
    } catch (error) {
      console.error(error);
      toast.error("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (!event.dataTransfer.files?.[0]) {
      return;
    }

    await uploadFile(event.dataTransfer.files[0]);
  };

  const save = async () => {
    setSaving(true);

    const method = defaultValues?.id ? "PATCH" : "POST";
    const url = defaultValues?.id ? `/api/admin/products/${defaultValues.id}` : "/api/admin/products";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        popularity: Number(form.popularity),
        tags: (form.tags ?? []).filter(Boolean),
      }),
    });

    setSaving(false);

    if (!response.ok) {
      toast.error("Could not save product");
      return;
    }

    toast.success(defaultValues?.id ? "Product updated" : "Product created");
  };

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
      <Input placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
      <Textarea placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />

      <div className="grid gap-2 sm:grid-cols-4">
        <Input type="number" placeholder="Price" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} />
        <Input placeholder="SKU" value={form.sku ?? ""} onChange={(event) => setForm({ ...form, sku: event.target.value })} />
        <Input type="number" placeholder="Stock" value={form.stock} onChange={(event) => setForm({ ...form, stock: Number(event.target.value) })} />
        <Input placeholder="Subcategory" value={form.subcategory ?? ""} onChange={(event) => setForm({ ...form, subcategory: event.target.value })} />
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <select className="h-10 rounded-md border border-slate-200 px-2 text-sm" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
          <option value="photo-prints">Photo Prints</option>
          <option value="stickers">Stickers</option>
          <option value="personalized-gifts">Personalized Gifts</option>
        </select>
        <select className="h-10 rounded-md border border-slate-200 px-2 text-sm" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ProductFormValues["status"] })}>
          <option value="draft">draft</option>
          <option value="published">published</option>
          <option value="archived">archived</option>
        </select>
        <select className="h-10 rounded-md border border-slate-200 px-2 text-sm" value={form.visibility} onChange={(event) => setForm({ ...form, visibility: event.target.value as ProductFormValues["visibility"] })}>
          <option value="public">public</option>
          <option value="private">private</option>
        </select>
      </div>

      <Input
        placeholder="Tags (comma separated)"
        value={(form.tags ?? []).join(",")}
        onChange={(event) => setForm({ ...form, tags: event.target.value.split(",").map((tag) => tag.trim()) })}
      />

      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          placeholder="SEO Meta Title"
          value={form.seo?.metaTitle ?? ""}
          onChange={(event) => setForm({ ...form, seo: { ...(form.seo ?? {}), metaTitle: event.target.value } })}
        />
        <Input
          placeholder="SEO Meta Description"
          value={form.seo?.metaDescription ?? ""}
          onChange={(event) => setForm({ ...form, seo: { ...(form.seo ?? {}), metaDescription: event.target.value } })}
        />
      </div>

      <div className="flex gap-2">
        <Input placeholder="Image URL" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} />
        <Button
          variant="secondary"
          type="button"
          onClick={() => {
            if (!imageUrl) return;
            setForm({ ...form, images: [...form.images, imageUrl] });
            setImageUrl("");
          }}
        >
          Add
        </Button>
      </div>

      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        className="rounded-md border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500"
      >
        Drag and drop product image here or choose file
        <div className="mt-2">
          <input type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && uploadFile(event.target.files[0])} />
          {uploading ? <p className="mt-1 text-xs">Uploading...</p> : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {form.images.map((image) => (
          <div key={image} className="rounded border border-slate-200 px-2 py-1">
            <a href={image} target="_blank" rel="noreferrer" className="text-accent">Image</a>
          </div>
        ))}
      </div>

      <Button disabled={saving} onClick={save}>
        {saving ? "Saving..." : defaultValues?.id ? "Update Product" : "Create Product"}
      </Button>
    </div>
  );
}
