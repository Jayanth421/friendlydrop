"use client";

import { ChangeEvent, useMemo, useState } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

interface BulkValidationError {
  row: number;
  field: string;
  code: string;
  message: string;
}

interface BulkDryRunResponse {
  ok: boolean;
  dryRun: boolean;
  validCount: number;
  invalidCount: number;
  errors: BulkValidationError[];
  preview: Array<Record<string, unknown>>;
}

const categoryOptions: Product["category"][] = ["photo-prints", "stickers", "personalized-gifts"];

function parseRowsFromJson(input: unknown) {
  if (Array.isArray(input)) {
    return input as Array<Record<string, unknown>>;
  }

  if (input && typeof input === "object" && Array.isArray((input as { rows?: unknown[] }).rows)) {
    return (input as { rows: Array<Record<string, unknown>> }).rows;
  }

  return [];
}

async function parseCsv(file: File) {
  return new Promise<Array<Record<string, unknown>>>((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => resolve(result.data),
      error: reject,
    });
  });
}

async function parseExcel(file: File) {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.SheetNames[0];

  if (!firstSheet) {
    return [];
  }

  return XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[firstSheet], {
    defval: "",
  });
}

async function parseFileRows(file: File) {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".csv")) {
    return parseCsv(file);
  }

  if (fileName.endsWith(".json")) {
    const text = await file.text();
    const parsed = JSON.parse(text) as unknown;
    return parseRowsFromJson(parsed);
  }

  if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
    return parseExcel(file);
  }

  throw new Error("Unsupported file format. Use CSV, Excel (.xlsx/.xls), or JSON.");
}

export function BulkProductUploader({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [importRows, setImportRows] = useState<Array<Record<string, unknown>>>([]);
  const [validation, setValidation] = useState<BulkDryRunResponse | null>(null);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [runningAction, setRunningAction] = useState(false);
  const [bulkAction, setBulkAction] = useState<"update_price" | "update_discount" | "change_category" | "delete" | "set_status" | "update_stock">("update_price");
  const [actionPrice, setActionPrice] = useState("0");
  const [actionPriceDeltaPercent, setActionPriceDeltaPercent] = useState("0");
  const [actionDiscount, setActionDiscount] = useState("0");
  const [actionCategory, setActionCategory] = useState<Product["category"]>("photo-prints");
  const [actionSubcategory, setActionSubcategory] = useState("");
  const [actionStatus, setActionStatus] = useState<"draft" | "published" | "archived">("published");
  const [actionVisibility, setActionVisibility] = useState<"public" | "private">("public");
  const [actionStock, setActionStock] = useState("0");
  const [actionStockMode, setActionStockMode] = useState<"set" | "increment">("set");

  const selectedCount = selectedProductIds.length;
  const allSelected = useMemo(
    () => products.length > 0 && selectedCount === products.length,
    [products.length, selectedCount],
  );

  const onFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setValidating(true);
    setValidation(null);

    try {
      const rows = await parseFileRows(file);
      if (!rows.length) {
        toast.error("No rows found in file");
        return;
      }

      setImportRows(rows);
      const response = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, dryRun: true }),
      });

      const payload = (await response.json().catch(() => ({}))) as BulkDryRunResponse;
      if (!response.ok || !payload.ok) {
        toast.error("Validation failed");
        return;
      }

      setValidation(payload);
      toast.success(`Dry run complete: ${payload.validCount} valid rows`);
    } catch (error) {
      console.error(error);
      toast.error("Could not parse file");
    } finally {
      setValidating(false);
      event.target.value = "";
    }
  };

  const importProducts = async (forceImport: boolean) => {
    if (!importRows.length) {
      toast.error("Upload a file first");
      return;
    }

    setImporting(true);

    try {
      const response = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: importRows, forceImport }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(payload.error ?? "Bulk import failed");
        return;
      }

      toast.success(`Imported ${payload.createdCount ?? 0} products`);
      setValidation(null);
      setImportRows([]);
    } catch (error) {
      console.error(error);
      toast.error("Bulk import request failed");
    } finally {
      setImporting(false);
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedProductIds(checked ? products.map((product) => product.id) : []);
  };

  const toggleProduct = (productId: string, checked: boolean) => {
    setSelectedProductIds((prev) => {
      if (checked) {
        return [...new Set([...prev, productId])];
      }
      return prev.filter((id) => id !== productId);
    });
  };

  const runBulkAction = async () => {
    if (!selectedProductIds.length) {
      toast.error("Select at least one product");
      return;
    }

    setRunningAction(true);

    try {
      const value: Record<string, unknown> = {};

      if (bulkAction === "update_price") {
        value.price = Number(actionPrice);
        value.deltaPercent = Number(actionPriceDeltaPercent);
      }

      if (bulkAction === "update_discount") {
        value.discountPercent = Number(actionDiscount);
      }

      if (bulkAction === "change_category") {
        value.category = actionCategory;
        value.subcategory = actionSubcategory.trim() || undefined;
      }

      if (bulkAction === "set_status") {
        value.status = actionStatus;
        value.visibility = actionVisibility;
      }

      if (bulkAction === "update_stock") {
        value.stock = Number(actionStock);
        value.mode = actionStockMode;
      }

      const response = await fetch("/api/admin/products/bulk/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: bulkAction,
          productIds: selectedProductIds,
          value: Object.keys(value).length ? value : undefined,
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(payload.error ?? "Bulk action failed");
        return;
      }

      setProducts((prev) => {
        if (bulkAction === "delete") {
          return prev.filter((product) => !selectedProductIds.includes(product.id));
        }

        return prev.map((product) => {
          if (!selectedProductIds.includes(product.id)) {
            return product;
          }

          if (bulkAction === "update_price") {
            const basePrice = Number(actionPrice);
            const deltaPercent = Number(actionPriceDeltaPercent);
            const nextPrice = Math.max(Math.round(basePrice + (basePrice * deltaPercent) / 100), 1);
            return { ...product, price: nextPrice };
          }

          if (bulkAction === "update_discount") {
            return { ...product, discountPercent: Math.max(Math.min(Number(actionDiscount), 90), 0) };
          }

          if (bulkAction === "change_category") {
            return {
              ...product,
              category: actionCategory,
              subcategory: actionSubcategory.trim() || undefined,
            };
          }

          if (bulkAction === "set_status") {
            return {
              ...product,
              status: actionStatus,
              visibility: actionVisibility,
            };
          }

          if (bulkAction === "update_stock") {
            const requestedStock = Math.round(Number(actionStock));
            const nextStock = actionStockMode === "increment"
              ? Math.max((product.stock ?? 0) + requestedStock, 0)
              : Math.max(requestedStock, 0);
            return { ...product, stock: nextStock };
          }

          return product;
        });
      });

      setSelectedProductIds([]);
      toast.success(`Bulk action complete for ${payload.processed ?? selectedProductIds.length} products`);
    } catch (error) {
      console.error(error);
      toast.error("Bulk action request failed");
    } finally {
      setRunningAction(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Product Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
            Import file formats: CSV, Excel (.xlsx/.xls), JSON. Supported fields include pricing, SKU, stock, category, tags, attributes, SEO, and image URLs.
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            {validating ? "Validating..." : "Upload Product File"}
            <input type="file" accept=".csv,.json,.xlsx,.xls" className="hidden" onChange={onFileSelect} />
          </label>

          {validation ? (
            <div className="grid gap-2 text-sm sm:grid-cols-3">
              <div className="rounded border border-slate-200 p-3">
                <p className="text-slate-500">Rows received</p>
                <p className="text-lg font-semibold text-ink">{importRows.length}</p>
              </div>
              <div className="rounded border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-emerald-700">Valid rows</p>
                <p className="text-lg font-semibold text-emerald-800">{validation.validCount}</p>
              </div>
              <div className="rounded border border-rose-200 bg-rose-50 p-3">
                <p className="text-rose-700">Invalid rows</p>
                <p className="text-lg font-semibold text-rose-800">{validation.invalidCount}</p>
              </div>
            </div>
          ) : null}

          {validation?.preview?.length ? (
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Validation Preview</p>
              <div className="rounded border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validation.preview.slice(0, 12).map((row, index) => (
                      <TableRow key={`${String(row.sku ?? "row")}-${index}`}>
                        <TableCell>{String(row.name ?? "-")}</TableCell>
                        <TableCell>{String(row.sku ?? "-")}</TableCell>
                        <TableCell>{String(row.category ?? "-")}</TableCell>
                        <TableCell>{String(row.price ?? "-")}</TableCell>
                        <TableCell>{String(row.stock ?? "-")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}

          {validation?.errors?.length ? (
            <div>
              <p className="mb-2 text-sm font-medium text-rose-700">Validation Errors</p>
              <div className="max-h-56 overflow-auto rounded border border-rose-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Field</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validation.errors.slice(0, 80).map((error, index) => (
                      <TableRow key={`${error.row}-${error.field}-${index}`}>
                        <TableCell>{error.row}</TableCell>
                        <TableCell>{error.field}</TableCell>
                        <TableCell>{error.code}</TableCell>
                        <TableCell>{error.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button disabled={!validation?.validCount || importing} onClick={() => importProducts(false)}>
              {importing ? "Importing..." : "Import Valid Rows"}
            </Button>
            <Button
              variant="outline"
              disabled={!validation?.validCount || importing}
              onClick={() => importProducts(true)}
            >
              Force Import Valid Rows
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bulk Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-3">
            <select
              className="h-10 rounded-md border border-slate-200 px-2 text-sm"
              value={bulkAction}
              onChange={(event) => setBulkAction(event.target.value as typeof bulkAction)}
            >
              <option value="update_price">Update price</option>
              <option value="update_discount">Update discount</option>
              <option value="change_category">Change category</option>
              <option value="set_status">Set status/visibility</option>
              <option value="update_stock">Update stock</option>
              <option value="delete">Delete products</option>
            </select>

            {bulkAction === "update_price" ? (
              <div className="grid gap-2 sm:grid-cols-2 md:col-span-2">
                <Input type="number" value={actionPrice} onChange={(event) => setActionPrice(event.target.value)} placeholder="Base price" />
                <Input type="number" value={actionPriceDeltaPercent} onChange={(event) => setActionPriceDeltaPercent(event.target.value)} placeholder="Delta %" />
              </div>
            ) : null}

            {bulkAction === "update_discount" ? (
              <Input type="number" className="md:col-span-2" value={actionDiscount} onChange={(event) => setActionDiscount(event.target.value)} placeholder="Discount percent" />
            ) : null}

            {bulkAction === "change_category" ? (
              <div className="grid gap-2 sm:grid-cols-2 md:col-span-2">
                <select
                  className="h-10 rounded-md border border-slate-200 px-2 text-sm"
                  value={actionCategory}
                  onChange={(event) => setActionCategory(event.target.value as Product["category"])}
                >
                  {categoryOptions.map((category) => (
                    <option value={category} key={category}>{category}</option>
                  ))}
                </select>
                <Input value={actionSubcategory} onChange={(event) => setActionSubcategory(event.target.value)} placeholder="Subcategory (optional)" />
              </div>
            ) : null}

            {bulkAction === "set_status" ? (
              <div className="grid gap-2 sm:grid-cols-2 md:col-span-2">
                <select className="h-10 rounded-md border border-slate-200 px-2 text-sm" value={actionStatus} onChange={(event) => setActionStatus(event.target.value as typeof actionStatus)}>
                  <option value="draft">draft</option>
                  <option value="published">published</option>
                  <option value="archived">archived</option>
                </select>
                <select className="h-10 rounded-md border border-slate-200 px-2 text-sm" value={actionVisibility} onChange={(event) => setActionVisibility(event.target.value as typeof actionVisibility)}>
                  <option value="public">public</option>
                  <option value="private">private</option>
                </select>
              </div>
            ) : null}

            {bulkAction === "update_stock" ? (
              <div className="grid gap-2 sm:grid-cols-2 md:col-span-2">
                <Input type="number" value={actionStock} onChange={(event) => setActionStock(event.target.value)} placeholder="Stock value" />
                <select className="h-10 rounded-md border border-slate-200 px-2 text-sm" value={actionStockMode} onChange={(event) => setActionStockMode(event.target.value as typeof actionStockMode)}>
                  <option value="set">Set stock</option>
                  <option value="increment">Increment stock</option>
                </select>
              </div>
            ) : null}
          </div>

          <Button disabled={!selectedProductIds.length || runningAction} onClick={runBulkAction}>
            {runningAction ? "Running..." : `Apply to ${selectedProductIds.length} selected products`}
          </Button>

          <div className="rounded border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(event) => toggleSelectAll(event.target.checked)}
                    />
                  </TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedProductIds.includes(product.id)}
                        onChange={(event) => toggleProduct(product.id, event.target.checked)}
                      />
                    </TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.sku ?? "-"}</TableCell>
                    <TableCell>{product.status ?? "published"} / {product.visibility ?? "public"}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>{formatCurrency(product.price)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-slate-500">Selected products: {selectedCount}</p>
        </CardContent>
      </Card>
    </div>
  );
}
