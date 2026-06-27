"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CatalogCategory, Product, SeoPlatformConfig, SeoTrafficInsight } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface SeoManagerProps {
  initialConfig: SeoPlatformConfig;
  initialInsights: SeoTrafficInsight[];
  initialProducts: Array<Pick<Product, "id" | "name" | "slug" | "category" | "seo">>;
  initialCategories: Array<Pick<CatalogCategory, "id" | "name" | "slug" | "seo">>;
}

export function SeoManager({ initialConfig, initialInsights, initialProducts, initialCategories }: SeoManagerProps) {
  const [config, setConfig] = useState(initialConfig);
  const [insights] = useState(initialInsights);
  const [products, setProducts] = useState(initialProducts);
  const [savingConfig, setSavingConfig] = useState(false);
  const [savingProductId, setSavingProductId] = useState<string | null>(null);

  const seoTotals = useMemo(() => {
    const clicks = insights.reduce((sum, insight) => sum + insight.clicks, 0);
    const impressions = insights.reduce((sum, insight) => sum + insight.impressions, 0);
    const avgPosition = insights.length
      ? Number((insights.reduce((sum, insight) => sum + insight.avgPosition, 0) / insights.length).toFixed(2))
      : 0;
    return { clicks, impressions, avgPosition };
  }, [insights]);

  const saveConfig = async () => {
    setSavingConfig(true);
    const response = await fetch("/api/admin/seo", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setSavingConfig(false);

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast.error(payload.error ?? "Could not save SEO settings");
      return;
    }

    setConfig(payload.config);
    toast.success("Technical SEO settings updated");
  };

  const updateProductSeoField = (productId: string, field: "metaTitle" | "metaDescription" | "imageAlt", value: string) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId
          ? {
              ...product,
              seo: {
                ...(product.seo ?? {}),
                [field]: value,
              },
            }
          : product,
      ),
    );
  };

  const saveProductSeo = async (productId: string) => {
    const product = products.find((item) => item.id === productId);
    if (!product) {
      return;
    }

    setSavingProductId(productId);
    const response = await fetch(`/api/admin/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seo: product.seo,
      }),
    });
    setSavingProductId(null);

    if (!response.ok) {
      toast.error("Could not save product SEO");
      return;
    }

    toast.success("Product SEO saved");
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>SEO Clicks</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold text-ink">{seoTotals.clicks}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Impressions</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold text-ink">{seoTotals.impressions}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Avg Position</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold text-ink">{seoTotals.avgPosition}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Technical SEO Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={config.sitemapEnabled} onChange={(event) => setConfig({ ...config, sitemapEnabled: event.target.checked })} />
              Auto sitemap
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={config.schemaProductEnabled} onChange={(event) => setConfig({ ...config, schemaProductEnabled: event.target.checked })} />
              Product schema
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={config.schemaOrganizationEnabled} onChange={(event) => setConfig({ ...config, schemaOrganizationEnabled: event.target.checked })} />
              Organization schema
            </label>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <select className="h-10 rounded-md border border-slate-200 px-2 text-sm" value={config.robotsPolicy} onChange={(event) => setConfig({ ...config, robotsPolicy: event.target.value as SeoPlatformConfig["robotsPolicy"] })}>
              <option value="index_follow">index, follow</option>
              <option value="index_nofollow">index, nofollow</option>
              <option value="noindex_follow">noindex, follow</option>
              <option value="noindex_nofollow">noindex, nofollow</option>
            </select>
            <select className="h-10 rounded-md border border-slate-200 px-2 text-sm" value={config.pageSpeedMode} onChange={(event) => setConfig({ ...config, pageSpeedMode: event.target.value as SeoPlatformConfig["pageSpeedMode"] })}>
              <option value="balanced">Balanced</option>
              <option value="performance">Performance first</option>
              <option value="quality">Quality first</option>
            </select>
          </div>

          <Input
            placeholder="Noindex category slugs (comma separated)"
            value={config.noindexCategorySlugs.join(",")}
            onChange={(event) =>
              setConfig({
                ...config,
                noindexCategorySlugs: event.target.value.split(",").map((slug) => slug.trim()).filter(Boolean),
              })
            }
          />

          <Button disabled={savingConfig} onClick={saveConfig}>{savingConfig ? "Saving..." : "Save SEO Settings"}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Product SEO Editor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {products.slice(0, 30).map((product) => (
            <div key={product.id} className="rounded border border-slate-200 p-3">
              <p className="text-sm font-semibold text-ink">{product.name}</p>
              <p className="mb-2 text-xs text-slate-500">/{product.slug} • {product.category}</p>
              <div className="grid gap-2 md:grid-cols-3">
                <Input
                  placeholder="Meta title"
                  value={product.seo?.metaTitle ?? ""}
                  onChange={(event) => updateProductSeoField(product.id, "metaTitle", event.target.value)}
                />
                <Input
                  placeholder="Meta description"
                  value={product.seo?.metaDescription ?? ""}
                  onChange={(event) => updateProductSeoField(product.id, "metaDescription", event.target.value)}
                />
                <Input
                  placeholder="Image alt text"
                  value={product.seo?.imageAlt ?? ""}
                  onChange={(event) => updateProductSeoField(product.id, "imageAlt", event.target.value)}
                />
              </div>
              <div className="mt-2">
                <Button size="sm" disabled={savingProductId === product.id} onClick={() => saveProductSeo(product.id)}>
                  {savingProductId === product.id ? "Saving..." : "Save Product SEO"}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Category SEO Snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Meta title</TableHead>
                <TableHead>Meta description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>{category.name}</TableCell>
                  <TableCell>{category.slug}</TableCell>
                  <TableCell>{category.seo?.metaTitle ?? "-"}</TableCell>
                  <TableCell>{category.seo?.metaDescription ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Keyword Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Keyword</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>Impressions</TableHead>
                <TableHead>Avg Position</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {insights.map((insight) => (
                <TableRow key={`${insight.keyword}-${insight.source}`}>
                  <TableCell>{insight.keyword}</TableCell>
                  <TableCell>{insight.source}</TableCell>
                  <TableCell>{insight.clicks}</TableCell>
                  <TableCell>{insight.impressions}</TableCell>
                  <TableCell>{insight.avgPosition}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
