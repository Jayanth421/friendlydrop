"use client";

import { useState } from "react";
import { FileText, Download, Search, Eye, CheckCircle2, Clock, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Order as DBOrder, Product } from "@/types";

interface Invoice {
  id: string;
  orderNumber: string;
  customer: string;
  date: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  items: number;
}


function statusBadge(status: Invoice["status"]) {
  switch (status) {
    case "paid": return <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs gap-1"><CheckCircle2 className="h-3 w-3" />Paid</Badge>;
    case "pending": return <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-xs gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
    case "overdue": return <Badge className="bg-red-50 text-red-700 border border-red-200 text-xs">Overdue</Badge>;
  }
}

export function VendorInvoicesContent({ initialOrders, vendorProducts }: { initialOrders: DBOrder[], vendorProducts: Product[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | Invoice["status"]>("all");

  const productIds = new Set(vendorProducts.map(p => p.id));
  const invoices: Invoice[] = initialOrders.map((o) => {
    const vendorItems = o.items.filter(item => productIds.has(item.productId));
    const amount = vendorItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    return {
      id: `INV-${o.id.slice(0, 8).toUpperCase()}`,
      orderNumber: o.id.slice(0, 8).toUpperCase(),
      customer: o.address.fullName,
      date: new Date(o.createdAt).toISOString().split("T")[0],
      amount,
      status: o.payment.status === "success" ? "paid" : "pending",
      items: vendorItems.reduce((acc, item) => acc + item.quantity, 0),
    };
  });

  const filtered = invoices.filter((inv) => {
    const matchSearch =
      inv.customer.toLowerCase().includes(search.toLowerCase()) ||
      inv.id.toLowerCase().includes(search.toLowerCase()) ||
      inv.orderNumber.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || inv.status === filter;
    return matchSearch && matchFilter;
  });

  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const totalPending = invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + i.amount, 0);

  const printInvoice = (inv: Invoice) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return toast.error("Please allow popups to print invoices");
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${inv.id}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 40px; color: #111; max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 40px; }
            h1 { margin: 0; color: #111; }
            .details { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .total { font-size: 24px; font-weight: bold; border-top: 2px solid #eee; padding-top: 20px; text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>INVOICE</h1>
              <p>#${inv.id}</p>
            </div>
            <div style="text-align: right">
              <strong>FriendlyDrop Vendor</strong><br/>
              Order: ${inv.orderNumber}<br/>
              Date: ${inv.date}
            </div>
          </div>
          <div class="details">
            <div>
              <strong>Billed To:</strong><br/>
              ${inv.customer}
            </div>
            <div>
              <strong>Status:</strong> ${inv.status.toUpperCase()}<br/>
              <strong>Total Items:</strong> ${inv.items}
            </div>
          </div>
          <div class="total">
            Total Amount: Rs. ${inv.amount.toLocaleString("en-IN")}
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-stone-900">Invoices</h1>
        <p className="mt-0.5 text-sm text-stone-500">View and download invoices for all your orders</p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">Total Invoices</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{invoices.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Paid Amount</p>
          <p className="mt-1 text-2xl font-bold text-emerald-900">₹{totalPaid.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">Pending Amount</p>
          <p className="mt-1 text-2xl font-bold text-amber-900">₹{totalPending.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-xl border-stone-200" placeholder="Search invoices..." />
        </div>
        <div className="flex gap-1 rounded-xl border border-stone-200 bg-stone-50 p-1">
          {(["all", "paid", "pending", "overdue"] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${filter === f ? "bg-stone-900 text-white" : "text-stone-600 hover:text-stone-900"}`}
            >
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-100 bg-stone-50">
            <tr>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-stone-400">Invoice</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-stone-400">Order</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-stone-400">Customer</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-stone-400">Date</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-stone-400">Items</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-stone-400">Amount</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-stone-400">Status</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-stone-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filtered.map((inv) => (
              <tr key={inv.id} className="hover:bg-stone-50 transition">
                <td className="px-5 py-3 font-mono text-xs font-semibold text-stone-700">{inv.id}</td>
                <td className="px-5 py-3 text-stone-600">{inv.orderNumber}</td>
                <td className="px-5 py-3 font-medium text-stone-900">{inv.customer}</td>
                <td className="px-5 py-3 text-stone-600">{new Date(inv.date).toLocaleDateString("en-IN")}</td>
                <td className="px-5 py-3 text-stone-600">{inv.items}</td>
                <td className="px-5 py-3 font-semibold text-stone-900">₹{inv.amount.toLocaleString("en-IN")}</td>
                <td className="px-5 py-3">{statusBadge(inv.status)}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => printInvoice(inv)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition" title="Print / Preview">
                      <Printer className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => printInvoice(inv)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition" title="Download">
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-stone-400">
                  <FileText className="mx-auto mb-2 h-8 w-8 text-stone-300" />
                  No invoices found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
