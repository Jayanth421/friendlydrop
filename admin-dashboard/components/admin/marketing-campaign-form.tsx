"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MarketingCampaignForm() {
  const [form, setForm] = useState({
    title: "",
    channel: "email",
    status: "draft",
    audience: "all",
  });

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    const response = await fetch("/api/admin/marketing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      toast.error("Could not create campaign");
      return;
    }

    toast.success("Campaign created");
    setForm({ title: "", channel: "email", status: "draft", audience: "all" });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Create Campaign</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-2 sm:grid-cols-4">
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Campaign title" className="h-10 rounded border border-slate-200 px-2 sm:col-span-4" />
          <select value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value })} className="h-10 rounded border border-slate-200 px-2">
            <option value="email">email</option>
            <option value="push">push</option>
            <option value="banner">banner</option>
          </select>
          <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="h-10 rounded border border-slate-200 px-2">
            <option value="draft">draft</option>
            <option value="scheduled">scheduled</option>
            <option value="running">running</option>
            <option value="completed">completed</option>
          </select>
          <select value={form.audience} onChange={(event) => setForm({ ...form, audience: event.target.value })} className="h-10 rounded border border-slate-200 px-2">
            <option value="all">all</option>
            <option value="new">new</option>
            <option value="repeat">repeat</option>
            <option value="vip">vip</option>
          </select>
          <button className="rounded bg-ink px-3 py-2 text-sm font-semibold text-white">Create</button>
        </form>
      </CardContent>
    </Card>
  );
}
