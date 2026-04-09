"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { CmsPageConfig } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function CmsManager({ initialPages }: { initialPages: CmsPageConfig[] }) {
  const [pages, setPages] = useState(initialPages);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    status: "draft" as "draft" | "published",
    metaTitle: "",
    metaDescription: "",
  });
  const [saving, setSaving] = useState(false);

  const savePage = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const response = await fetch("/api/admin/cms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        slug: form.slug,
        status: form.status,
        seo: {
          metaTitle: form.metaTitle || undefined,
          metaDescription: form.metaDescription || undefined,
        },
      }),
    });
    setSaving(false);

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast.error(payload.error ?? "Could not save CMS page");
      return;
    }

    setPages((prev) => [payload.page, ...prev]);
    setForm({
      title: "",
      slug: "",
      status: "draft",
      metaTitle: "",
      metaDescription: "",
    });
    toast.success("CMS page saved");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Create CMS Page</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-2 md:grid-cols-2" onSubmit={savePage}>
            <input className="h-9 rounded border border-slate-200 px-2 text-sm" placeholder="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
            <input className="h-9 rounded border border-slate-200 px-2 text-sm" placeholder="Slug" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} required />
            <select className="h-9 rounded border border-slate-200 px-2 text-sm" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as "draft" | "published" })}>
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
            <input className="h-9 rounded border border-slate-200 px-2 text-sm" placeholder="Meta title" value={form.metaTitle} onChange={(event) => setForm({ ...form, metaTitle: event.target.value })} />
            <input className="h-9 rounded border border-slate-200 px-2 text-sm md:col-span-2" placeholder="Meta description" value={form.metaDescription} onChange={(event) => setForm({ ...form, metaDescription: event.target.value })} />
            <Button disabled={saving}>{saving ? "Saving..." : "Save CMS Page"}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>CMS Pages</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell>{page.title}</TableCell>
                  <TableCell>{page.slug}</TableCell>
                  <TableCell>{page.status}</TableCell>
                  <TableCell>{new Date(page.updatedAt).toLocaleString("en-IN")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
