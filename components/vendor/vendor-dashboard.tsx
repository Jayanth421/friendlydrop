"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Bell,
  Boxes,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Download,
  Edit,
  FileText,
  ImagePlus,
  LineChart,
  Menu,
  MessageSquare,
  Moon,
  Package,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  Sun,
  Tag,
  Trash2,
  Truck,
  Upload,
  Users,
  Video,
  Wallet,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

type DashboardProduct = {
  id: string;
  name: string;
  image?: string;
  stock: number;
  status?: string;
  rating?: number;
  reviewCount?: number;
};

type DashboardOrder = {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  shipping?: { courier?: string; trackingId?: string; eta?: string };
};

type DashboardCustomer = {
  id: string;
  name: string;
  email: string;
  orderCount?: number;
  totalSpend?: number;
  segment?: string;
};

type DashboardPayout = {
  id: string;
  vendorId: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  periodLabel: string;
  createdAt: string;
};

export type VendorDashboardSnapshot = {
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  productCount: number;
  activeProductCount: number;
  outOfStockProductCount: number;
  orderCount: number;
  revenue: number;
  monthlyRevenue: number;
  todayRevenue: number;
  totalEarnings: number;
  availableBalance: number;
  pendingPayoutAmount: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  returnRequests: number;
  customerCount: number;
  openSupportTickets: number;
  reviewCount: number;
  averageRating: number;
  lowStockProducts: number;
  recentOrders: DashboardOrder[];
  products: DashboardProduct[];
  customers: DashboardCustomer[];
  payouts: DashboardPayout[];
  revenueByDay: Array<{ label: string; revenue: number; orders: number }>;
  productPerformance: Array<DashboardProduct & { revenue: number; orders: number }>;
};

type VendorDashboardProps = {
  snapshot: VendorDashboardSnapshot;
};

const navItems = [
  { id: "overview", label: "Overview", icon: LineChart },
  { id: "products", label: "Products", icon: Package },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "customers", label: "Customers", icon: Users },
  { id: "media", label: "Media Library", icon: ImagePlus },
  { id: "wallet", label: "Earnings", icon: Wallet },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "coupons", label: "Coupons", icon: Tag },
  { id: "shipping", label: "Shipping", icon: Truck },
  { id: "profile", label: "Store Profile", icon: Store },
  { id: "analytics", label: "Analytics", icon: BarChart },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

type SectionId = (typeof navItems)[number]["id"];

function CountUp({ value, money = false }: { value: number; money?: boolean }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 700;
    const start = performance.now();
    const tick = (time: number) => {
      const progress = Math.min((time - start) / duration, 1);
      setDisplay(Math.round(value * progress));
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  }, [value]);

  return <>{money ? formatCurrency(display) : display.toLocaleString("en-IN")}</>;
}

function statusClass(status: string) {
  if (["delivered", "completed", "approved", "published"].includes(status)) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (["pending", "processing", "return_requested"].includes(status)) return "border-amber-200 bg-amber-50 text-amber-700";
  if (["cancelled", "failed", "rejected", "archived"].includes(status)) return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-sky-200 bg-sky-50 text-sky-700";
}

function StatCard({ label, value, helper, icon: Icon, money }: { label: string; value: number; helper: string; icon: typeof Store; money?: boolean }) {
  return (
    <div className="rounded-lg border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
            <CountUp value={value} money={money} />
          </p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{helper}</p>
    </div>
  );
}

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-950 dark:text-white">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function MiniAction({ icon: Icon, label, href }: { icon: typeof Store; label: string; href?: string }) {
  const content = (
    <>
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
      {content}
    </button>
  );
}

export function VendorDashboard({ snapshot }: VendorDashboardProps) {
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const [dark, setDark] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const notifications = useMemo(
    () => [
      { label: "New orders", value: snapshot.pendingOrders },
      { label: "Payment updates", value: snapshot.payouts.filter((payout) => payout.status === "pending").length },
      { label: "Review alerts", value: snapshot.reviewCount },
      { label: "Return requests", value: snapshot.returnRequests },
      { label: "Stock alerts", value: snapshot.lowStockProducts },
    ],
    [snapshot],
  );

  const orderRows = [
    { label: "New", value: snapshot.pendingOrders, tone: "bg-sky-500" },
    { label: "Processing", value: snapshot.processingOrders, tone: "bg-amber-500" },
    { label: "Shipped", value: snapshot.shippedOrders, tone: "bg-indigo-500" },
    { label: "Delivered", value: snapshot.deliveredOrders, tone: "bg-emerald-500" },
    { label: "Cancelled", value: snapshot.cancelledOrders, tone: "bg-rose-500" },
    { label: "Returns", value: snapshot.returnRequests, tone: "bg-orange-500" },
  ];
  const quickActions = [
    { icon: Plus, label: "Add Product", section: "products" as SectionId },
    { icon: ImagePlus, label: "Upload Banner", section: "media" as SectionId },
    { icon: Store, label: "Upload Logo", section: "media" as SectionId },
    { icon: Tag, label: "Create Coupon", section: "coupons" as SectionId },
    { icon: ClipboardList, label: "View Orders", section: "orders" as SectionId },
    { icon: Boxes, label: "Manage Inventory", section: "products" as SectionId },
    { icon: Settings, label: "Store Settings", section: "profile" as SectionId },
    { icon: BarChart, label: "View Analytics", section: "analytics" as SectionId },
  ];

  const shell = (
    <div className="min-h-screen bg-[linear-gradient(135deg,#eef6ff_0%,#f8fafc_45%,#eef2ff_100%)] text-slate-900 transition dark:bg-[linear-gradient(135deg,#07111f_0%,#0f172a_50%,#111827_100%)] dark:text-slate-100">
      <div className="flex">
        <aside className={`${mobileNavOpen ? "fixed inset-y-0 left-0 z-50 flex" : "hidden"} w-72 flex-col border-r border-white/70 bg-white/85 p-4 shadow-xl backdrop-blur lg:sticky lg:top-0 lg:flex lg:h-screen dark:border-slate-700 dark:bg-slate-950/90`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-gradient-to-br from-sky-600 to-indigo-600 text-white">
                <Store className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Vendor</p>
                <h1 className="truncate text-base font-semibold">{snapshot.vendorName}</h1>
              </div>
            </div>
            <button type="button" className="lg:hidden" onClick={() => setMobileNavOpen(false)} aria-label="Close vendor navigation">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="mt-6 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveSection(item.id);
                    setMobileNavOpen(false);
                  }}
                  className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${active ? "bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto rounded-lg border border-sky-100 bg-sky-50 p-3 text-sm text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100">
            <p className="font-semibold">Store health</p>
            <p className="mt-1 text-xs">Rating {snapshot.averageRating || 0}/5, {snapshot.lowStockProducts} stock alerts.</p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-white/70 bg-white/70 px-4 py-3 backdrop-blur dark:border-slate-700 dark:bg-slate-950/70 lg:px-6">
            <div className="flex items-center gap-3">
              <button type="button" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white lg:hidden dark:border-slate-700 dark:bg-slate-900" onClick={() => setMobileNavOpen(true)} aria-label="Open vendor navigation">
                <Menu className="h-4 w-4" />
              </button>
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-900" placeholder="Search products, orders, customers..." />
              </div>
              <button type="button" className="relative grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900" aria-label="Notifications">
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
              </button>
              <button type="button" className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900" onClick={() => setDark((value) => !value)} aria-label="Toggle theme">
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          </header>

          <main className="space-y-5 p-4 lg:p-6">
            <div className="rounded-lg border border-white/70 bg-gradient-to-r from-slate-950 via-sky-900 to-indigo-900 p-5 text-white shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-sky-100">Marketplace seller console</p>
                  <h2 className="mt-1 text-2xl font-semibold">Manage products, orders, earnings, and customers from one workspace.</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild className="h-10 bg-white text-slate-950 hover:bg-slate-100">
                    <button type="button" onClick={() => setActiveSection("products")} className="inline-flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add Product
                    </button>
                  </Button>
                  <Button type="button" variant="outline" className="h-10 border-white/40 bg-white/10 text-white hover:bg-white/20" onClick={() => setActiveSection("media")}>
                      <Upload className="h-4 w-4" />
                      Upload Media
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total products" value={snapshot.productCount} helper={`${snapshot.activeProductCount} active products`} icon={Package} />
              <StatCard label="Out of stock" value={snapshot.outOfStockProductCount} helper={`${snapshot.lowStockProducts} low-stock alerts`} icon={Boxes} />
              <StatCard label="Total orders" value={snapshot.orderCount} helper={`${snapshot.pendingOrders} pending orders`} icon={ClipboardList} />
              <StatCard label="Total customers" value={snapshot.customerCount} helper={`${snapshot.openSupportTickets} customer messages`} icon={Users} />
              <StatCard label="Total revenue" value={snapshot.revenue} helper="All vendor sales" icon={ShoppingBag} money />
              <StatCard label="Monthly revenue" value={snapshot.monthlyRevenue} helper="Current month" icon={LineChart} money />
              <StatCard label="Today's revenue" value={snapshot.todayRevenue} helper="Since midnight" icon={CreditCard} money />
              <StatCard label="Total earnings" value={snapshot.totalEarnings} helper={`${formatCurrency(snapshot.availableBalance)} available`} icon={Wallet} money />
            </div>

            <Panel title="Quick Actions">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => setActiveSection(action.section)}
                      className="flex h-11 items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {action.label}
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </button>
                  );
                })}
              </div>
            </Panel>

            {activeSection === "overview" ? (
              <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
                <Panel title="Revenue Analytics" action={<Badge variant="outline">Last 7 days</Badge>}>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={snapshot.revenueByDay}>
                        <defs>
                          <linearGradient id="vendorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0284c7" stopOpacity={0.45} />
                            <stop offset="95%" stopColor="#0284c7" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `₹${Number(value) / 1000}k`} />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Area type="monotone" dataKey="revenue" stroke="#0284c7" fill="url(#vendorRevenue)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Panel>

                <Panel title="Sales Statistics">
                  <div className="space-y-3">
                    {orderRows.map((row) => (
                      <div key={row.label}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span>{row.label}</span>
                          <span className="font-semibold">{row.value}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                          <div className={`h-2 rounded-full ${row.tone}`} style={{ width: `${Math.min(100, (row.value / Math.max(snapshot.orderCount, 1)) * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>

                <Panel title="Recent Orders" action={<MiniAction icon={Download} label="Invoices" />}>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[620px] text-left text-sm">
                      <thead className="text-xs uppercase tracking-[0.12em] text-slate-500">
                        <tr>
                          <th className="py-2">Order</th>
                          <th>Status</th>
                          <th>Tracking</th>
                          <th>Date</th>
                          <th className="text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {snapshot.recentOrders.map((order) => (
                          <tr key={order.id}>
                            <td className="py-3 font-semibold">#{order.id}</td>
                            <td><span className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusClass(order.status)}`}>{order.status}</span></td>
                            <td>{order.shipping?.trackingId ?? "Pending"}</td>
                            <td>{formatDate(order.createdAt)}</td>
                            <td className="text-right font-semibold">{formatCurrency(order.totalAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>

                <Panel title="Notifications">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {notifications.map((item) => (
                      <div key={item.label} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950">
                        <span>{item.label}</span>
                        <Badge variant={item.value ? "default" : "secondary"}>{item.value}</Badge>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            ) : null}

            {activeSection === "products" ? (
              <div className="space-y-5">
                <Panel title="Product Management" action={<div className="flex flex-wrap gap-2"><MiniAction icon={Plus} label="Add Product" /><MiniAction icon={Upload} label="Bulk Product Upload" /></div>}>
                  <div className="grid gap-3 md:grid-cols-3">
                    <MiniAction icon={Edit} label="Edit Product" />
                    <MiniAction icon={Trash2} label="Delete Product" />
                    <MiniAction icon={ImagePlus} label="Product Image Gallery" />
                    <MiniAction icon={Video} label="Product Videos" />
                    <MiniAction icon={Boxes} label="Inventory Management" />
                    <MiniAction icon={Tag} label="Categories" />
                    <MiniAction icon={Settings} label="Product Variations" />
                    <MiniAction icon={Search} label="Product SEO Settings" />
                  </div>
                </Panel>
                <Panel title="Product Performance">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {snapshot.productPerformance.map((product) => (
                      <article key={product.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                        <div className="aspect-[4/3] overflow-hidden rounded-lg bg-slate-200">
                          {product.image ? <img src={product.image} alt={product.name} className="h-full w-full object-cover" /> : null}
                        </div>
                        <h3 className="mt-3 line-clamp-2 text-sm font-semibold">{product.name}</h3>
                        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                          <span>{formatCurrency(product.revenue)}</span>
                          <span>{product.stock} stock</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </Panel>
              </div>
            ) : null}

            {activeSection === "orders" ? (
              <Panel title="Order Management">
                <div className="grid gap-3 md:grid-cols-3">
                  {orderRows.map((row) => (
                    <div key={row.label} className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                      <p className="text-sm text-slate-500">{row.label} Orders</p>
                      <p className="mt-2 text-2xl font-semibold">{row.value}</p>
                    </div>
                  ))}
                  <MiniAction icon={Download} label="Download Invoice" />
                  <MiniAction icon={Truck} label="Order Tracking" />
                  <MiniAction icon={Edit} label="Update Order Status" />
                  <MiniAction icon={FileText} label="Order Details" />
                  <MiniAction icon={Trash2} label="Refund Requests" />
                  <MiniAction icon={ClipboardList} label="Order History" />
                </div>
              </Panel>
            ) : null}

            {activeSection === "customers" ? (
              <Panel title="Customer Management" action={<Badge variant="outline">{snapshot.customerCount} customers</Badge>}>
                <div className="mb-4 grid gap-3 md:grid-cols-4">
                  <MiniAction icon={Users} label="Customer List" />
                  <MiniAction icon={ShoppingBag} label="Purchase History" />
                  <MiniAction icon={Star} label="Customer Reviews" />
                  <MiniAction icon={MessageSquare} label="Customer Messages" />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {snapshot.customers.map((customer) => (
                    <div key={customer.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                      <p className="font-semibold">{customer.name}</p>
                      <p className="text-sm text-slate-500">{customer.email}</p>
                      <div className="mt-3 flex justify-between text-xs text-slate-500">
                        <span>{customer.orderCount ?? 0} orders</span>
                        <span>{formatCurrency(customer.totalSpend ?? 0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            ) : null}

            {activeSection === "media" ? (
              <Panel title="Media Library" action={<Badge variant="outline">QOENS storage</Badge>}>
                <div className="grid gap-3 md:grid-cols-4">
                  <MiniAction icon={ImagePlus} label="Upload Images" />
                  <MiniAction icon={Video} label="Upload Videos" />
                  <MiniAction icon={FileText} label="Upload PDFs" />
                  <MiniAction icon={ImagePlus} label="Upload Banners" />
                  <MiniAction icon={Store} label="Upload Logos" />
                  <MiniAction icon={Search} label="Media Search" />
                  <MiniAction icon={ChevronRight} label="Media Preview" />
                  <MiniAction icon={Trash2} label="Media Delete" />
                  <MiniAction icon={Download} label="Copy Media URL" />
                </div>
              </Panel>
            ) : null}

            {activeSection === "wallet" ? (
              <div className="grid gap-5 lg:grid-cols-3">
                <StatCard label="Available balance" value={snapshot.availableBalance} helper="Ready for withdrawal" icon={Wallet} money />
                <StatCard label="Pending payments" value={snapshot.pendingPayoutAmount} helper="Settlement in progress" icon={CreditCard} money />
                <StatCard label="Total earnings" value={snapshot.totalEarnings} helper="After marketplace commission estimate" icon={ShoppingBag} money />
                <Panel title="Transaction History" action={<MiniAction icon={Wallet} label="Withdraw Money" />}>
                  <div className="space-y-2">
                    {snapshot.payouts.map((payout) => (
                      <div key={payout.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-950">
                        <div>
                          <p className="font-semibold">{payout.periodLabel}</p>
                          <p className="text-xs text-slate-500">{formatDate(payout.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(payout.amount)}</p>
                          <span className={`rounded-full border px-2 py-0.5 text-xs ${statusClass(payout.status)}`}>{payout.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            ) : null}

            {activeSection === "reviews" ? (
              <Panel title="Reviews & Ratings">
                <div className="grid gap-3 md:grid-cols-3">
                  <StatCard label="Average rating" value={Math.round(snapshot.averageRating * 10)} helper={`${snapshot.averageRating}/5 store score`} icon={Star} />
                  <StatCard label="Product reviews" value={snapshot.reviewCount} helper="Across vendor catalog" icon={MessageSquare} />
                  <StatCard label="Store reviews" value={snapshot.reviewCount} helper="Reply queue overview" icon={Store} />
                </div>
              </Panel>
            ) : null}

            {activeSection === "coupons" ? (
              <Panel title="Marketing Tools">
                <div className="grid gap-3 md:grid-cols-4">
                  <MiniAction icon={Tag} label="Coupon Management" />
                  <MiniAction icon={LineChart} label="Discount Campaigns" />
                  <MiniAction icon={ImagePlus} label="Promotional Banners" />
                  <MiniAction icon={Star} label="Featured Products" />
                  <MiniAction icon={Bell} label="Flash Sales" />
                </div>
              </Panel>
            ) : null}

            {activeSection === "shipping" ? (
              <Panel title="Shipping Management">
                <div className="grid gap-3 md:grid-cols-4">
                  <MiniAction icon={Settings} label="Shipping Settings" />
                  <MiniAction icon={Truck} label="Delivery Tracking" />
                  <MiniAction icon={CreditCard} label="Shipping Charges" />
                  <MiniAction icon={Package} label="Pickup Requests" />
                </div>
              </Panel>
            ) : null}

            {activeSection === "profile" ? (
              <Panel title="Store Profile">
                <div className="grid gap-3 md:grid-cols-3">
                  <MiniAction icon={Store} label="Store Name" />
                  <MiniAction icon={ImagePlus} label="Store Logo" />
                  <MiniAction icon={ImagePlus} label="Store Banner" />
                  <MiniAction icon={ImagePlus} label="Store Cover Image" />
                  <MiniAction icon={Store} label="Store Description" />
                  <MiniAction icon={Tag} label="Store Categories" />
                  <MiniAction icon={Settings} label="Store Theme Settings" />
                  <MiniAction icon={Star} label="Featured Products" />
                  <MiniAction icon={ImagePlus} label="Promotional Banners" />
                  <MiniAction icon={MessageSquare} label="Social Media Links" />
                  <MiniAction icon={Users} label="Contact Information" />
                  <MiniAction icon={ShieldCheck} label="Business Information" />
                  <MiniAction icon={CreditCard} label="Bank Details" />
                  <MiniAction icon={ClipboardList} label="GST Information" />
                </div>
              </Panel>
            ) : null}

            {activeSection === "analytics" ? (
              <Panel title="Analytics & Reports">
                <div className="mb-4 grid gap-3 md:grid-cols-3">
                  <MiniAction icon={LineChart} label="Sales Analytics" />
                  <MiniAction icon={CreditCard} label="Revenue Reports" />
                  <MiniAction icon={ClipboardList} label="Order Reports" />
                  <MiniAction icon={Package} label="Product Performance" />
                  <MiniAction icon={Users} label="Customer Statistics" />
                  <MiniAction icon={Download} label="Monthly Reports" />
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={snapshot.productPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} hide />
                      <YAxis tickLine={false} axisLine={false} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Bar dataKey="revenue" fill="#2563eb" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            ) : null}

            {activeSection === "settings" ? (
              <Panel title="Account Settings, Security & Permissions">
                <div className="grid gap-3 md:grid-cols-4">
                  <MiniAction icon={Users} label="Vendor Profile" />
                  <MiniAction icon={Store} label="Business Information" />
                  <MiniAction icon={CreditCard} label="Bank Account Details" />
                  <MiniAction icon={Wallet} label="Payment Settings" />
                  <MiniAction icon={ShieldCheck} label="Password Change" />
                  <MiniAction icon={Bell} label="Notification Settings" />
                  <MiniAction icon={ShieldCheck} label="Security Settings" />
                </div>
                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
                  Vendors can only view and manage their own products, orders, customers, store profile, media, and analytics. Marketplace and admin settings remain restricted.
                </div>
              </Panel>
            ) : null}
          </main>
        </div>
      </div>
    </div>
  );

  return <div className={dark ? "dark" : ""}>{shell}</div>;
}
