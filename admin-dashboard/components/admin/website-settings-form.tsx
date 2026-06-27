"use client";

import { FormEvent, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Globe,
  ImageIcon,
  Info,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  Sparkles,
  Type,
  Building2,
  ExternalLink,
  CheckCircle2,
  LayoutDashboard,
  ShoppingBag,
  LogIn,
  FileText,
} from "lucide-react";
import { resolveMediaUrl, normalizeMediaReference } from "@/lib/media";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WebsiteSettingsData {
  storeName: string;
  brandPrefix: string;
  brandTagline: string;
  brandDescription: string;
  logoUrl: string;
  faviconUrl: string;
  supportEmail: string;
  supportPhone: string;
  orgName: string;
  address: string;
  landingPage: string;
}

interface Props {
  initial: WebsiteSettingsData;
  cmsPageOptions?: Array<{ value: string; label: string }>;
}

// ─── Landing page options ─────────────────────────────────────────────────────

const LANDING_PAGES = [
  { value: "home", label: "Home", icon: LayoutDashboard, description: "Default homepage with featured products" },
  { value: "shop", label: "Shopping", icon: ShoppingBag, description: "Product listing / shop page" },
  { value: "login", label: "Login", icon: LogIn, description: "Login / sign-in page" },
];

// ─── Image Upload helper ───────────────────────────────────────────────────────

async function uploadImage(file: File, folder: string): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);
  fd.append("record", "true");
  const res = await fetch("/api/uploads", { method: "POST", body: fd });
  const data = (await res.json()) as { path?: string; imageUrl?: string; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Upload failed");
  const ref = normalizeMediaReference(data.path ?? data.imageUrl);
  if (!ref) throw new Error("No media reference returned");
  return ref;
}

// ─── Reusable field components ─────────────────────────────────────────────────

function FieldLabel({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide">
      <Icon className="h-3.5 w-3.5 text-slate-400" />
      {children}
    </label>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-[11px] text-slate-400">{children}</p>;
}

function TextInput({
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
    />
  );
}

// ─── Image Upload Card ────────────────────────────────────────────────────────

function ImageUploadCard({
  label,
  hint,
  value,
  folder,
  onValue,
  previewClass,
  accept = "image/*",
}: {
  label: string;
  hint: string;
  value: string;
  folder: string;
  onValue: (v: string) => void;
  previewClass?: string;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const resolvedUrl = value ? resolveMediaUrl(value) || value : "";

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const ref = await uploadImage(file, folder);
      onValue(ref);
      toast.success(`${label} uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>
        </div>
        {resolvedUrl && (
          <a href={resolvedUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-600 transition">
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>

      {/* Preview */}
      <div
        className={`relative flex items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-white transition hover:border-slate-300 ${previewClass ?? "h-32"}`}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        ) : resolvedUrl ? (
          <>
            <img
              src={resolvedUrl}
              alt={label}
              className="max-h-full max-w-full rounded-md object-contain p-2"
            />
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 opacity-0 transition hover:bg-black/10 hover:opacity-100">
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
                Change
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <ImageIcon className="h-7 w-7" />
            <span className="text-xs font-medium">Click to upload</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>

      {/* URL override */}
      <div>
        <p className="text-[11px] text-slate-400 mb-1">Or paste a URL</p>
        <input
          type="url"
          value={value}
          onChange={(e) => onValue(e.target.value)}
          placeholder="https://..."
          className="h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
        />
      </div>

      {resolvedUrl && (
        <button
          type="button"
          onClick={() => onValue("")}
          className="text-[11px] text-rose-500 hover:text-rose-700 transition"
        >
          Remove {label.toLowerCase()}
        </button>
      )}
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

export function WebsiteSettingsForm({ initial, cmsPageOptions = [] }: Props) {
  const [form, setForm] = useState<WebsiteSettingsData>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof WebsiteSettingsData>(key: K, value: WebsiteSettingsData[K]) => {
    setSaved(false);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/settings/website", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? `Save failed (${res.status})`);
        return;
      }
      setSaved(true);
      toast.success("Website settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  const logoResolved = form.logoUrl ? resolveMediaUrl(form.logoUrl) || form.logoUrl : "";
  const faviconResolved = form.faviconUrl ? resolveMediaUrl(form.faviconUrl) || form.faviconUrl : "";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Globe className="h-5 w-5 text-slate-500" />
            Website Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Control your site identity, contact details, and default landing page.
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60 shrink-0"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      {/* ── Site Identity ────────────────────────────────────────────────────── */}
      <Section
        title="Site Identity"
        description="Brand name, tagline, and description used across the storefront and SEO."
      >
        <div className="grid gap-5 md:grid-cols-2">

          <div className="space-y-1">
            <FieldLabel icon={Type}>Website Name</FieldLabel>
            <TextInput
              value={form.storeName}
              onChange={(v) => set("storeName", v)}
              placeholder="FriendlyDrop"
              maxLength={80}
            />
            <FieldHint>Appears in the browser tab, email footers, and the storefront header.</FieldHint>
          </div>

          <div className="space-y-1">
            <FieldLabel icon={Sparkles}>Brand Prefix</FieldLabel>
            <TextInput
              value={form.brandPrefix}
              onChange={(v) => set("brandPrefix", v)}
              placeholder="Maison"
              maxLength={40}
            />
            <FieldHint>Optional prefix shown before the store name (e.g. "Maison FriendlyDrop").</FieldHint>
          </div>

          <div className="space-y-1 md:col-span-2">
            <FieldLabel icon={Info}>Website Tagline</FieldLabel>
            <TextInput
              value={form.brandTagline}
              onChange={(v) => set("brandTagline", v)}
              placeholder="Luxury fashion commerce with AI styling."
              maxLength={160}
            />
            <FieldHint>Short one-line pitch — used as the meta description fallback and footer copy.</FieldHint>
          </div>

          <div className="space-y-1 md:col-span-2">
            <FieldLabel icon={Info}>Website Description</FieldLabel>
            <TextArea
              value={form.brandDescription}
              onChange={(v) => set("brandDescription", v)}
              placeholder="Tell visitors and search engines what your store is about…"
              rows={4}
            />
            <FieldHint>Longer description used in About sections, schema markup, and CMS blocks.</FieldHint>
          </div>

        </div>
      </Section>

      {/* ── Logo & Favicon ───────────────────────────────────────────────────── */}
      <Section
        title="Logo & Favicon"
        description="Upload or paste a URL. SVG, PNG, and WebP are recommended."
      >
        <div className="grid gap-6 sm:grid-cols-2">

          {/* Logo upload card */}
          <ImageUploadCard
            label="Website Logo"
            hint="Displayed in the navbar and emails. Transparent PNG or SVG recommended."
            value={form.logoUrl}
            folder="logos"
            onValue={(v) => set("logoUrl", v)}
            previewClass="h-36"
          />

          {/* Favicon upload card */}
          <ImageUploadCard
            label="Website Favicon"
            hint="32×32 or 64×64 px ICO / PNG. Shown in browser tabs and bookmarks."
            value={form.faviconUrl}
            folder="logos"
            onValue={(v) => set("faviconUrl", v)}
            previewClass="h-36"
            accept="image/x-icon,image/png,image/svg+xml,image/*"
          />

        </div>

        {/* Live preview strip */}
        {(logoResolved || faviconResolved) && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Live Preview</p>
            <div className="flex flex-wrap items-center gap-6">
              {logoResolved && (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-16 w-40 items-center justify-center rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
                    <img src={logoResolved} alt="Logo preview" className="max-h-full max-w-full object-contain" />
                  </div>
                  <span className="text-[11px] text-slate-400">Logo</span>
                </div>
              )}
              {faviconResolved && (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
                    <img src={faviconResolved} alt="Favicon preview" className="h-8 w-8 object-contain" />
                  </div>
                  <span className="text-[11px] text-slate-400">Favicon</span>
                </div>
              )}
              {/* Simulated browser tab */}
              {faviconResolved && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 rounded-t-md bg-slate-200 px-3 py-1.5 text-xs text-slate-700 w-fit">
                    <img src={faviconResolved} alt="" className="h-4 w-4 object-contain" />
                    <span className="max-w-[120px] truncate font-medium">
                      {form.storeName || "My Store"}
                    </span>
                    <span className="ml-1 text-slate-400">×</span>
                  </div>
                  <div className="h-1 w-full rounded-b-sm bg-white shadow-sm" />
                  <span className="text-[11px] text-slate-400">Browser tab preview</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Section>

      {/* ── Landing Page ─────────────────────────────────────────────────────── */}
      <Section
        title="Landing Page Selection"
        description="Choose which page users see when they visit the root URL of your store."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {LANDING_PAGES.map(({ value, label, icon: Icon, description }) => {
            const active = form.landingPage === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => set("landingPage", value)}
                className={`relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white shadow-md"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${active ? "bg-white/10" : "bg-slate-100"}`}>
                  <Icon className={`h-5 w-5 ${active ? "text-white" : "text-slate-600"}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className={`text-xs ${active ? "text-white/70" : "text-slate-400"}`}>{description}</p>
                </div>
                {active && (
                  <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-white/80" />
                )}
              </button>
            );
          })}

          {/* CMS Page option — shown when there are published CMS pages */}
          {cmsPageOptions.length > 0 && (() => {
            const isCms = !LANDING_PAGES.some((lp) => lp.value === form.landingPage) && form.landingPage !== "";
            const active = isCms;
            return (
              <button
                key="cms"
                type="button"
                onClick={() => set("landingPage", cmsPageOptions[0].value)}
                className={`relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white shadow-md"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${active ? "bg-white/10" : "bg-slate-100"}`}>
                  <FileText className={`h-5 w-5 ${active ? "text-white" : "text-slate-600"}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold">CMS Page</p>
                  <p className={`text-xs ${active ? "text-white/70" : "text-slate-400"}`}>Display a custom CMS page as home</p>
                </div>
                {active && (
                  <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-white/80" />
                )}
              </button>
            );
          })()}
        </div>

        {/* CMS page selector — appears when a non-standard landing page is active */}
        {cmsPageOptions.length > 0 && !LANDING_PAGES.some((lp) => lp.value === form.landingPage) && form.landingPage !== "" && (
          <div className="mt-4">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              Select CMS Page
            </label>
            <select
              value={form.landingPage}
              onChange={(e) => set("landingPage", e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            >
              {cmsPageOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label} ({opt.value})</option>
              ))}
            </select>
            <p className="mt-1.5 text-[11px] text-slate-400">
              This CMS page will render at the root URL <code className="rounded bg-slate-100 px-1">/</code> of your store.
            </p>
          </div>
        )}
      </Section>

      {/* ── Contact Information ──────────────────────────────────────────────── */}
      <Section
        title="Contact Information"
        description="Shown in the footer, emails, and customer-facing pages."
      >
        <div className="grid gap-5 md:grid-cols-2">

          <div className="space-y-1">
            <FieldLabel icon={Building2}>Organisation Name</FieldLabel>
            <TextInput
              value={form.orgName}
              onChange={(v) => set("orgName", v)}
              placeholder="FriendlyDrop Pvt. Ltd."
            />
            <FieldHint>Legal / registered business name used in invoices and receipts.</FieldHint>
          </div>

          <div className="space-y-1">
            <FieldLabel icon={Mail}>Support Email</FieldLabel>
            <TextInput
              value={form.supportEmail}
              onChange={(v) => set("supportEmail", v)}
              placeholder="help@yourstore.com"
            />
            <FieldHint>Shown in order confirmation emails and the contact page.</FieldHint>
          </div>

          <div className="space-y-1">
            <FieldLabel icon={Phone}>Phone Number</FieldLabel>
            <TextInput
              value={form.supportPhone}
              onChange={(v) => set("supportPhone", v)}
              placeholder="+91 98765 43210"
            />
            <FieldHint>Customer-facing phone number shown in the footer.</FieldHint>
          </div>

          <div className="space-y-1 md:col-span-2">
            <FieldLabel icon={MapPin}>Address</FieldLabel>
            <TextArea
              value={form.address}
              onChange={(v) => set("address", v)}
              placeholder="123 Main Street, Bengaluru, Karnataka, 560001, India"
              rows={2}
            />
            <FieldHint>Physical business address shown in the footer and on the contact page.</FieldHint>
          </div>

        </div>
      </Section>

      {/* ── Bottom save ──────────────────────────────────────────────────────── */}
      <div className="flex justify-end pb-4">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

    </form>
  );
}
