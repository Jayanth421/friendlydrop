export type UserRole = "user" | "staff" | "admin" | "super_admin";

export type AdminPermission =
  | "dashboard:view"
  | "products:manage"
  | "orders:manage"
  | "users:manage"
  | "reviews:manage"
  | "coupons:manage"
  | "inventory:manage"
  | "payments:view"
  | "reports:export"
  | "settings:manage"
  | "team:manage"
  | "support:manage"
  | "returns:manage"
  | "marketing:manage"
  | "logs:view";

export type UserStatus = "active" | "suspended" | "blocked";

export type CustomerSegment = "new" | "repeat" | "vip";

export type ProductCategory = "photo-prints" | "stickers" | "personalized-gifts";

export type ProductStatus = "draft" | "published" | "archived";

export type ProductVisibility = "public" | "private";

export type OrderStatus = "pending" | "confirmed" | "packed" | "shipped" | "delivered" | "returned" | "cancelled" | "refunded";

export type DesignApprovalStatus = "pending" | "approved" | "rejected" | "flagged";

export type PaymentProvider = "razorpay" | "stripe";

export type PaymentStatus = "initiated" | "success" | "failed" | "refunded";

export type CouponType = "percent" | "flat";
export type OrderPriority = "express" | "normal";
export type EventSeverity = "info" | "warning" | "critical";
export type SystemEventType =
  | "checkout_initiated"
  | "payment_succeeded"
  | "payment_failed"
  | "order_confirmed"
  | "order_status_updated"
  | "inventory_reserved"
  | "low_stock_alert"
  | "delivery_assigned"
  | "delivery_delay"
  | "delivery_failed"
  | "refund_initiated"
  | "refund_completed"
  | "automation_rule_executed";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status?: UserStatus;
  segment?: CustomerSegment;
  totalSpend?: number;
  orderCount?: number;
  notes?: string[];
  lastLoginAt?: string;
  twoFactorEnabled?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ProductVariant {
  id: string;
  size?: string;
  type?: string;
  material?: string;
  sku: string;
  price: number;
  stock: number;
}

export interface SeoMeta {
  metaTitle?: string;
  metaDescription?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  images: string[];
  category: ProductCategory;
  subcategory?: string;
  stock: number;
  sku?: string;
  variants?: ProductVariant[];
  featured?: boolean;
  popularity?: number;
  tags?: string[];
  rating?: number;
  reviewCount?: number;
  status?: ProductStatus;
  visibility?: ProductVisibility;
  seo?: SeoMeta;
  createdAt: string;
  updatedAt?: string;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variantId?: string;
  customImageUrl?: string;
}

export interface Address {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface PaymentRecord {
  provider: PaymentProvider;
  paymentId: string;
  orderId: string;
  transactionId?: string;
  signature?: string;
  status: "success" | "failed";
}

export interface OrderTimelineEntry {
  status: OrderStatus;
  note?: string;
  at: string;
  by?: string;
}

export interface ShippingDetails {
  courier?: string;
  trackingId?: string;
  eta?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  priority?: OrderPriority;
  totalAmount: number;
  subtotalAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  deliveryFee?: number;
  paymentId: string;
  status: OrderStatus;
  timeline?: OrderTimelineEntry[];
  address: Address;
  shipping?: ShippingDetails;
  couponCode?: string;
  discountAmount?: number;
  payment: PaymentRecord;
  createdAt: string;
  updatedAt: string;
}

export interface SystemEvent {
  id: string;
  type: SystemEventType;
  severity: EventSeverity;
  source: string;
  module: "orders" | "payments" | "delivery" | "inventory" | "customers" | "automation" | "system";
  orderId?: string;
  userId?: string;
  actorId?: string;
  payload?: Record<string, unknown>;
  createdAt: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  triggerEvent: SystemEventType;
  actions: string[];
}

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  active: boolean;
  usageLimit?: number;
  usedCount?: number;
  firstOrderOnly?: boolean;
  autoApply?: boolean;
  expiresAt?: string;
  createdAt?: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  status?: "pending" | "approved" | "rejected";
  featured?: boolean;
  createdAt: string;
}

export interface UploadRecord {
  id: string;
  userId: string;
  orderId?: string;
  imageUrl: string;
  status?: DesignApprovalStatus;
  flaggedReason?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  orderId: string;
  userId: string;
  provider: PaymentProvider;
  providerPaymentId: string;
  amount: number;
  status: PaymentStatus;
  failureReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ActivityLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  targetType: string;
  targetId: string;
  details?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorRole: UserRole;
  module: string;
  action: "create" | "update" | "delete";
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  createdAt: string;
}

export interface InventoryAlert {
  id: string;
  productId: string;
  productName: string;
  sku?: string;
  stock: number;
  threshold: number;
  severity: "medium" | "high";
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  category: "refund" | "delay" | "damage" | "other";
  status: "open" | "in_progress" | "resolved";
  assignedTo?: string;
  messages: Array<{ by: string; message: string; at: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  userId: string;
  reason: string;
  status: "requested" | "approved" | "rejected" | "refunded";
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MarketingCampaign {
  id: string;
  title: string;
  channel: "email" | "push" | "banner";
  status: "draft" | "scheduled" | "running" | "completed";
  audience: "all" | "new" | "repeat" | "vip";
  createdAt: string;
}

export interface FinanceExpense {
  id: string;
  category: "shipping" | "marketing" | "operations" | "other";
  amount: number;
  note?: string;
  createdAt: string;
}

export interface StoreSettings {
  id: "default";
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  taxRate: number;
  deliveryFee: number;
  currency: string;
  themeColor: string;
  updatedAt: string;
}

export interface AdminSession {
  id: string;
  userId: string;
  email: string;
  device: string;
  ip: string;
  lastActiveAt: string;
  createdAt: string;
}

export interface DashboardTrendPoint {
  label: string;
  revenue: number;
  orders: number;
  users: number;
}

export interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  conversionRate: number;
  returningCustomers: number;
  newCustomers: number;
  revenueByCategory: Array<{ category: string; value: number }>;
  bestSellingProducts: Array<{ productId: string; name: string; unitsSold: number; revenue: number }>;
  lowStockProducts: Array<{ productId: string; name: string; stock: number }>;
  topCustomers: Array<{ userId: string; name: string; spend: number; orders: number }>;
  recentOrders: Order[];
  trendsDaily: DashboardTrendPoint[];
  trendsWeekly: DashboardTrendPoint[];
  trendsMonthly: DashboardTrendPoint[];
}
