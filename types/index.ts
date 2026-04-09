export type UserRole = "user" | "vendor" | "staff" | "manager" | "admin" | "super_admin";

export type AdminPermission =
  | "dashboard:view"
  | "analytics:view"
  | "products:manage"
  | "catalog:manage"
  | "vendors:manage"
  | "banners:manage"
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

export type PaymentProvider = "razorpay" | "stripe" | "upi_offline";

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
  | "vendor_notified"
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
  phone?: string;
  addresses?: Address[];
  role: UserRole;
  status?: UserStatus;
  segment?: CustomerSegment;
  loyaltyPoints?: number;
  walletBalance?: number;
  referralCount?: number;
  totalSpend?: number;
  orderCount?: number;
  notes?: string[];
  lastCartActivityAt?: string;
  purchasePatterns?: string[];
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
  imageAlt?: string;
  canonicalUrl?: string;
  keywords?: string[];
  noindex?: boolean;
  nofollow?: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPercent?: number;
  images: string[];
  category: ProductCategory;
  subcategory?: string;
  stock: number;
  sku?: string;
  brand?: string;
  attributes?: Record<string, string>;
  variants?: ProductVariant[];
  featured?: boolean;
  recommended?: boolean;
  popularity?: number;
  tags?: string[];
  rating?: number;
  reviewCount?: number;
  weightGrams?: number;
  status?: ProductStatus;
  visibility?: ProductVisibility;
  seo?: SeoMeta;
  vendorId?: string;
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
  status: "success" | "failed" | "pending" | "rejected";
  proofImageUrl?: string;
  proofStatus?: "pending" | "approved" | "rejected";
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
  upiVpa?: string;
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
  module: "orders" | "payments" | "delivery" | "inventory" | "customers" | "vendors" | "marketing" | "catalog" | "automation" | "system";
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

export interface VendorProfile {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  commissionPercent: number;
  rating?: number;
  totalSales?: number;
  orderCount?: number;
  kycVerified?: boolean;
  documents?: Array<{ name: string; url: string; type: "gst" | "pan" | "aadhaar" | "other" }>;
  createdAt: string;
  updatedAt?: string;
}

export interface VendorPayout {
  id: string;
  vendorId: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  periodLabel: string;
  createdAt: string;
  processedAt?: string;
}

export interface BannerItem {
  id: string;
  title: string;
  type: "hero" | "offer" | "category";
  imageDesktop: string;
  imageMobile?: string;
  linkType: "product" | "category" | "external";
  linkTarget: string;
  position: number;
  active: boolean;
  startAt?: string;
  endAt?: string;
  linkedCampaignId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string | null;
  level: number;
  tags?: string[];
  seo?: SeoMeta;
  createdAt: string;
  updatedAt?: string;
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
  proofTransactionId?: string;
  proofImageUrl?: string;
  proofStatus?: "pending" | "approved" | "rejected";
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
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

export type DeliverySpeed = "standard" | "express" | "same_day";
export type DeliveryZoneType = "local" | "regional" | "national";
export type IntegrationProviderType = "payment" | "shipping" | "notification" | "analytics" | "other";
export type IntegrationHealthStatus = "active" | "failed" | "disabled" | "unknown";

export interface DeliveryPricingRule {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  speed?: DeliverySpeed;
  minDistanceKm?: number;
  maxDistanceKm?: number;
  minOrderValue?: number;
  maxOrderValue?: number;
  minWeightKg?: number;
  maxWeightKg?: number;
  zoneIds?: string[];
  flatFee: number;
  perKmFee: number;
}

export interface FreeDeliveryRule {
  id: string;
  name: string;
  enabled: boolean;
  minOrderValue?: number;
  productIds?: string[];
  categoryIds?: string[];
  firstOrderOnly?: boolean;
  customerSegments?: CustomerSegment[];
  startsAt?: string;
  endsAt?: string;
  campaignIds?: string[];
}

export interface DeliveryZone {
  id: string;
  name: string;
  type: DeliveryZoneType;
  enabled: boolean;
  cities?: string[];
  pincodePrefixes?: string[];
  baseFee: number;
  expressSurcharge: number;
}

export interface DeliveryControlConfig {
  enabled: boolean;
  expressEnabled: boolean;
  sameDayEnabled: boolean;
  maxRadiusKm: number;
  slaStandardHours: number;
  slaExpressHours: number;
  blockedPincodes: string[];
  baseFee: number;
  expressSurcharge: number;
  sameDaySurcharge: number;
  pricingRules: DeliveryPricingRule[];
  freeDeliveryRules: FreeDeliveryRule[];
  zones: DeliveryZone[];
}

export interface PaymentMethodControl {
  upi: boolean;
  cards: boolean;
  netBanking: boolean;
  cod: boolean;
  wallet: boolean;
  razorpay: boolean;
  stripe: boolean;
  paypal: boolean;
}

export interface PaymentRuleConfig {
  minOrderValue: number;
  maxOrderValue: number;
  codMaxOrderValue: number;
  codBlockedPincodes: string[];
  retryEnabled: boolean;
  maxRetries: number;
  smartFallbackEnabled: boolean;
  autoRefundOnReturnApproval: boolean;
  partialRefundsEnabled: boolean;
}

export interface PaymentControlConfig {
  systemEnabled: boolean;
  methods: PaymentMethodControl;
  rules: PaymentRuleConfig;
}

export interface ApiIntegrationProvider {
  id: string;
  name: string;
  type: IntegrationProviderType;
  enabled: boolean;
  mode: "test" | "live";
  keyRef: string;
  secretRef?: string;
  healthStatus: IntegrationHealthStatus;
  lastCheckedAt?: string;
  lastError?: string;
  endpoint?: string;
}

export interface WebhookSubscription {
  id: string;
  event: "payment_success" | "order_updated" | "delivery_updated";
  url: string;
  enabled: boolean;
  retryFailed: boolean;
  maxRetries: number;
  lastStatus: "idle" | "success" | "failed";
  lastTriggeredAt?: string;
}

export interface IntegrationControlConfig {
  defaultMode: "test" | "live";
  providers: ApiIntegrationProvider[];
  webhooks: WebhookSubscription[];
}

export interface OperationsControlConfig {
  maintenanceMode: boolean;
  checkoutEnabled: boolean;
  taxEnabled: boolean;
  autoOrderConfirm: boolean;
  autoDeliveryAssignment: boolean;
}

export interface AlertControlConfig {
  paymentFailureRateThreshold: number;
  deliveryDelayThreshold: number;
  apiLatencyThresholdMs: number;
  refundRateThreshold: number;
}

export interface PluginApp {
  id: string;
  name: string;
  slug: string;
  provider: string;
  version: string;
  category: "marketing" | "shipping" | "payments" | "analytics" | "operations" | "other";
  status: "installed" | "disabled" | "uninstalled";
  apiEndpoint?: string;
  webhookEndpoint?: string;
  installedAt: string;
  updatedAt: string;
}

export interface MobileAppControl {
  id: "default";
  appEnabled: boolean;
  pushNotificationsEnabled: boolean;
  forceUpdateAndroidVersion?: string;
  forceUpdateIosVersion?: string;
  showWishlist: boolean;
  showWallet: boolean;
  showReferrals: boolean;
  homeLayoutPreset: "classic" | "sale-first" | "minimal";
  updatedAt: string;
}

export interface AutomationCenterRule {
  id: string;
  name: string;
  enabled: boolean;
  condition: string;
  action: string;
  priority: number;
}

export interface AutomationCenterConfig {
  id: "default";
  aiDemandForecastingEnabled: boolean;
  aiFraudDetectionEnabled: boolean;
  aiSmartPricingEnabled: boolean;
  aiRecommendationsEnabled: boolean;
  automationRules: AutomationCenterRule[];
  sandboxMode: boolean;
  abTestingEnabled: boolean;
  updatedAt: string;
}

export interface CmsPageConfig {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  seo?: SeoMeta;
  updatedAt: string;
}

export interface IntegrationLogEntry {
  id: string;
  provider: string;
  type: "request" | "response" | "error";
  status: "success" | "failed";
  latencyMs: number;
  message: string;
  createdAt: string;
}

export interface WebhookLogEntry {
  id: string;
  event: "payment_success" | "order_updated" | "delivery_updated";
  targetUrl: string;
  status: "success" | "failed";
  attempts: number;
  responseCode?: number;
  createdAt: string;
}

export interface BulkImportValidationError {
  row: number;
  field: string;
  code: "missing" | "duplicate_sku" | "invalid_category" | "invalid_value";
  message: string;
}

export interface MetaAdsConfig {
  id: "default";
  connected: boolean;
  adAccountId?: string;
  businessId?: string;
  catalogId?: string;
  pixelId?: string;
  accessTokenRef?: string;
  syncEnabled: boolean;
  testMode: boolean;
  lastSyncAt?: string;
  updatedAt: string;
}

export interface MetaAdsCampaign {
  id: string;
  name: string;
  type: "conversion" | "retargeting" | "catalog";
  status: "draft" | "active" | "paused" | "completed";
  productIds: string[];
  dailyBudget: number;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  createdAt: string;
  updatedAt: string;
}

export interface SeoPlatformConfig {
  id: "default";
  sitemapEnabled: boolean;
  robotsPolicy: "index_follow" | "index_nofollow" | "noindex_follow" | "noindex_nofollow";
  pageSpeedMode: "balanced" | "performance" | "quality";
  schemaProductEnabled: boolean;
  schemaOrganizationEnabled: boolean;
  noindexCategorySlugs: string[];
  updatedAt: string;
}

export interface SeoTrafficInsight {
  keyword: string;
  clicks: number;
  impressions: number;
  avgPosition: number;
  source: "google" | "bing" | "social" | "direct";
}

export interface SocialShareConfig {
  id: "default";
  whatsappEnabled: boolean;
  instagramEnabled: boolean;
  facebookEnabled: boolean;
  twitterEnabled: boolean;
  referralRewardsEnabled: boolean;
  rewardPointsPerReferral: number;
  updatedAt: string;
}

export interface SocialShareLink {
  id: string;
  productId?: string;
  platform: "whatsapp" | "instagram" | "facebook" | "twitter";
  refCode: string;
  url: string;
  clicks: number;
  conversions: number;
  revenue: number;
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
  delivery: DeliveryControlConfig;
  payments: PaymentControlConfig;
  integrations: IntegrationControlConfig;
  operations: OperationsControlConfig;
  alerts: AlertControlConfig;
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
