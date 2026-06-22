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
  Loader2,
  Menu,
  MessageSquare,
  Moon,
  Package,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Save,
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
  description?: string;
  price?: number;
  category?: string;
  sku?: string;
  image?: string;
  primaryImage?: string;
  images?: string[];
  stock: number;
  status?: string;
  rating?: number;
  reviewCount?: number;
  discountPercent?: number;
  lowStockThreshold?: number;
  visibility?: "public" | "private";
};

type DashboardOrder = {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  shipping?: { courier?: string; trackingId?: string; eta?: string };
  items?: Array<{ productId: string; name: string; quantity: number; price: number; image?: string }>;
  address?: { fullName?: string; city?: string; state?: string; postalCode?: string };
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

type VendorMediaFile = {
  id: string;
  imageUrl: string;
  path?: string;
  folder?: string;
  contentType?: string;
  sizeBytes?: number;
  createdAt?: string;
};

type ProductFormState = {
  id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  sku: string;
  imageUrl: string;
  status: "draft" | "published" | "archived";
  visibility: "public" | "private";
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

const emptyProductForm: ProductFormState = {
  name: "",
  description: "",
  price: 499,
  category: "photo-prints",
  stock: 10,
  sku: "",
  imageUrl: "",
  status: "published",
  visibility: "public",
};

function productToForm(product: DashboardProduct): ProductFormState {
  return {
    id: product.id,
    name: product.name,
    description: product.description ?? "",
    price: Number(product.price ?? 499),
    category: product.category ?? "photo-prints",
    stock: Number(product.stock ?? 0),
    sku: product.sku ?? "",
    imageUrl: product.primaryImage ?? product.image ?? product.images?.[0] ?? "",
    status: (product.status as ProductFormState["status"]) ?? "published",
    visibility: product.visibility ?? "public",
  };
}

function readErrorMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object" && "error" in data) {
    return String((data as { error?: unknown }).error ?? fallback);
  }
  return fallback;
}

export function VendorDashboard({ snapshot }: VendorDashboardProps) {
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const [dark, setDark] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [products, setProducts] = useState<DashboardProduct[]>(snapshot.products);
  const [orders, setOrders] = useState<DashboardOrder[]>(snapshot.recentOrders);
  const [mediaFiles, setMediaFiles] = useState<VendorMediaFile[]>([]);
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm);
  const [orderDrafts, setOrderDrafts] = useState<Record<string, { status: string; courier: string; trackingId: string; eta: string }>>({});
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 3500);
  };

  const refreshVendorData = async () => {
    const [productsResponse, ordersResponse, mediaResponse] = await Promise.all([
      fetch("/api/vendor/products", { cache: "no-store" }),
      fetch("/api/vendor/orders", { cache: "no-store" }),
      fetch("/api/vendor/media", { cache: "no-store" }),
    ]);

    const [productsData, ordersData, mediaData] = await Promise.all([
      productsResponse.json(),
      ordersResponse.json(),
      mediaResponse.json(),
    ]);

    if (productsResponse.ok) {
      setProducts((productsData.products ?? []).map((product: DashboardProduct) => ({
        ...product,
        image: product.primaryImage ?? product.image ?? product.images?.[0],
      })));
    }

    if (ordersResponse.ok) {
      setOrders(ordersData.orders ?? []);
    }

    if (mediaResponse.ok) {
      setMediaFiles(mediaData.files ?? []);
    }
  };

  useEffect(() => {
    refreshVendorData().catch((error) => {
      console.error(error);
      showNotice("Could not refresh vendor data");
    });
  }, []);

  const uploadProductImage = async (file: File, assignToProduct = true) => {
    setBusyAction("upload-product-image");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "products");
      formData.append("record", "true");

      const response = await fetch("/api/uploads", {
        method: "POST",
        headers: {
          "Idempotency-Key": `vendor-product:${file.name}:${file.size}:${file.lastModified}`,
        },
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(readErrorMessage(data, "Upload failed"));
      }

      const imageUrl = data.path ?? data.imageUrl ?? data.mediaUrl;
      if (assignToProduct) {
        setProductForm((prev) => ({ ...prev, imageUrl }));
      }
      showNotice("Media uploaded");
      await refreshVendorData();
    } catch (error) {
      console.error(error);
      showNotice(error instanceof Error ? error.message : "Image upload failed");
    } finally {
      setBusyAction(null);
    }
  };

  const saveProduct = async () => {
    if (!productForm.name.trim() || !productForm.description.trim() || !productForm.imageUrl.trim()) {
      showNotice("Product name, description, and image are required");
      return;
    }

    setBusyAction("save-product");
    try {
      const payload = {
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        price: Number(productForm.price),
        category: productForm.category.trim() || "photo-prints",
        stock: Number(productForm.stock),
        sku: productForm.sku.trim() || undefined,
        primaryImage: productForm.imageUrl.trim(),
        images: [productForm.imageUrl.trim()],
        status: productForm.status,
        visibility: productForm.visibility,
      };
      const response = await fetch(productForm.id ? `/api/vendor/products/${productForm.id}` : "/api/vendor/products", {
        method: productForm.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(readErrorMessage(data, "Could not save product"));
      }

      setProductForm(emptyProductForm);
      showNotice(productForm.id ? "Product updated" : "Product created");
      await refreshVendorData();
    } catch (error) {
      console.error(error);
      showNotice(error instanceof Error ? error.message : "Could not save product");
    } finally {
      setBusyAction(null);
    }
  };

  const deleteVendorProduct = async (productId: string) => {
    if (!confirm("Delete this product?")) {
      return;
    }

    setBusyAction(`delete-product-${productId}`);
    try {
      const response = await fetch(`/api/vendor/products/${productId}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(readErrorMessage(data, "Could not delete product"));
      }

      showNotice("Product deleted");
      await refreshVendorData();
    } catch (error) {
      console.error(error);
      showNotice(error instanceof Error ? error.message : "Could not delete product");
    } finally {
      setBusyAction(null);
    }
  };

  const draftForOrder = (order: DashboardOrder) => {
    return orderDrafts[order.id] ?? {
      status: order.status,
      courier: order.shipping?.courier ?? "",
      trackingId: order.shipping?.trackingId ?? "",
      eta: order.shipping?.eta ?? "",
    };
  };

  const updateOrderDraft = (order: DashboardOrder, updates: Partial<{ status: string; courier: string; trackingId: string; eta: string }>) => {
    setOrderDrafts((prev) => ({
      ...prev,
      [order.id]: {
        ...draftForOrder(order),
        ...updates,
      },
    }));
  };

  const saveOrderTracking = async (order: DashboardOrder) => {
    const draft = draftForOrder(order);
    setBusyAction(`order-${order.id}`);
    try {
      const statusResponse = await fetch(`/api/vendor/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: draft.status, note: "Updated by vendor dashboard" }),
      });
      const statusData = await statusResponse.json();

      if (!statusResponse.ok) {
        throw new Error(readErrorMessage(statusData, "Could not update status"));
      }

      if (draft.courier.trim() && draft.trackingId.trim()) {
        const shippingResponse = await fetch(`/api/vendor/orders/${order.id}/shipping`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courier: draft.courier.trim(),
            trackingId: draft.trackingId.trim(),
            eta: draft.eta.trim() || undefined,
          }),
        });
        const shippingData = await shippingResponse.json();

        if (!shippingResponse.ok) {
          throw new Error(readErrorMessage(shippingData, "Could not update tracking"));
        }
      }

      showNotice("Order updated");
      await refreshVendorData();
    } catch (error) {
      console.error(error);
      showNotice(error instanceof Error ? error.message : "Could not update order");
    } finally {
      setBusyAction(null);
    }
  };

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
            {notice ? (
              <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100">
                {notice}
              </div>
            ) : null}

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
                        {orders.slice(0, 8).map((order) => (
                          <tr key={order.id}>
                            <td className="py-3 font-semibold">#{order.id}</td>
                            <td><span className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusClass(order.status)}`}>{order.status}</span></td>
                            <td>{order.shipping?.trackingId ?? "Pending"}</td>
                            <td>{formatDate(order.createdAt)}</td>
                            <td className="text-right font-semibold">{formatCurrency(order.totalAmount)}</td>
                          </tr>
                        ))}
                        {!orders.length ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-slate-500">No vendor orders yet.</td>
                          </tr>
                        ) : null}
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
                <Panel
                  title={productForm.id ? "Edit Product" : "Add Product"}
                  action={
                    productForm.id ? (
                      <Button type="button" variant="outline" className="h-9" onClick={() => setProductForm(emptyProductForm)}>
                        <Plus className="h-4 w-4" />
                        New Product
                      </Button>
                    ) : null
                  }
                >
                  <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="space-y-1 text-sm font-medium">
                        <span>Product name</span>
                        <input className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" value={productForm.name} onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))} />
                      </label>
                      <label className="space-y-1 text-sm font-medium">
                        <span>Category</span>
                        <input className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" value={productForm.category} onChange={(event) => setProductForm((prev) => ({ ...prev, category: event.target.value }))} />
                      </label>
                      <label className="space-y-1 text-sm font-medium">
                        <span>Price</span>
                        <input type="number" min="1" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" value={productForm.price} onChange={(event) => setProductForm((prev) => ({ ...prev, price: Number(event.target.value) }))} />
                      </label>
                      <label className="space-y-1 text-sm font-medium">
                        <span>Stock</span>
                        <input type="number" min="0" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" value={productForm.stock} onChange={(event) => setProductForm((prev) => ({ ...prev, stock: Number(event.target.value) }))} />
                      </label>
                      <label className="space-y-1 text-sm font-medium">
                        <span>SKU</span>
                        <input className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" value={productForm.sku} onChange={(event) => setProductForm((prev) => ({ ...prev, sku: event.target.value }))} />
                      </label>
                      <label className="space-y-1 text-sm font-medium">
                        <span>Status</span>
                        <select className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" value={productForm.status} onChange={(event) => setProductForm((prev) => ({ ...prev, status: event.target.value as ProductFormState["status"] }))}>
                          <option value="published">Published</option>
                          <option value="draft">Draft</option>
                          <option value="archived">Archived</option>
                        </select>
                      </label>
                      <label className="space-y-1 text-sm font-medium sm:col-span-2">
                        <span>Description</span>
                        <textarea className="min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={productForm.description} onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))} />
                      </label>
                    </div>
                    <div className="space-y-3">
                      <label className="space-y-1 text-sm font-medium">
                        <span>Product image URL</span>
                        <input className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" value={productForm.imageUrl} onChange={(event) => setProductForm((prev) => ({ ...prev, imageUrl: event.target.value }))} />
                      </label>
                      <div className="rounded-lg border border-dashed border-slate-300 p-4 dark:border-slate-700">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) uploadProductImage(file);
                          }}
                          className="text-sm"
                        />
                        {busyAction === "upload-product-image" ? <p className="mt-2 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Uploading image...</p> : null}
                      </div>
                      {productForm.imageUrl ? (
                        <div className="aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">
                          <img src={productForm.imageUrl} alt="" className="h-full w-full object-cover" />
                        </div>
                      ) : null}
                      <Button type="button" className="h-10 w-full" onClick={saveProduct} disabled={busyAction === "save-product"}>
                        {busyAction === "save-product" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {productForm.id ? "Update Product" : "Publish Product"}
                      </Button>
                    </div>
                  </div>
                </Panel>
                <Panel title="Your Products">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {products.map((product) => (
                      <article key={product.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                        <div className="aspect-[4/3] overflow-hidden rounded-lg bg-slate-200">
                          {product.image ? <img src={product.image} alt={product.name} className="h-full w-full object-cover" /> : null}
                        </div>
                        <h3 className="mt-3 line-clamp-2 text-sm font-semibold">{product.name}</h3>
                        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                          <span>{formatCurrency(product.price ?? 0)}</span>
                          <span>{product.stock} stock</span>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Button type="button" variant="outline" className="h-8 flex-1 text-xs" onClick={() => setProductForm(productToForm(product))}>
                            <Edit className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button type="button" variant="outline" className="h-8 flex-1 text-xs text-rose-600" onClick={() => deleteVendorProduct(product.id)} disabled={busyAction === `delete-product-${product.id}`}>
                            {busyAction === `delete-product-${product.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            Delete
                          </Button>
                        </div>
                      </article>
                    ))}
                    {!products.length ? <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700">No products yet. Add your first product above.</div> : null}
                  </div>
                </Panel>
              </div>
            ) : null}

            {activeSection === "orders" ? (
              <Panel title="Order Management">
                <div className="mb-5 grid gap-3 md:grid-cols-3">
                  {orderRows.map((row) => (
                    <div key={row.label} className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                      <p className="text-sm text-slate-500">{row.label} Orders</p>
                      <p className="mt-2 text-2xl font-semibold">{row.value}</p>
                    </div>
                  ))}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-[0.12em] text-slate-500">
                      <tr>
                        <th className="py-2">Order</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th>Status</th>
                        <th>Courier</th>
                        <th>Tracking</th>
                        <th>ETA</th>
                        <th className="text-right">Total</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {orders.map((order) => {
                        const draft = draftForOrder(order);
                        return (
                          <tr key={order.id}>
                            <td className="py-3 font-semibold">#{order.id}</td>
                            <td>
                              <div className="font-medium">{order.address?.fullName ?? "Customer"}</div>
                              <div className="text-xs text-slate-500">{[order.address?.city, order.address?.state].filter(Boolean).join(", ")}</div>
                            </td>
                            <td className="max-w-52">
                              <div className="truncate">{order.items?.map((item) => `${item.name} x${item.quantity}`).join(", ") ?? "Order items"}</div>
                              <div className="text-xs text-slate-500">{formatDate(order.createdAt)}</div>
                            </td>
                            <td>
                              <select className="h-9 rounded-lg border border-slate-200 px-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={draft.status} onChange={(event) => updateOrderDraft(order, { status: event.target.value })}>
                                <option value="confirmed">Confirmed</option>
                                <option value="packed">Packed</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="returned">Returned</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                            <td>
                              <input className="h-9 w-32 rounded-lg border border-slate-200 px-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={draft.courier} onChange={(event) => updateOrderDraft(order, { courier: event.target.value })} placeholder="Courier" />
                            </td>
                            <td>
                              <input className="h-9 w-36 rounded-lg border border-slate-200 px-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={draft.trackingId} onChange={(event) => updateOrderDraft(order, { trackingId: event.target.value })} placeholder="Tracking ID" />
                            </td>
                            <td>
                              <input className="h-9 w-32 rounded-lg border border-slate-200 px-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={draft.eta} onChange={(event) => updateOrderDraft(order, { eta: event.target.value })} placeholder="ETA" />
                            </td>
                            <td className="text-right font-semibold">{formatCurrency(order.totalAmount)}</td>
                            <td className="text-right">
                              <Button type="button" className="h-9" onClick={() => saveOrderTracking(order)} disabled={busyAction === `order-${order.id}`}>
                                {busyAction === `order-${order.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                                Save
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                      {!orders.length ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-500">No orders found for your products yet.</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
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
                <div className="space-y-4">
                  <div className="rounded-lg border border-dashed border-slate-300 p-4 dark:border-slate-700">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold">Upload product images, banners, PDFs, or videos</p>
                        <p className="text-sm text-slate-500">Uploaded files are saved to your vendor media library and can be used in products.</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*,video/*,application/pdf"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) uploadProductImage(file, false);
                        }}
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {mediaFiles.map((file) => {
                      const url = file.imageUrl ?? file.path;
                      const isImage = (file.contentType ?? "").startsWith("image/");
                      return (
                        <article key={file.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                          <div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-lg bg-slate-200 text-slate-500">
                            {isImage && url ? <img src={url} alt="" className="h-full w-full object-cover" /> : <FileText className="h-8 w-8" />}
                          </div>
                          <p className="mt-3 truncate text-sm font-semibold">{file.folder ?? "media"}</p>
                          <p className="text-xs text-slate-500">{file.createdAt ? formatDate(file.createdAt) : "Uploaded media"}</p>
                          <Button
                            type="button"
                            variant="outline"
                            className="mt-3 h-8 w-full text-xs"
                            onClick={() => {
                              if (url) {
                                navigator.clipboard.writeText(url);
                                showNotice("Media URL copied");
                              }
                            }}
                          >
                            <Download className="h-3.5 w-3.5" />
                            Copy URL
                          </Button>
                        </article>
                      );
                    })}
                    {!mediaFiles.length ? <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700">No media uploaded yet.</div> : null}
                  </div>
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
