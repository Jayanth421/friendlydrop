"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { PluginApp } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  });
  const [saving, setSaving] = useState(false);

  const installPlugin = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const response = await fetch("/api/admin/plugins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        status: "installed",
        apiEndpoint: form.apiEndpoint || undefined,
        webhookEndpoint: form.webhookEndpoint || undefined,
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
            <Button disabled={saving} className="md:col-span-1">{saving ? "Installing..." : "Install Plugin"}</Button>
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
