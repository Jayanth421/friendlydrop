"use client";

import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { Product, SocialShareConfig, SocialShareLink } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

interface SocialShareManagerProps {
  initialConfig: SocialShareConfig;
  initialLinks: SocialShareLink[];
  products: Array<Pick<Product, "id" | "name" | "price">>;
}

export function SocialShareManager({ initialConfig, initialLinks, products }: SocialShareManagerProps) {
  const [config, setConfig] = useState(initialConfig);
  const [links, setLinks] = useState(initialLinks);
  const [savingConfig, setSavingConfig] = useState(false);
  const [creatingLink, setCreatingLink] = useState(false);
  const [trackingClickId, setTrackingClickId] = useState<string | null>(null);
  const [linkForm, setLinkForm] = useState({
    platform: "whatsapp" as SocialShareLink["platform"],
    productId: "",
  });

  const totals = useMemo(() => {
    const clicks = links.reduce((sum, link) => sum + link.clicks, 0);
    const conversions = links.reduce((sum, link) => sum + link.conversions, 0);
    const revenue = links.reduce((sum, link) => sum + link.revenue, 0);
    const conversionRate = clicks > 0 ? Number(((conversions / clicks) * 100).toFixed(2)) : 0;
    return { clicks, conversions, revenue, conversionRate };
  }, [links]);

  const saveConfig = async (event: FormEvent) => {
    event.preventDefault();
    setSavingConfig(true);
    const response = await fetch("/api/admin/social-share", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setSavingConfig(false);

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast.error(payload.error ?? "Could not save social sharing settings");
      return;
    }

    setConfig(payload.config);
    toast.success("Social sharing settings updated");
  };

  const createLink = async (event: FormEvent) => {
    event.preventDefault();
    setCreatingLink(true);
    const response = await fetch("/api/admin/social-share/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: linkForm.platform,
        productId: linkForm.productId || undefined,
      }),
    });
    setCreatingLink(false);

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast.error(payload.error ?? "Could not generate share link");
      return;
    }

    setLinks((prev) => [payload.link, ...prev]);
    toast.success("Share link created");
  };

  const simulateShareClick = async (link: SocialShareLink) => {
    setTrackingClickId(link.id);
    const response = await fetch("/api/admin/social-share/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shareId: link.id,
        converted: true,
        revenue: link.productId ? (products.find((product) => product.id === link.productId)?.price ?? 0) : 0,
      }),
    });
    setTrackingClickId(null);

    if (!response.ok) {
      toast.error("Could not track share click");
      return;
    }

    const revenueDelta = link.productId ? (products.find((product) => product.id === link.productId)?.price ?? 0) : 0;
    setLinks((prev) =>
      prev.map((item) =>
        item.id === link.id
          ? {
              ...item,
              clicks: item.clicks + 1,
              conversions: item.conversions + 1,
              revenue: item.revenue + revenueDelta,
            }
          : item,
      ),
    );

    toast.success("Share click tracked");
  };

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardHeader><CardTitle>Share Clicks</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold text-ink">{totals.clicks}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Conversions</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold text-ink">{totals.conversions}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Share Revenue</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold text-ink">{formatCurrency(totals.revenue)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Conversion Rate</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold text-ink">{totals.conversionRate}%</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Social Sharing Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-3" onSubmit={saveConfig}>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={config.whatsappEnabled} onChange={(event) => setConfig({ ...config, whatsappEnabled: event.target.checked })} />
              WhatsApp share
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={config.instagramEnabled} onChange={(event) => setConfig({ ...config, instagramEnabled: event.target.checked })} />
              Instagram share
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={config.facebookEnabled} onChange={(event) => setConfig({ ...config, facebookEnabled: event.target.checked })} />
              Facebook share
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={config.twitterEnabled} onChange={(event) => setConfig({ ...config, twitterEnabled: event.target.checked })} />
              X/Twitter share
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={config.referralRewardsEnabled} onChange={(event) => setConfig({ ...config, referralRewardsEnabled: event.target.checked })} />
              Referral rewards enabled
            </label>
            <Input type="number" min={0} value={config.rewardPointsPerReferral} onChange={(event) => setConfig({ ...config, rewardPointsPerReferral: Number(event.target.value) })} placeholder="Points per referral" />
            <Button disabled={savingConfig} className="md:col-span-1">{savingConfig ? "Saving..." : "Save Share Settings"}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generate Product Share Link</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-2 md:grid-cols-3" onSubmit={createLink}>
            <select className="h-10 rounded-md border border-slate-200 px-2 text-sm" value={linkForm.platform} onChange={(event) => setLinkForm({ ...linkForm, platform: event.target.value as SocialShareLink["platform"] })}>
              <option value="whatsapp">whatsapp</option>
              <option value="instagram">instagram</option>
              <option value="facebook">facebook</option>
              <option value="twitter">twitter</option>
            </select>
            <select className="h-10 rounded-md border border-slate-200 px-2 text-sm" value={linkForm.productId} onChange={(event) => setLinkForm({ ...linkForm, productId: event.target.value })}>
              <option value="">Store-level referral link</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
            <Button disabled={creatingLink}>{creatingLink ? "Generating..." : "Create Share Link"}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Share Links</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Platform</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Ref</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>Conversions</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.map((link) => {
                const productName = link.productId ? products.find((product) => product.id === link.productId)?.name ?? link.productId : "All products";
                return (
                  <TableRow key={link.id}>
                    <TableCell>{link.platform}</TableCell>
                    <TableCell>{productName}</TableCell>
                    <TableCell>{link.refCode}</TableCell>
                    <TableCell>{link.clicks}</TableCell>
                    <TableCell>{link.conversions}</TableCell>
                    <TableCell>{formatCurrency(link.revenue)}</TableCell>
                    <TableCell className="space-x-2">
                      <button type="button" className="text-xs text-slate-700" onClick={() => copyLink(link.url)}>copy</button>
                      <button type="button" className="text-xs text-emerald-700" disabled={trackingClickId === link.id} onClick={() => simulateShareClick(link)}>
                        {trackingClickId === link.id ? "tracking..." : "track click"}
                      </button>
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
