"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { MobileAppControl } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MobileControlsForm({ initialControls }: { initialControls: MobileAppControl }) {
  const [form, setForm] = useState(initialControls);
  const [saving, setSaving] = useState(false);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const response = await fetch("/api/admin/mobile-controls", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);

    if (!response.ok) {
      toast.error("Could not update mobile controls");
      return;
    }

    toast.success("Mobile controls updated");
  };

  return (
    <Card>
      <CardHeader><CardTitle>Mobile App Control Panel</CardTitle></CardHeader>
      <CardContent>
        <form className="grid gap-3 md:grid-cols-3" onSubmit={save}>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.appEnabled} onChange={(event) => setForm({ ...form, appEnabled: event.target.checked })} />App enabled</label>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.pushNotificationsEnabled} onChange={(event) => setForm({ ...form, pushNotificationsEnabled: event.target.checked })} />Push notifications</label>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.showWishlist} onChange={(event) => setForm({ ...form, showWishlist: event.target.checked })} />Show wishlist</label>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.showWallet} onChange={(event) => setForm({ ...form, showWallet: event.target.checked })} />Show wallet</label>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.showReferrals} onChange={(event) => setForm({ ...form, showReferrals: event.target.checked })} />Show referrals</label>
          <select className="h-9 rounded border border-slate-200 px-2 text-sm" value={form.homeLayoutPreset} onChange={(event) => setForm({ ...form, homeLayoutPreset: event.target.value as MobileAppControl["homeLayoutPreset"] })}>
            <option value="classic">classic layout</option>
            <option value="sale-first">sale-first layout</option>
            <option value="minimal">minimal layout</option>
          </select>
          <input className="h-9 rounded border border-slate-200 px-2 text-sm" placeholder="Force update Android version" value={form.forceUpdateAndroidVersion ?? ""} onChange={(event) => setForm({ ...form, forceUpdateAndroidVersion: event.target.value })} />
          <input className="h-9 rounded border border-slate-200 px-2 text-sm" placeholder="Force update iOS version" value={form.forceUpdateIosVersion ?? ""} onChange={(event) => setForm({ ...form, forceUpdateIosVersion: event.target.value })} />
          <Button disabled={saving}>{saving ? "Saving..." : "Save Mobile Controls"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
