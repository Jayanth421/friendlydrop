import { nanoid } from "nanoid";
import { createSlug } from "@/lib/utils";
import { getAdminDb, isFirebaseReady } from "@/lib/firebase/admin";
import { getAllOrders, getAllUsers, getMarketingCampaigns, getProducts, getSupportTickets, getTransactions } from "@/lib/firebase/firestore";
import { isAdminRole } from "@/lib/rbac";
import { BannerItem, CatalogCategory, UserProfile, VendorPayout, VendorProfile } from "@/types";

function isFirestoreReady() {
  return isFirebaseReady();
}

function mapDoc<T>(doc: FirebaseFirestore.DocumentSnapshot): T {
  return {
    id: doc.id,
    ...(doc.data() as Record<string, unknown>),
  } as T;
}

const FALLBACK_VENDORS: VendorProfile[] = [
  {
    id: "vendor-1",
    businessName: "PrintLab Pro",
    ownerName: "Arjun Rao",
    email: "vendor1@friendlydrop.in",
    phone: "+91 90000 11111",
    status: "approved",
    commissionPercent: 12,
    rating: 4.7,
    totalSales: 245000,
    orderCount: 128,
    kycVerified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "vendor-2",
    businessName: "GiftNova",
    ownerName: "Priya Nair",
    email: "vendor2@friendlydrop.in",
    phone: "+91 90000 22222",
    status: "pending",
    commissionPercent: 14,
    rating: 4.2,
    totalSales: 56000,
    orderCount: 34,
    kycVerified: false,
    createdAt: new Date().toISOString(),
  },
];

const FALLBACK_PAYOUTS: VendorPayout[] = [
  {
    id: "payout-1",
    vendorId: "vendor-1",
    amount: 42500,
    status: "pending",
    periodLabel: "Apr 2026 - Week 1",
    createdAt: new Date().toISOString(),
  },
];

const FALLBACK_BANNERS: BannerItem[] = [
  {
    id: "banner-hero-1",
    title: "Summer Photo Fest",
    type: "hero",
    imageDesktop: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
    imageMobile: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
    linkType: "category",
    linkTarget: "/products?category=photo-prints",
    position: 1,
    active: true,
    createdAt: new Date().toISOString(),
  },
];

const FALLBACK_CATEGORIES: CatalogCategory[] = [
  {
    id: "cat-photo-prints",
    name: "Photo Prints",
    slug: "photo-prints",
    level: 0,
    description: "Premium photo print products",
    tags: ["photo", "print"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "cat-stickers",
    name: "Stickers",
    slug: "stickers",
    level: 0,
    description: "Custom stickers and labels",
    tags: ["sticker", "custom"],
    createdAt: new Date().toISOString(),
  },
];

export async function getVendors(): Promise<VendorProfile[]> {
  if (!isFirestoreReady()) {
    return FALLBACK_VENDORS;
  }

  const snapshot = await getAdminDb().collection("vendors").orderBy("createdAt", "desc").limit(500).get();
  return snapshot.empty ? FALLBACK_VENDORS : snapshot.docs.map((doc) => mapDoc<VendorProfile>(doc));
}

export async function createVendor(input: Omit<VendorProfile, "id" | "createdAt" | "updatedAt">) {
  if (!isFirestoreReady()) {
    return {
      ...input,
      id: nanoid(12),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const id = nanoid(12);
  const payload: VendorProfile = {
    ...input,
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await getAdminDb().collection("vendors").doc(id).set(payload);
  return payload;
}

export async function updateVendorStatus(vendorId: string, status: VendorProfile["status"], note?: string) {
  if (!isFirestoreReady()) {
    return;
  }

  await getAdminDb()
    .collection("vendors")
    .doc(vendorId)
    .set(
      {
        status,
        approvalNote: note,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
}

export async function getVendorPayouts(): Promise<VendorPayout[]> {
  if (!isFirestoreReady()) {
    return FALLBACK_PAYOUTS;
  }

  const snapshot = await getAdminDb().collection("vendorPayouts").orderBy("createdAt", "desc").limit(500).get();
  return snapshot.empty ? FALLBACK_PAYOUTS : snapshot.docs.map((doc) => mapDoc<VendorPayout>(doc));
}

export async function getBanners(): Promise<BannerItem[]> {
  if (!isFirestoreReady()) {
    return FALLBACK_BANNERS;
  }

  const snapshot = await getAdminDb().collection("banners").orderBy("position", "asc").limit(200).get();
  return snapshot.empty ? FALLBACK_BANNERS : snapshot.docs.map((doc) => mapDoc<BannerItem>(doc));
}

export async function createBanner(input: Omit<BannerItem, "id" | "createdAt" | "updatedAt">) {
  if (!isFirestoreReady()) {
    return {
      ...input,
      id: nanoid(12),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const id = nanoid(12);
  const payload: BannerItem = {
    ...input,
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await getAdminDb().collection("banners").doc(id).set(payload);
  return payload;
}

export async function updateBanner(bannerId: string, updates: Partial<BannerItem>) {
  if (!isFirestoreReady()) {
    return;
  }

  await getAdminDb()
    .collection("banners")
    .doc(bannerId)
    .set(
      {
        ...updates,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
}

export async function deleteBanner(bannerId: string) {
  if (!isFirestoreReady()) {
    return;
  }

  await getAdminDb().collection("banners").doc(bannerId).delete();
}

export async function getCatalogCategories(): Promise<CatalogCategory[]> {
  if (!isFirestoreReady()) {
    return FALLBACK_CATEGORIES;
  }

  const snapshot = await getAdminDb().collection("categories").orderBy("level", "asc").limit(500).get();
  return snapshot.empty ? FALLBACK_CATEGORIES : snapshot.docs.map((doc) => mapDoc<CatalogCategory>(doc));
}

export async function createCatalogCategory(input: Omit<CatalogCategory, "id" | "createdAt" | "updatedAt" | "slug"> & { slug?: string }) {
  const slug = createSlug(input.slug?.trim() || input.name);

  if (!isFirestoreReady()) {
    return {
      ...input,
      slug,
      id: nanoid(12),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const id = nanoid(12);
  const payload: CatalogCategory = {
    ...input,
    slug,
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await getAdminDb().collection("categories").doc(id).set(payload);
  return payload;
}

export async function updateCatalogCategory(categoryId: string, updates: Partial<CatalogCategory>) {
  if (!isFirestoreReady()) {
    return;
  }

  await getAdminDb()
    .collection("categories")
    .doc(categoryId)
    .set(
      {
        ...updates,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
}

export async function deleteCatalogCategory(categoryId: string) {
  if (!isFirestoreReady()) {
    return;
  }

  await getAdminDb().collection("categories").doc(categoryId).delete();
}

export async function getCustomerCrmSnapshot() {
  const [users, orders, transactions, supportTickets] = await Promise.all([
    getAllUsers(),
    getAllOrders(),
    getTransactions(),
    getSupportTickets(),
  ]);

  const byUser = new Map<string, { orderCount: number; spend: number; payments: number }>();
  for (const order of orders) {
    const current = byUser.get(order.userId) ?? { orderCount: 0, spend: 0, payments: 0 };
    current.orderCount += 1;
    current.spend += order.totalAmount;
    byUser.set(order.userId, current);
  }

  for (const txn of transactions) {
    const current = byUser.get(txn.userId) ?? { orderCount: 0, spend: 0, payments: 0 };
    current.payments += 1;
    byUser.set(txn.userId, current);
  }

  const enrichedUsers = users.map((user) => {
    const metrics = byUser.get(user.id) ?? { orderCount: 0, spend: 0, payments: 0 };
    return {
      ...user,
      orderCount: user.orderCount ?? metrics.orderCount,
      totalSpend: user.totalSpend ?? metrics.spend,
      paymentCount: metrics.payments,
      loyaltyPoints: user.loyaltyPoints ?? Math.floor((metrics.spend ?? 0) / 100),
      walletBalance: user.walletBalance ?? 0,
      referralCount: user.referralCount ?? 0,
    };
  });

  return {
    customers: enrichedUsers,
    openTickets: supportTickets.filter((ticket) => ticket.status !== "resolved").length,
  };
}

export async function getVendorDashboardSnapshot(user: UserProfile) {
  const [products, orders, payouts, users, supportTickets] = await Promise.all([
    getProducts(),
    getAllOrders(),
    getVendorPayouts(),
    getAllUsers(),
    getSupportTickets(),
  ]);
  const vendorId = user.id;
  const canViewMarketplaceVendorOverview = isAdminRole(user.role);
  const vendorProducts = canViewMarketplaceVendorOverview
    ? products.filter((product) => product.vendorId || product.status !== "archived")
    : products.filter((product) => product.vendorId === vendorId);
  const productIds = new Set(vendorProducts.map((product) => product.id));
  const vendorOrders = canViewMarketplaceVendorOverview
    ? orders
    : orders.filter((order) => order.items.some((item) => productIds.has(item.productId)));
  const customerIds = new Set(vendorOrders.map((order) => order.userId));
  const vendorCustomers = users.filter((customer) => customerIds.has(customer.id));
  const vendorPayouts = payouts.filter((payout) => payout.vendorId === vendorId);
  const revenue = vendorOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const todayKey = new Date().toISOString().slice(0, 10);
  const monthKey = new Date().toISOString().slice(0, 7);
  const todayRevenue = vendorOrders
    .filter((order) => order.createdAt.slice(0, 10) === todayKey)
    .reduce((sum, order) => sum + order.totalAmount, 0);
  const monthlyRevenue = vendorOrders
    .filter((order) => order.createdAt.slice(0, 7) === monthKey)
    .reduce((sum, order) => sum + order.totalAmount, 0);
  const totalEarnings = revenue * 0.88;
  const pendingPayoutAmount = vendorPayouts
    .filter((payout) => payout.status === "pending")
    .reduce((sum, payout) => sum + payout.amount, 0);
  const completedPayoutAmount = vendorPayouts
    .filter((payout) => payout.status === "completed")
    .reduce((sum, payout) => sum + payout.amount, 0);
  const orderStatusCounts = vendorOrders.reduce<Record<string, number>>((acc, order) => {
    acc[order.status] = (acc[order.status] ?? 0) + 1;
    return acc;
  }, {});
  const revenueByDay = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    const dayOrders = vendorOrders.filter((order) => order.createdAt.slice(0, 10) === key);
    return {
      label: date.toLocaleDateString("en-IN", { weekday: "short" }),
      revenue: dayOrders.reduce((sum, order) => sum + order.totalAmount, 0),
      orders: dayOrders.length,
    };
  });
  const productPerformance = vendorProducts
    .map((product) => {
      const matchingOrders = vendorOrders.filter((order) => order.items.some((item) => item.productId === product.id));
      return {
        id: product.id,
        name: product.name,
        image: product.primaryImage ?? product.images[0],
        stock: product.stock,
        status: product.status ?? "published",
        revenue: matchingOrders.reduce((sum, order) => {
          const productTotal = order.items
            .filter((item) => item.productId === product.id)
            .reduce((itemSum, item) => itemSum + item.price * item.quantity, 0);
          return sum + productTotal;
        }, 0),
        orders: matchingOrders.length,
        rating: product.rating ?? 0,
        reviewCount: product.reviewCount ?? 0,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
  const openSupportTickets = supportTickets.filter((ticket) => ticket.status !== "resolved" && customerIds.has(ticket.userId)).length;
  const reviewCount = vendorProducts.reduce((sum, product) => sum + (product.reviewCount ?? 0), 0);
  const averageRating =
    vendorProducts.reduce((sum, product) => sum + (product.rating ?? 0), 0) / (vendorProducts.filter((product) => product.rating).length || 1);

  return {
    vendorId,
    vendorName: canViewMarketplaceVendorOverview ? "Marketplace Vendor Overview" : user.name,
    vendorEmail: user.email,
    isAdminPreview: canViewMarketplaceVendorOverview,
    productCount: vendorProducts.length,
    activeProductCount: vendorProducts.filter((product) => (product.status ?? "published") === "published").length,
    outOfStockProductCount: vendorProducts.filter((product) => product.stock <= 0).length,
    orderCount: vendorOrders.length,
    revenue,
    monthlyRevenue,
    todayRevenue,
    totalEarnings,
    availableBalance: Math.max(totalEarnings - pendingPayoutAmount - completedPayoutAmount, 0),
    pendingPayoutAmount,
    completedPayoutAmount,
    pendingOrders: orderStatusCounts.pending ?? 0,
    processingOrders: (orderStatusCounts.confirmed ?? 0) + (orderStatusCounts.packed ?? 0),
    shippedOrders: orderStatusCounts.shipped ?? 0,
    deliveredOrders: orderStatusCounts.delivered ?? 0,
    cancelledOrders: orderStatusCounts.cancelled ?? 0,
    returnRequests: orderStatusCounts.returned ?? 0,
    customerCount: vendorCustomers.length,
    openSupportTickets,
    reviewCount,
    averageRating: Number(averageRating.toFixed(1)),
    lowStockProducts: vendorProducts.filter((product) => product.stock <= (product.lowStockThreshold ?? 5)).length,
    recentOrders: vendorOrders.slice(0, 8),
    products: vendorProducts.slice(0, 8),
    customers: vendorCustomers.slice(0, 8),
    payouts: vendorPayouts.slice(0, 8),
    orderStatusCounts,
    revenueByDay,
    productPerformance: productPerformance.slice(0, 8),
  };
}

export async function getMarketingInsights() {
  const [campaigns, orders, banners] = await Promise.all([getMarketingCampaigns(), getAllOrders(), getBanners()]);
  const activeCampaigns = campaigns.filter((campaign) => campaign.status === "running" || campaign.status === "scheduled");

  return {
    activeCampaigns,
    campaignCount: campaigns.length,
    campaignDrivenRevenue: orders
      .filter((order) => Boolean(order.couponCode))
      .reduce((sum, order) => sum + order.totalAmount, 0),
    activeBanners: banners.filter((banner) => banner.active),
  };
}

