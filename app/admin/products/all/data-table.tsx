"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDown,
  Download,
  Upload,
  Search,
  Filter,
  Trash2,
  CheckCircle,
  FileEdit,
  Archive,
  RefreshCw,
  Plus,
  ArrowRight,
  AlertTriangle,
  X,
  Loader2,
  FileSpreadsheet,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Product, ProductCategory, ProductStatus } from "@/types";
import { getColumns } from "./columns";

interface ProductsDataTableProps {
  data: Product[];
}

export function ProductsDataTable({ data }: ProductsDataTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});

  // Additional Filter states
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [stockFilter, setStockFilter] = React.useState<string>("all");

  // Bulk Operations State
  const [isBulkUpdating, setIsBulkUpdating] = React.useState(false);

  // CSV Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
  const [importFile, setImportFile] = React.useState<File | null>(null);
  const [isImporting, setIsImporting] = React.useState(false);
  const [importResult, setImportResult] = React.useState<{
    ok: boolean;
    dryRun?: boolean;
    validCount?: number;
    invalidCount?: number;
    errors?: any[];
    preview?: any[];
  } | null>(null);
  const [parsedRows, setParsedRows] = React.useState<any[] | null>(null);

  // Delete Individual Product Handler
  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Product deleted successfully");
        router.refresh();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to delete product");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while deleting the product");
    }
  };

  // Toggle Featured Handler
  const handleToggleFeatured = async (id: string, featured: boolean) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured }),
      });
      if (res.ok) {
        toast.success(`Product ${featured ? "featured" : "unfeatured"} successfully`);
        router.refresh();
      } else {
        toast.error("Failed to update product featured status");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    }
  };

  const columns = React.useMemo(
    () => getColumns(handleDeleteProduct, handleToggleFeatured),
    []
  );

  // Filter products locally for full searchability & speed
  const filteredProducts = React.useMemo(() => {
    return data.filter((product) => {
      // Search text
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = product.name?.toLowerCase().includes(query);
        const matchesSku = product.sku?.toLowerCase().includes(query);
        const matchesDesc = product.description?.toLowerCase().includes(query);
        const matchesTags = product.tags?.some(tag => tag.toLowerCase().includes(query));
        if (!matchesName && !matchesSku && !matchesDesc && !matchesTags) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter !== "all") {
        if (product.category !== categoryFilter) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== "all") {
        if ((product.status ?? "published") !== statusFilter) {
          return false;
        }
      }

      // Stock status filter
      if (stockFilter !== "all") {
        const stock = product.stock ?? 0;
        if (stockFilter === "out") {
          if (stock > 0) return false;
        } else if (stockFilter === "low") {
          if (stock <= 0 || stock > 10) return false;
        } else if (stockFilter === "in") {
          if (stock <= 10) return false;
        }
      }

      return true;
    });
  }, [data, searchQuery, categoryFilter, statusFilter, stockFilter]);

  const table = useReactTable({
    data: filteredProducts,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const selectedRowIds = React.useMemo(() => {
    return Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((key) => {
        const index = parseInt(key);
        return filteredProducts[index]?.id;
      })
      .filter(Boolean);
  }, [rowSelection, filteredProducts]);

  // Bulk Operations
  const handleBulkStatusChange = async (newStatus: ProductStatus) => {
    if (!selectedRowIds.length) return;
    setIsBulkUpdating(true);
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedRowIds,
          updates: { status: newStatus },
        }),
      });
      if (res.ok) {
        toast.success(`Successfully updated ${selectedRowIds.length} products to ${newStatus}`);
        setRowSelection({});
        router.refresh();
      } else {
        toast.error("Failed to update products status");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedRowIds.length) return;
    if (!confirm(`Are you sure you want to delete ${selectedRowIds.length} products? This action is permanent!`)) return;

    setIsBulkUpdating(true);
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedRowIds }),
      });
      if (res.ok) {
        toast.success(`Successfully deleted ${selectedRowIds.length} products`);
        setRowSelection({});
        router.refresh();
      } else {
        toast.error("Failed to delete products");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    if (!filteredProducts.length) {
      toast.error("No products to export");
      return;
    }

    try {
      const csvData = filteredProducts.map((p) => ({
        name: p.name ?? "",
        description: p.description ?? "",
        price: p.price ?? 0,
        discountPercent: p.discountPercent ?? 0,
        images: (p.images ?? []).join("|"),
        category: p.category ?? "",
        subcategory: p.subcategory ?? "",
        stock: p.stock ?? 0,
        sku: p.sku ?? "",
        weightGrams: p.weightGrams ?? 500,
        brand: p.brand ?? "",
        attributes: p.attributes ? JSON.stringify(p.attributes) : "",
        tags: (p.tags ?? []).join("|"),
        featured: p.featured ? "true" : "false",
        status: p.status ?? "published",
        visibility: p.visibility ?? "public",
        metaTitle: p.seo?.metaTitle ?? "",
        metaDescription: p.seo?.metaDescription ?? "",
        imageAlt: p.seo?.imageAlt ?? "",
        canonicalUrl: p.seo?.canonicalUrl ?? "",
        keywords: (p.seo?.keywords ?? []).join("|"),
        noindex: p.seo?.noindex ? "true" : "false",
        nofollow: p.seo?.nofollow ? "true" : "false",
      }));

      const csvString = Papa.unparse(csvData);
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `products_export_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV exported successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export products to CSV");
    }
  };

  // CSV Import File Picker Handler
  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportResult(null);
      setParsedRows(null);

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setParsedRows(results.data);
          // Run dryRun validation
          handleTriggerUpload(results.data, true);
        },
        error: (err) => {
          toast.error(`CSV Parsing error: ${err.message}`);
        },
      });
    }
  };

  const handleTriggerUpload = async (rows: any[], dryRun = true, forceImport = false) => {
    setIsImporting(true);
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows,
          dryRun,
          forceImport,
        }),
      });

      const responseData = await res.json();
      setImportResult({
        ok: res.ok,
        ...responseData,
      });

      if (!dryRun) {
        if (res.ok) {
          toast.success(`Successfully imported ${responseData.createdCount} products`);
          setIsImportModalOpen(false);
          setImportFile(null);
          setImportResult(null);
          setParsedRows(null);
          router.refresh();
        } else {
          toast.error(responseData.error || "Failed to import products");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error during import request");
    } finally {
      setIsImporting(false);
    }
  };

  const handleCloseImportModal = () => {
    setIsImportModalOpen(false);
    setImportFile(null);
    setImportResult(null);
    setParsedRows(null);
  };

  return (
    <div className="w-full space-y-4">
      {/* Search and Advanced Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <Input
            placeholder="Search by name, SKU, tags or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 rounded-xl border-stone-200 focus:border-stone-400 focus:ring-stone-400"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider hidden md:inline">Category:</span>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-10 w-[150px] rounded-xl border-stone-200">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="photo-prints">Photo Prints</SelectItem>
                <SelectItem value="stickers">Stickers</SelectItem>
                <SelectItem value="personalized-gifts">Personalized Gifts</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider hidden md:inline">Status:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 w-[130px] rounded-xl border-stone-200">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stock Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider hidden md:inline">Stock:</span>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="h-10 w-[130px] rounded-xl border-stone-200">
                <SelectValue placeholder="All Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="in">In Stock (&gt;10)</SelectItem>
                <SelectItem value="low">Low Stock (1-10)</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 rounded-xl border-stone-200 gap-2 font-medium">
                <Filter className="h-4 w-4 text-stone-500" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id.replace(/([A-Z])/g, " $1")}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export & Import Buttons */}
          <Button
            variant="outline"
            className="h-10 rounded-xl border-stone-200 gap-2 font-medium hover:bg-stone-50"
            onClick={handleExportCSV}
          >
            <Download className="h-4 w-4 text-stone-500" />
            Export
          </Button>

          <Button
            variant="outline"
            className="h-10 rounded-xl border-stone-200 gap-2 font-medium hover:bg-stone-50"
            onClick={() => setIsImportModalOpen(true)}
          >
            <Upload className="h-4 w-4 text-stone-500" />
            Import
          </Button>
        </div>
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedRowIds.length > 0 && (
        <div className="flex items-center justify-between gap-4 bg-stone-900 text-white px-5 py-3 rounded-xl shadow-lg border border-stone-800 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-stone-950">
              {selectedRowIds.length}
            </div>
            <span className="text-sm font-medium text-stone-200">
              products selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider mr-2 hidden sm:inline">Bulk Actions:</span>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBulkStatusChange("published")}
              disabled={isBulkUpdating}
              className="text-white hover:bg-stone-800 hover:text-white rounded-lg h-9 gap-1.5 text-xs font-medium"
            >
              <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
              Publish
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBulkStatusChange("draft")}
              disabled={isBulkUpdating}
              className="text-white hover:bg-stone-800 hover:text-white rounded-lg h-9 gap-1.5 text-xs font-medium"
            >
              <FileEdit className="h-3.5 w-3.5 text-amber-400" />
              Draft
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBulkStatusChange("archived")}
              disabled={isBulkUpdating}
              className="text-white hover:bg-stone-800 hover:text-white rounded-lg h-9 gap-1.5 text-xs font-medium"
            >
              <Archive className="h-3.5 w-3.5 text-stone-400" />
              Archive
            </Button>

            <div className="h-4 w-px bg-stone-700 mx-1" />

            <Button
              variant="ghost"
              size="sm"
              onClick={handleBulkDelete}
              disabled={isBulkUpdating}
              className="text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 rounded-lg h-9 gap-1.5 text-xs font-medium"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Table Component */}
      <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-stone-50/70 border-b border-stone-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-stone-600 font-semibold h-11 text-xs uppercase tracking-wider">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-stone-50/50 transition border-b border-stone-150 data-[state=selected]:bg-stone-50/80"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3.5 text-stone-700">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-28 text-center text-stone-500"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertTriangle className="h-6 w-6 text-stone-400" />
                    <span>No products found matching filters.</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-2 py-1">
        <div className="text-xs text-stone-500 font-medium">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-lg border-stone-200 text-stone-600 hover:bg-stone-50"
          >
            Previous
          </Button>
          <div className="text-xs font-mono px-3 text-stone-600">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-lg border-stone-200 text-stone-600 hover:bg-stone-50"
          >
            Next
          </Button>
        </div>
      </div>

      {/* CSV Import Modal (Radix/HTML Overlay) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/50">
              <div>
                <h3 className="text-base font-bold text-stone-900">Bulk Import Products via CSV</h3>
                <p className="text-xs text-stone-500 mt-0.5">Select a valid CSV file with product column headers</p>
              </div>
              <button
                onClick={handleCloseImportModal}
                className="rounded-full p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* File Upload Zone */}
              <div className="border-2 border-dashed border-stone-200 hover:border-stone-400 transition rounded-xl p-6 text-center bg-stone-50/30 flex flex-col items-center justify-center gap-3 relative cursor-pointer group">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={isImporting}
                />
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-white border border-stone-100 shadow-sm flex items-center justify-center text-stone-600 group-hover:scale-105 transition">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-stone-800">
                    {importFile ? importFile.name : "Choose CSV File"}
                  </span>
                  <p className="text-xs text-stone-500 mt-1">
                    {importFile ? `${(importFile.size / 1024).toFixed(1)} KB` : "Drag and drop or click to browse files (.csv)"}
                  </p>
                </div>
              </div>

              {/* Validation Results Indicator */}
              {isImporting && (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-stone-600" />
                  <p className="text-sm font-medium text-stone-600">Analyzing products data...</p>
                </div>
              )}

              {importResult && !isImporting && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Status Banner */}
                  <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                    importResult.ok 
                      ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                      : "bg-rose-50 border-rose-100 text-rose-800"
                  }`}>
                    {importResult.ok ? (
                      <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
                    )}
                    <div>
                      <h4 className="font-bold text-sm">
                        {importResult.ok ? "Ready for Import!" : "Validation Failures Found"}
                      </h4>
                      <p className="text-xs opacity-90 mt-0.5">
                        {importResult.validCount} valid row(s) to import. {importResult.invalidCount} error(s) found.
                      </p>
                    </div>
                  </div>

                  {/* Errors List */}
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-stone-600 uppercase tracking-wider">Validation Errors Summary</p>
                      <div className="border border-rose-100 rounded-xl overflow-hidden divide-y divide-rose-50 bg-rose-50/20 max-h-48 overflow-y-auto">
                        {importResult.errors.map((err, i) => (
                          <div key={i} className="px-4 py-2.5 text-xs flex items-start justify-between gap-3">
                            <div>
                              <span className="font-semibold text-stone-700">Row {err.row}:</span>{" "}
                              <span className="text-stone-600">{err.message}</span>
                            </div>
                            <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700 shrink-0 text-[10px] uppercase font-bold">
                              {err.field}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preview Valid Rows */}
                  {importResult.preview && importResult.preview.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-stone-600 uppercase tracking-wider">Preview (First 3 products)</p>
                      <div className="border border-stone-200 rounded-xl overflow-hidden bg-white divide-y divide-stone-100">
                        {importResult.preview.slice(0, 3).map((item: any, i) => (
                          <div key={i} className="px-4 py-3 text-xs flex items-center justify-between gap-4">
                            <div className="min-w-0">
                              <p className="font-semibold text-stone-900 truncate">{item.name}</p>
                              <p className="text-stone-500 font-mono text-[10px] mt-0.5">
                                SKU: {item.sku || "—"} | {item.category}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-bold text-stone-900">${item.price}</span>
                              <p className="text-stone-500 text-[10px] mt-0.5">{item.stock} in stock</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/50 flex justify-between gap-2.5">
              <Button
                variant="outline"
                className="h-10 rounded-xl border-stone-200"
                onClick={handleCloseImportModal}
                disabled={isImporting}
              >
                Cancel
              </Button>

              <div className="flex gap-2">
                {importResult && !importResult.ok && (importResult.validCount ?? 0) > 0 && (
                  <Button
                    onClick={() => parsedRows && handleTriggerUpload(parsedRows, false, true)}
                    disabled={isImporting}
                    className="h-10 rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition gap-1.5"
                  >
                    <Check className="h-4 w-4" />
                    Skip Invalid & Import
                  </Button>
                )}
                {importResult?.ok && (importResult.validCount ?? 0) > 0 && (
                  <Button
                    onClick={() => parsedRows && handleTriggerUpload(parsedRows, false, false)}
                    disabled={isImporting}
                    className="h-10 rounded-xl bg-stone-900 hover:bg-stone-800 text-white shadow-sm transition gap-1.5"
                  >
                    <Check className="h-4 w-4" />
                    Confirm Import
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
