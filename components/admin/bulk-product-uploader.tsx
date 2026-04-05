"use client";

import { useState } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BulkProductUploader() {
  const [loading, setLoading] = useState(false);

  const onFile = (file: File) => {
    setLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result: Papa.ParseResult<Record<string, string>>) => {
        const response = await fetch("/api/admin/products/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: result.data }),
        });

        setLoading(false);

        if (!response.ok) {
          toast.error("Bulk upload failed");
          return;
        }

        toast.success("Bulk products uploaded");
      },
      error: () => {
        setLoading(false);
        toast.error("CSV parse failed");
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Product Upload (CSV)</CardTitle>
      </CardHeader>
      <CardContent>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-slate-300 px-4 py-3 text-sm">
          {loading ? "Uploading..." : "Choose CSV"}
          <input type="file" accept=".csv" className="hidden" onChange={(event) => event.target.files?.[0] && onFile(event.target.files[0])} />
        </label>
      </CardContent>
    </Card>
  );
}
