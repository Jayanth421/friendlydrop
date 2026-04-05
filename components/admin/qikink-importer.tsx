"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function QikinkImporter() {
  const router = useRouter();
  const [limit, setLimit] = useState(120);
  const [mode, setMode] = useState<"upsert" | "create">("upsert");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("published");
  const [loading, setLoading] = useState(false);

  const importProducts = async () => {
    setLoading(true);

    const response = await fetch("/api/admin/products/qikink/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode,
        limit,
        page: 1,
        status,
        visibility: "public",
      }),
    });

    setLoading(false);

    if (!response.ok) {
      toast.error("Qikink import failed");
      return;
    }

    const data = (await response.json()) as {
      createdCount: number;
      updatedCount: number;
      skippedCount: number;
      warnings?: string[];
    };

    if (data.warnings?.length) {
      toast.warning(data.warnings[0]);
    }

    toast.success(`Imported. Created ${data.createdCount}, updated ${data.updatedCount}, skipped ${data.skippedCount}.`);
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Products from Qikink</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-3">
          <Input type="number" min={1} max={400} value={limit} onChange={(event) => setLimit(Number(event.target.value || 120))} />
          <select
            className="h-10 rounded-md border border-slate-200 bg-white px-2 text-sm"
            value={mode}
            onChange={(event) => setMode(event.target.value as "upsert" | "create")}
          >
            <option value="upsert">Upsert by SKU</option>
            <option value="create">Create only</option>
          </select>
          <select
            className="h-10 rounded-md border border-slate-200 bg-white px-2 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value as "draft" | "published" | "archived")}
          >
            <option value="published">published</option>
            <option value="draft">draft</option>
            <option value="archived">archived</option>
          </select>
        </div>

        <p className="text-xs text-slate-500">
          Requires `QIKINK_PRODUCTS_ENDPOINT` (or `QIKINK_API_BASE_URL` + `QIKINK_PRODUCTS_PATH`) and Qikink credentials in environment variables.
        </p>

        <Button disabled={loading} onClick={importProducts}>
          {loading ? "Importing..." : "Sync Qikink Products"}
        </Button>
      </CardContent>
    </Card>
  );
}
