"use client";

import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { CmsPageConfig } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MediaPickerButton } from "@/components/admin/media-library";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { normalizeMediaReference, resolveMediaUrl } from "@/lib/media";

type CmsForm = {
  id?: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  content: string;
  excerpt: string;
  heroImageUrl: string;
  template: "default" | "landing" | "policy" | "contact";
  showInFooter: boolean;
  metaTitle: string;
  metaDescription: string;
};

const CORE_PAGE_PRESETS: Array<{ title: string; slug: string; template: CmsForm["template"] }> = [
  { title: "Home Page", slug: "home", template: "landing" },
  { title: "Shop Page", slug: "shop", template: "default" },
  { title: "About Brand", slug: "about-brand", template: "default" },
  { title: "Contact", slug: "contact", template: "contact" },
  { title: "Privacy Policy", slug: "privacy-policy", template: "policy" },
  { title: "Terms and Conditions", slug: "terms-and-conditions", template: "policy" },
];

function resolveCmsPublicHref(slug: string) {
  if (slug === "home") return "/";
  if (slug === "shop") return "/products";
  if (slug === "about-brand") return "/about-brand";
  if (slug === "contact") return "/contact";
  if (slug === "privacy-policy") return "/privacy-policy";
  if (slug === "terms-and-conditions") return "/terms-and-conditions";
  return `/pages/${slug}`;
}

function defaultForm(): CmsForm {
  return {
    title: "",
    slug: "",
    status: "draft",
    content: "",
    excerpt: "",
    heroImageUrl: "",
    template: "default",
    showInFooter: false,
    metaTitle: "",
    metaDescription: "",
  };
}

function mapPageToForm(page: CmsPageConfig): CmsForm {
  return {
    id: page.id,
    title: page.title,
    slug: page.slug,
    status: page.status,
    content: page.content ?? "",
    excerpt: page.excerpt ?? "",
    heroImageUrl: page.heroImageUrl ?? "",
    template: page.template ?? "default",
    showInFooter: Boolean(page.showInFooter),
    metaTitle: page.seo?.metaTitle ?? "",
    metaDescription: page.seo?.metaDescription ?? "",
  };
}

export function CmsManager({ initialPages }: { initialPages: CmsPageConfig[] }) {
  const [pages, setPages] = useState(initialPages);
  const [form, setForm] = useState<CmsForm>(defaultForm());
  const [editorMode, setEditorMode] = useState<"rich" | "html" | "source">("rich");
  const [saving, setSaving] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);

  const sortedPages = useMemo(
    () => [...pages].sort((a, b) => a.slug.localeCompare(b.slug)),
    [pages],
  );

  const savePage = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);

    const payload = {
      id: form.id,
      title: form.title.trim(),
      slug: form.slug.trim().toLowerCase(),
      status: form.status,
      content: form.content.trim() || undefined,
      excerpt: form.excerpt.trim() || undefined,
      heroImageUrl: normalizeMediaReference(form.heroImageUrl.trim() || undefined),
      template: form.template,
      showInFooter: form.showInFooter,
      seo: {
        metaTitle: form.metaTitle.trim() || undefined,
        metaDescription: form.metaDescription.trim() || undefined,
      },
    };

    const response = await fetch("/api/admin/cms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);

    const result = (await response.json().catch(() => ({}))) as { page?: CmsPageConfig; error?: string };
    if (!response.ok || !result.page) {
      toast.error(result.error ?? "Could not save CMS page");
      return;
    }

    setPages((prev) => {
      const next = prev.filter((item) => item.id !== result.page!.id);
      next.unshift(result.page!);
      return next;
    });
    setForm(mapPageToForm(result.page));
    toast.success("CMS page saved");
  };

  const uploadHeroImage = async (file: File) => {
    setUploadingHero(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "cms");
      formData.append("record", "true");
      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as { path?: string; imageUrl?: string; error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Upload failed");
      }

      const reference = normalizeMediaReference(data.path ?? data.imageUrl);
      if (!reference) {
        throw new Error("Upload did not return media reference");
      }

      setForm((prev) => ({ ...prev, heroImageUrl: reference }));
      toast.success("Hero image uploaded");
    } catch (error) {
      console.error(error);
      toast.error("Could not upload hero image");
    } finally {
      setUploadingHero(false);
    }
  };

  const insertMediaEmbed = (url: string) => {
    const reference = normalizeMediaReference(url) ?? url;
    const publicUrl = resolveMediaUrl(reference) || reference;
    const extension = publicUrl.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
    const embed =
      extension === "pdf"
        ? `<p><a href="${publicUrl}" target="_blank" rel="noreferrer">Download PDF</a></p>`
        : `<figure><img src="${publicUrl}" alt="" /></figure>`;

    setForm((prev) => ({
      ...prev,
      content: prev.content ? `${prev.content}\n${embed}` : embed,
    }));
    toast.success("Media embed added");
  };

  const choosePreset = (slug: string) => {
    const preset = CORE_PAGE_PRESETS.find((item) => item.slug === slug);
    if (!preset) {
      return;
    }

    const existing = pages.find((item) => item.slug === slug);
    if (existing) {
      setForm(mapPageToForm(existing));
      return;
    }

    setForm((prev) => ({
      ...prev,
      id: undefined,
      title: preset.title,
      slug: preset.slug,
      template: preset.template,
      status: "draft",
    }));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Dynamic CMS Control</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex flex-wrap gap-2">
            {CORE_PAGE_PRESETS.map((preset) => (
              <Button key={preset.slug} type="button" variant="outline" size="sm" onClick={() => choosePreset(preset.slug)}>
                {preset.title}
              </Button>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={() => setForm(defaultForm())}>
              New Custom Page
            </Button>
          </div>
          <form className="grid gap-2 md:grid-cols-2" onSubmit={savePage}>
            <input className="h-9 rounded border border-slate-200 px-2 text-sm" placeholder="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
            <input className="h-9 rounded border border-slate-200 px-2 text-sm" placeholder="Slug (example: shipping-policy)" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} required />

            <select className="h-9 rounded border border-slate-200 px-2 text-sm" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as CmsForm["status"] })}>
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
            <select className="h-9 rounded border border-slate-200 px-2 text-sm" value={form.template} onChange={(event) => setForm({ ...form, template: event.target.value as CmsForm["template"] })}>
              <option value="default">default</option>
              <option value="landing">landing</option>
              <option value="policy">policy</option>
              <option value="contact">contact</option>
            </select>

            <input className="h-9 rounded border border-slate-200 px-2 text-sm md:col-span-2" placeholder="Excerpt" value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} />

            <div className="space-y-2 md:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex rounded-md border border-slate-200 bg-white p-1">
                  {(["rich", "html", "source"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setEditorMode(mode)}
                      className={`rounded px-3 py-1.5 text-xs font-medium capitalize ${editorMode === mode ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                    >
                      {mode === "rich" ? "Rich Text" : mode === "html" ? "HTML" : "Source"}
                    </button>
                  ))}
                </div>
                <MediaPickerButton label="Embed Media" accept="all" folder="cms" onSelect={insertMediaEmbed} />
              </div>
              {editorMode === "rich" ? (
                <div
                  contentEditable
                  suppressContentEditableWarning
                  className="min-h-[220px] rounded border border-slate-200 bg-white px-3 py-2 text-sm leading-7 outline-none focus:border-slate-400"
                  onBlur={(event) => setForm((prev) => ({ ...prev, content: event.currentTarget.innerHTML }))}
                  dangerouslySetInnerHTML={{ __html: form.content }}
                />
              ) : (
                <textarea
                  className="min-h-[220px] rounded border border-slate-200 px-2 py-2 font-mono text-sm md:col-span-2"
                  placeholder={editorMode === "html" ? "Write HTML content and embed QOENS media URLs..." : "Source code view"}
                  value={form.content}
                  onChange={(event) => setForm({ ...form, content: event.target.value })}
                  readOnly={editorMode === "source"}
                />
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <input className="h-9 w-full rounded border border-slate-200 px-2 text-sm" placeholder="Hero media path" value={form.heroImageUrl} onChange={(event) => setForm({ ...form, heroImageUrl: event.target.value })} />
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  className="text-xs"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      uploadHeroImage(file);
                    }
                  }}
                />
                <MediaPickerButton
                  folder="cms"
                  onSelect={(url) => setForm((prev) => ({ ...prev, heroImageUrl: normalizeMediaReference(url) ?? url }))}
                />
                {uploadingHero ? <span className="text-xs text-slate-500">Uploading hero image...</span> : null}
              </div>
              {form.heroImageUrl ? <img src={resolveMediaUrl(form.heroImageUrl) || ""} alt="Hero preview" className="h-24 w-full rounded border object-cover" /> : null}
            </div>

            <input className="h-9 rounded border border-slate-200 px-2 text-sm" placeholder="Meta title" value={form.metaTitle} onChange={(event) => setForm({ ...form, metaTitle: event.target.value })} />
            <input className="h-9 rounded border border-slate-200 px-2 text-sm" placeholder="Meta description" value={form.metaDescription} onChange={(event) => setForm({ ...form, metaDescription: event.target.value })} />

            <label className="inline-flex items-center gap-2 text-sm md:col-span-2">
              <input type="checkbox" checked={form.showInFooter} onChange={(event) => setForm({ ...form, showInFooter: event.target.checked })} />
              Show this page in footer links
            </label>

            <Button disabled={saving || uploadingHero}>{saving ? "Saving..." : "Save CMS Page"}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Published + Draft Pages</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPages.map((page) => {
                const href = resolveCmsPublicHref(page.slug);

                return (
                  <TableRow key={page.id} className="cursor-pointer" onClick={() => setForm(mapPageToForm(page))}>
                    <TableCell>{page.title}</TableCell>
                    <TableCell>{page.slug}</TableCell>
                    <TableCell>{page.status}</TableCell>
                    <TableCell>{new Date(page.updatedAt).toLocaleString("en-IN")}</TableCell>
                    <TableCell>
                      <a href={href} target="_blank" rel="noreferrer" className="text-xs text-accent underline">
                        {href}
                      </a>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
