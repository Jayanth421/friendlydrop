import { nanoid } from "nanoid";
import { createSlug } from "@/lib/utils";
import { getAdminDb } from "@/lib/firebase/admin";
import { getAllOrders, getAllUsers, getMarketingCampaigns, getProducts, getSupportTickets, getTransactions } from "@/lib/firebase/firestore";
import { BannerItem, CatalogCategory, UserProfile, VendorPayout, VendorProfile } from "@/types";

function isFirestoreReady() {
  return Boolean(process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
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
  const [products, orders, payouts] = await Promise.all([getProducts(), getAllOrders(), getVendorPayouts()]);
  const vendorId = user.id;
  const vendorProducts = products.filter((product) => product.vendorId === vendorId);
  const productIds = new Set(vendorProducts.map((product) => product.id));
  const vendorOrders = orders.filter((order) => order.items.some((item) => productIds.has(item.productId)));

  return {
    vendorId,
    productCount: vendorProducts.length,
    orderCount: vendorOrders.length,
    revenue: vendorOrders.reduce((sum, order) => sum + order.totalAmount, 0),
    recentOrders: vendorOrders.slice(0, 8),
    payouts: payouts.filter((payout) => payout.vendorId === vendorId).slice(0, 8),
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
