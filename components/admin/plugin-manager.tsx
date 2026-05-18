"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { toast } from "sonner";
import { PluginApp } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { firebaseStorage } from "@/lib/firebase/client";

export function PluginManager({ initialPlugins }: { initialPlugins: PluginApp[] }) {
  const [plugins, setPlugins] = useState(initialPlugins);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    provider: "",
    version: "1.0.0",
    category: "other" as PluginApp["category"],
    apiEndpoint: "",
    webhookEndpoint: "",
    zipFileUrl: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploadingZip, setUploadingZip] = useState(false);

  const uploadZipFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const isZipType = file.type === "application/zip" || file.type === "application/x-zip-compressed";
    const hasZipExtension = file.name.toLowerCase().endsWith(".zip");

    if (!isZipType && !hasZipExtension) {
      toast.error("Please upload a .zip file.");
      return;
    }

    setUploadingZip(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storageRef = ref(firebaseStorage, `plugin-zips/${Date.now()}-${safeName}`);
      await uploadBytes(storageRef, file, { contentType: "application/zip" });
      const url = await getDownloadURL(storageRef);
      setForm((prev) => ({ ...prev, zipFileUrl: url }));
      toast.success("Plugin zip uploaded.");
    } catch (error) {
      console.error(error);
      toast.error("Could not upload plugin zip.");
    } finally {
      setUploadingZip(false);
      event.target.value = "";
    }
  };

  const installPlugin = async (event: FormEvent) => {
    event.preventDefault();
    if (uploadingZip) {
      toast.error("Please wait for zip upload to finish.");
      return;
    }

    setSaving(true);
    const response = await fetch("/api/admin/plugins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        status: "installed",
        apiEndpoint: form.apiEndpoint || undefined,
        webhookEndpoint: form.webhookEndpoint || undefined,
        zipFileUrl: form.zipFileUrl || undefined,
      }),
    });
    setSaving(false);

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast.error(payload.error ?? "Could not install plugin");
      return;
    }

    setPlugins((prev) => [payload.plugin, ...prev]);
    setForm({
      name: "",
      slug: "",
      provider: "",
      version: "1.0.0",
      category: "other",
      apiEndpoint: "",
      webhookEndpoint: "",
      zipFileUrl: "",
    });
    toast.success("Plugin installed");
  };

  const setStatus = async (pluginId: string, status: PluginApp["status"]) => {
    const response = await fetch(`/api/admin/plugins/${pluginId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      toast.error("Could not update plugin");
      return;
    }
    setPlugins((prev) => prev.map((plugin) => (plugin.id === pluginId ? { ...plugin, status } : plugin)));
    toast.success("Plugin updated");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Install Plugin</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-2 md:grid-cols-3" onSubmit={installPlugin}>
            <input className="h-9 rounded border border-slate-200 px-2 text-sm" placeholder="Plugin name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            <input className="h-9 rounded border border-slate-200 px-2 text-sm" placeholder="Slug" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} required />
            <input className="h-9 rounded border border-slate-200 px-2 text-sm" placeholder="Provider" value={form.provider} onChange={(event) => setForm({ ...form, provider: event.target.value })} required />
            <input className="h-9 rounded border border-slate-200 px-2 text-sm" placeholder="Version" value={form.version} onChange={(event) => setForm({ ...form, version: event.target.value })} required />
            <select className="h-9 rounded border border-slate-200 px-2 text-sm" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as PluginApp["category"] })}>
              <option value="marketing">marketing</option>
              <option value="shipping">shipping</option>
              <option value="payments">payments</option>
              <option value="analytics">analytics</option>
              <option value="operations">operations</option>
              <option value="other">other</option>
            </select>
            <input className="h-9 rounded border border-slate-200 px-2 text-sm" placeholder="API endpoint" value={form.apiEndpoint} onChange={(event) => setForm({ ...form, apiEndpoint: event.target.value })} />
            <input className="h-9 rounded border border-slate-200 px-2 text-sm md:col-span-2" placeholder="Webhook endpoint" value={form.webhookEndpoint} onChange={(event) => setForm({ ...form, webhookEndpoint: event.target.value })} />
            <input className="h-9 rounded border border-slate-200 px-2 text-sm" placeholder="Plugin ZIP URL (optional)" value={form.zipFileUrl} onChange={(event) => setForm({ ...form, zipFileUrl: event.target.value })} />
            <label className="flex h-9 items-center justify-center rounded border border-dashed border-slate-300 px-2 text-xs text-slate-600 cursor-pointer">
              {uploadingZip ? "Uploading ZIP..." : "Upload ZIP File"}
              <input type="file" accept=".zip,application/zip,application/x-zip-compressed" className="hidden" onChange={uploadZipFile} />
            </label>
            <Button disabled={saving || uploadingZip} className="md:col-span-1">{saving ? "Installing..." : "Install Plugin"}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Installed Plugins</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {plugins.map((plugin) => (
                <TableRow key={plugin.id}>
                  <TableCell>{plugin.name}</TableCell>
                  <TableCell>{plugin.provider}</TableCell>
                  <TableCell>{plugin.category}</TableCell>
                  <TableCell>{plugin.zipFileUrl ? <a href={plugin.zipFileUrl} target="_blank" rel="noreferrer" className="text-accent">zip</a> : "-"}</TableCell>
                  <TableCell>{plugin.version}</TableCell>
                  <TableCell>{plugin.status}</TableCell>
                  <TableCell className="space-x-2">
                    <button type="button" className="text-xs text-slate-700" onClick={() => setStatus(plugin.id, "installed")}>enable</button>
                    <button type="button" className="text-xs text-amber-700" onClick={() => setStatus(plugin.id, "disabled")}>disable</button>
                    <button type="button" className="text-xs text-rose-700" onClick={() => setStatus(plugin.id, "uninstalled")}>uninstall</button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
