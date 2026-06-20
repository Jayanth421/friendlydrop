"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Copy, Eye, FileText, Trash2, Star, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Product, ProductStatus } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

const statusVariant: Record<ProductStatus, string> = {
  draft: "bg-amber-100 text-amber-800 border-amber-200",
  published: "bg-emerald-100 text-emerald-800 border-emerald-200",
  archived: "bg-stone-100 text-stone-800 border-stone-200",
};

export const getColumns = (
  onDelete: (id: string) => void,
  onToggleFeatured: (id: string, featured: boolean) => void
): ColumnDef<Product>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "primaryImage",
    header: "Image",
    cell: ({ row }) => {
      const primaryImage = row.getValue("primaryImage") as string;
      return (
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-stone-100 bg-stone-50">
          {primaryImage ? (
            <img src={primaryImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-stone-400">
              —
            </div>
          )}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="px-0 hover:bg-transparent"
      >
        Product Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div className="min-w-[150px] max-w-[300px]">
          <Link
            href={`/admin/products/${product.id}/edit`}
            className="font-medium text-stone-900 hover:underline block truncate"
          >
            {product.name}
          </Link>
          <span className="text-xs text-stone-500 font-mono block truncate">
            {product.sku ?? "No SKU"}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "sku",
    header: "SKU",
    cell: ({ row }) => <span className="font-mono text-xs text-stone-600">{row.getValue("sku") || "—"}</span>,
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const category = row.getValue("category") as string;
      return (
        <Badge variant="outline" className="capitalize border-stone-200 bg-stone-50 text-stone-700">
          {category ? category.replace(/-/g, " ") : "—"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "price",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="px-0 hover:bg-transparent"
      >
        Price
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"));
      return <div className="font-medium text-stone-900">{formatCurrency(price)}</div>;
    },
  },
  {
    accessorKey: "stock",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="px-0 hover:bg-transparent"
      >
        Stock
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const stock = parseInt(row.getValue("stock")) || 0;
      let colorClass = "text-stone-700";
      if (stock <= 0) colorClass = "text-rose-600 font-semibold";
      else if (stock <= 10) colorClass = "text-amber-600 font-semibold";

      return <span className={`text-sm ${colorClass}`}>{stock}</span>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = (row.getValue("status") ?? "published") as ProductStatus;
      return (
        <Badge
          variant="outline"
          className={`capitalize font-medium border ${statusVariant[status] ?? "bg-stone-100 text-stone-700"}`}
        >
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "featured",
    header: "Featured",
    cell: ({ row }) => {
      const product = row.original;
      return (
        <button
          onClick={() => onToggleFeatured(product.id, !product.featured)}
          className={`rounded-full p-1 transition ${
            product.featured ? "text-amber-500 hover:text-amber-600" : "text-stone-300 hover:text-stone-400"
          }`}
          title={product.featured ? "Unfeature Product" : "Feature Product"}
        >
          <Star className="h-4 w-4 fill-current" />
        </button>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="px-0 hover:bg-transparent"
      >
        Created
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-sm text-stone-500">{formatDate(row.getValue("createdAt"))}</span>,
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const product = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(product.id)}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Product ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/admin/products/${product.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Product
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={`/products/${product.id}`} target="_blank" rel="noopener noreferrer">
                <Eye className="mr-2 h-4 w-4" />
                View Store Page
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-rose-600 focus:text-rose-700 focus:bg-rose-50"
              onClick={() => onDelete(product.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Product
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
