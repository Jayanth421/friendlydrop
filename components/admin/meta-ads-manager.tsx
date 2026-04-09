"use client";

import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { MetaAdsCampaign, MetaAdsConfig, Product } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

interface MetaAdsManagerProps {
  initialConfig: MetaAdsConfig;
  initialCampaigns: MetaAdsCampaign[];
  products: Array<Pick<Product, "id" | "name" | "category" | "price">>;
}

export function MetaAdsManager({ initialConfig, initialCampaigns, products }: MetaAdsManagerProps) {
  const [config, setConfig] = useState(initialConfig);
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [savingConfig, setSavingConfig] = useState(false);
  const [syncingCatalog, setSyncingCatalog] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    type: "conversion" as MetaAdsCampaign["type"],
    status: "draft" as MetaAdsCampaign["status"],
    dailyBudget: 1000,
    productIds: [] as string[],
    addProductId: "",
  });
  const [creatingCampaign, setCreatingCampaign] = useState(false);

  const totals = useMemo(() => {
    const spend = campaigns.reduce((sum, campaign) => sum + campaign.spend, 0);
    const revenue = campaigns.reduce((sum, campaign) => sum + campaign.revenue, 0);
    const clicks = campaigns.reduce((sum, campaign) => sum + campaign.clicks, 0);
    const impressions = campaigns.reduce((sum, campaign) => sum + campaign.impressions, 0);
    const conversions = campaigns.reduce((sum, campaign) => sum + campaign.conversions, 0);
    const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0;
    const cpa = conversions > 0 ? Number((spend / conversions).toFixed(2)) : 0;
    const roi = spend > 0 ? Number((((revenue - spend) / spend) * 100).toFixed(2)) : 0;
    return { spend, revenue, clicks, impressions, conversions, ctr, cpa, roi };
  }, [campaigns]);

  const saveConfig = async (event: FormEvent) => {
    event.preventDefault();
    setSavingConfig(true);

    const response = await fetch("/api/admin/meta-ads", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setSavingConfig(false);

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast.error(payload.error ?? "Could not update Meta Ads configuration");
      return;
    }

    setConfig(payload.config);
    toast.success("Meta Ads connection updated");
  };

  const syncCatalog = async () => {
    setSyncingCatalog(true);
    const response = await fetch("/api/admin/meta-ads/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productIds: campaignForm.productIds.length ? campaignForm.productIds : undefined,
      }),
    });
    setSyncingCatalog(false);

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast.error(payload.error ?? "Catalog sync failed");
      return;
    }

    setConfig((prev) => ({ ...prev, lastSyncAt: payload.lastSyncAt }));
    toast.success(`Catalog sync complete (${payload.synced ?? 0} products)`);
  };

  const addProductToCampaign = () => {
    if (!campaignForm.addProductId) {
      return;
    }

    setCampaignForm((prev) => ({
      ...prev,
      productIds: [...new Set([...prev.productIds, prev.addProductId])],
      addProductId: "",
    }));
  };

  const removeProductFromCampaign = (productId: string) => {
    setCampaignForm((prev) => ({
      ...prev,
      productIds: prev.productIds.filter((item) => item !== productId),
    }));
  };

  const createCampaign = async (event: FormEvent) => {
    event.preventDefault();
    if (!campaignForm.productIds.length) {
      toast.error("Select at least one product");
      return;
    }

    setCreatingCampaign(true);

    const response = await fetch("/api/admin/meta-ads/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: campaignForm.name,
        type: campaignForm.type,
        status: campaignForm.status,
        dailyBudget: Number(campaignForm.dailyBudget),
        productIds: campaignForm.productIds,
      }),
    });
    setCreatingCampaign(false);

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast.error(payload.error ?? "Could not create campaign");
      return;
    }

    setCampaigns((prev) => [payload.campaign, ...prev]);
    setCampaignForm({
      name: "",
      type: "conversion",
      status: "draft",
      dailyBudget: 1000,
      productIds: [],
      addProductId: "",
    });
    toast.success("Meta Ads campaign created");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Meta Ads Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-3" onSubmit={saveConfig}>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={config.connected}
                onChange={(event) => setConfig({ ...config, connected: event.target.checked })}
              />
              Connected
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={config.syncEnabled}
                onChange={(event) => setConfig({ ...config, syncEnabled: event.target.checked })}
              />
              Auto feed sync enabled
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={config.testMode}
                onChange={(event) => setConfig({ ...config, testMode: event.target.checked })}
              />
              Test mode
            </label>
            <Input placeholder="Ad Account ID" value={config.adAccountId ?? ""} onChange={(event) => setConfig({ ...config, adAccountId: event.target.value })} />
            <Input placeholder="Business ID" value={config.businessId ?? ""} onChange={(event) => setConfig({ ...config, businessId: event.target.value })} />
            <Input placeholder="Catalog ID" value={config.catalogId ?? ""} onChange={(event) => setConfig({ ...config, catalogId: event.target.value })} />
            <Input placeholder="Pixel ID" value={config.pixelId ?? ""} onChange={(event) => setConfig({ ...config, pixelId: event.target.value })} />
            <Input placeholder="Access token reference" value={config.accessTokenRef ?? ""} onChange={(event) => setConfig({ ...config, accessTokenRef: event.target.value })} />
            <Button disabled={savingConfig}>{savingConfig ? "Saving..." : "Save Integration"}</Button>
          </form>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <p>Last feed sync: {config.lastSyncAt ? new Date(config.lastSyncAt).toLocaleString() : "never"}</p>
            <Button variant="outline" size="sm" disabled={syncingCatalog} onClick={syncCatalog}>
              {syncingCatalog ? "Syncing..." : "Sync Product Catalog"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardHeader><CardTitle>Total Spend</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold text-ink">{formatCurrency(totals.spend)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Revenue</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold text-ink">{formatCurrency(totals.revenue)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>CTR</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold text-ink">{totals.ctr}%</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Cost / Purchase</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold text-ink">{formatCurrency(totals.cpa)}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Campaign</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={createCampaign}>
            <div className="grid gap-2 md:grid-cols-4">
              <Input
                placeholder="Campaign name"
                value={campaignForm.name}
                onChange={(event) => setCampaignForm({ ...campaignForm, name: event.target.value })}
                required
              />
              <select className="h-10 rounded-md border border-slate-200 px-2 text-sm" value={campaignForm.type} onChange={(event) => setCampaignForm({ ...campaignForm, type: event.target.value as MetaAdsCampaign["type"] })}>
                <option value="conversion">conversion</option>
                <option value="retargeting">retargeting</option>
                <option value="catalog">catalog</option>
              </select>
              <select className="h-10 rounded-md border border-slate-200 px-2 text-sm" value={campaignForm.status} onChange={(event) => setCampaignForm({ ...campaignForm, status: event.target.value as MetaAdsCampaign["status"] })}>
                <option value="draft">draft</option>
                <option value="active">active</option>
                <option value="paused">paused</option>
                <option value="completed">completed</option>
              </select>
              <Input type="number" value={campaignForm.dailyBudget} onChange={(event) => setCampaignForm({ ...campaignForm, dailyBudget: Number(event.target.value) })} placeholder="Daily budget" min={100} />
            </div>

            <div className="grid gap-2 md:grid-cols-[1fr_auto]">
              <select className="h-10 rounded-md border border-slate-200 px-2 text-sm" value={campaignForm.addProductId} onChange={(event) => setCampaignForm({ ...campaignForm, addProductId: event.target.value })}>
                <option value="">Select product</option>
                {products.map((product) => (
                  <option value={product.id} key={product.id}>
                    {product.name} ({product.category})
                  </option>
                ))}
              </select>
              <Button type="button" variant="outline" onClick={addProductToCampaign}>Add Product</Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {campaignForm.productIds.map((productId) => {
                const product = products.find((item) => item.id === productId);
                return (
                  <button
                    key={productId}
                    type="button"
                    className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
                    onClick={() => removeProductFromCampaign(productId)}
                  >
                    {product?.name ?? productId} x
                  </button>
                );
              })}
            </div>

            <Button disabled={creatingCampaign}>{creatingCampaign ? "Creating..." : "Create Campaign"}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>CTR</TableHead>
                <TableHead>Conversions</TableHead>
                <TableHead>Spend</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>ROI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => {
                const ctr = campaign.impressions > 0 ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2) : "0.00";
                const roi = campaign.spend > 0 ? (((campaign.revenue - campaign.spend) / campaign.spend) * 100).toFixed(2) : "0.00";
                return (
                  <TableRow key={campaign.id}>
                    <TableCell>{campaign.name}</TableCell>
                    <TableCell>{campaign.type}</TableCell>
                    <TableCell>{campaign.status}</TableCell>
                    <TableCell>{ctr}%</TableCell>
                    <TableCell>{campaign.conversions}</TableCell>
                    <TableCell>{formatCurrency(campaign.spend)}</TableCell>
                    <TableCell>{formatCurrency(campaign.revenue)}</TableCell>
                    <TableCell>{roi}%</TableCell>
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
