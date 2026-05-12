import { z } from "zod";

export const addressSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(10).max(14),
  line1: z.string().min(4),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(4),
  country: z.string().min(2),
});

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  quantity: z.number().int().min(1).max(20),
  image: z.string().url(),
  variantId: z.string().optional(),
  customImageUrl: z.string().url().optional(),
});

export const createOrderSchema = z.object({
  items: z.array(cartItemSchema).min(1),
  address: addressSchema,
  couponCode: z.string().trim().optional(),
  paymentMethod: z.enum(["razorpay", "stripe", "upi-offline"]),
  priority: z.enum(["express", "normal"]).optional().default("normal"),
});

export const verifyRazorpaySchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
  orderDraft: createOrderSchema,
});

export const productVariantSchema = z.object({
  id: z.string().min(1),
  size: z.string().optional(),
  type: z.string().optional(),
  material: z.string().optional(),
  sku: z.string().min(2),
  price: z.number().min(1),
  stock: z.number().int().min(0),
});

export const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  price: z.number().min(1),
  discountPercent: z.number().min(0).max(90).optional(),
  images: z.array(z.string().url()).min(1),
  category: z.enum(["photo-prints", "stickers", "personalized-gifts"]),
  subcategory: z.string().optional(),
  stock: z.number().int().min(0),
  sku: z.string().optional(),
  brand: z.string().optional(),
  weightGrams: z.number().min(0).optional(),
  attributes: z.record(z.string()).optional(),
  variants: z.array(productVariantSchema).optional(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  recommended: z.boolean().optional(),
  popularity: z.number().int().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  visibility: z.enum(["public", "private"]).optional(),
  seo: z
    .object({
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      imageAlt: z.string().optional(),
      canonicalUrl: z.string().url().optional(),
      keywords: z.array(z.string()).optional(),
      noindex: z.boolean().optional(),
      nofollow: z.boolean().optional(),
    })
    .optional(),
  vendorId: z.string().optional(),
});

export const upiOfflinePaymentSchema = z.object({
  orderDraft: createOrderSchema,
  upiVpa: z.string().trim().min(3),
  proofImageUrl: z.string().url(),
  transactionId: z.string().trim().min(3).max(64).optional(),
});

export const upiProofReviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  note: z.string().trim().max(240).optional(),
});

export const couponValidationSchema = z.object({
  code: z.string().trim().toUpperCase().min(3),
});

export const couponSchema = z.object({
  code: z.string().trim().toUpperCase().min(3),
  type: z.enum(["percent", "flat"]),
  value: z.number().positive(),
  active: z.boolean(),
  usageLimit: z.number().int().positive().optional(),
  firstOrderOnly: z.boolean().optional(),
  autoApply: z.boolean().optional(),
  expiresAt: z.string().datetime().optional(),
});

export const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(8).max(500),
});

export const reviewModerationSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  featured: z.boolean().optional(),
});

export const uploadModerationSchema = z.object({
  status: z.enum(["approved", "rejected", "flagged"]),
  flaggedReason: z.string().max(240).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "packed", "shipped", "delivered", "returned", "cancelled", "refunded"]),
  note: z.string().max(200).optional(),
});

export const shippingSchema = z.object({
  courier: z.string().min(2),
  trackingId: z.string().min(3),
  eta: z.string().optional(),
});

export const refundSchema = z.object({
  amount: z.number().nonnegative(),
  reason: z.string().min(3),
});

export const adminRoleSchema = z.object({
  role: z.enum(["user", "vendor", "staff", "manager", "admin", "super_admin"]),
});

export const userStatusSchema = z.object({
  status: z.enum(["active", "suspended", "blocked"]),
});

export const userTwoFactorSchema = z.object({
  enabled: z.boolean(),
});

export const userNoteSchema = z.object({
  note: z.string().min(2).max(300),
});

export const supportTicketSchema = z.object({
  subject: z.string().min(3),
  category: z.enum(["refund", "delay", "damage", "other"]),
  message: z.string().min(4),
  userId: z.string().min(1),
});

export const supportTicketUpdateSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved"]).optional(),
  assignedTo: z.string().optional(),
  message: z.string().min(1).optional(),
});

export const returnRequestSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().min(4),
  userId: z.string().min(1),
});

export const returnUpdateSchema = z.object({
  status: z.enum(["requested", "approved", "rejected", "refunded"]),
  refundAmount: z.number().nonnegative().optional(),
});

export const campaignSchema = z.object({
  title: z.string().min(3),
  channel: z.enum(["email", "push", "banner"]),
  status: z.enum(["draft", "scheduled", "running", "completed"]),
  audience: z.enum(["all", "new", "repeat", "vip"]),
  offerType: z.enum(["percent", "flat", "flash"]).optional(),
  offerValue: z.number().nonnegative().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
});

export const vendorSchema = z.object({
  businessName: z.string().min(2),
  ownerName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  commissionPercent: z.number().min(0).max(100),
  status: z.enum(["pending", "approved", "rejected", "suspended"]).optional(),
  kycVerified: z.boolean().optional(),
});

export const vendorApprovalSchema = z.object({
  status: z.enum(["approved", "rejected", "suspended"]),
  note: z.string().max(240).optional(),
});

export const bannerSchema = z.object({
  title: z.string().min(2),
  type: z.enum(["hero", "offer", "category"]),
  imageDesktop: z.string().url(),
  imageMobile: z.string().url().optional(),
  linkType: z.enum(["product", "category", "external"]),
  linkTarget: z.string().min(1),
  position: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  linkedCampaignId: z.string().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().max(500).optional(),
  image: z.string().url().optional(),
  parentId: z.string().nullable().optional(),
  level: z.number().int().min(0).default(0),
  tags: z.array(z.string()).optional(),
  seo: z
    .object({
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
    })
    .optional(),
});

export const customerNotifySchema = z.object({
  channel: z.enum(["email", "sms", "whatsapp", "push"]),
  subject: z.string().min(2).optional(),
  message: z.string().min(2),
});

export const financeExpenseSchema = z.object({
  category: z.enum(["shipping", "marketing", "operations", "other"]),
  amount: z.number().positive(),
  note: z.string().max(240).optional(),
});

const deliveryPricingRuleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  enabled: z.boolean(),
  priority: z.number().int().min(0),
  speed: z.enum(["standard", "express", "same_day"]).optional(),
  minDistanceKm: z.number().min(0).optional(),
  maxDistanceKm: z.number().min(0).optional(),
  minOrderValue: z.number().min(0).optional(),
  maxOrderValue: z.number().min(0).optional(),
  minWeightKg: z.number().min(0).optional(),
  maxWeightKg: z.number().min(0).optional(),
  zoneIds: z.array(z.string()).optional(),
  flatFee: z.number().min(0),
  perKmFee: z.number().min(0),
});

const freeDeliveryRuleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  enabled: z.boolean(),
  minOrderValue: z.number().min(0).optional(),
  productIds: z.array(z.string()).optional(),
  categoryIds: z.array(z.string()).optional(),
  firstOrderOnly: z.boolean().optional(),
  customerSegments: z.array(z.enum(["new", "repeat", "vip"])).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  campaignIds: z.array(z.string()).optional(),
});

const deliveryZoneSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  type: z.enum(["local", "regional", "national"]),
  enabled: z.boolean(),
  cities: z.array(z.string()).optional(),
  pincodePrefixes: z.array(z.string()).optional(),
  baseFee: z.number().min(0),
  expressSurcharge: z.number().min(0),
});

const paymentMethodsSchema = z.object({
  upi: z.boolean(),
  cards: z.boolean(),
  netBanking: z.boolean(),
  cod: z.boolean(),
  wallet: z.boolean(),
  razorpay: z.boolean(),
  stripe: z.boolean(),
  paypal: z.boolean(),
});

const paymentRulesSchema = z.object({
  minOrderValue: z.number().min(0),
  maxOrderValue: z.number().min(0),
  codMaxOrderValue: z.number().min(0),
  codBlockedPincodes: z.array(z.string()),
  retryEnabled: z.boolean(),
  maxRetries: z.number().int().min(0).max(10),
  smartFallbackEnabled: z.boolean(),
  autoRefundOnReturnApproval: z.boolean(),
  partialRefundsEnabled: z.boolean(),
});

const integrationProviderSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  type: z.enum(["payment", "shipping", "notification", "analytics", "other"]),
  enabled: z.boolean(),
  mode: z.enum(["test", "live"]),
  keyRef: z.string().min(1),
  secretRef: z.string().optional(),
  healthStatus: z.enum(["active", "failed", "disabled", "unknown"]),
  lastCheckedAt: z.string().datetime().optional(),
  lastError: z.string().optional(),
  endpoint: z.string().url().optional(),
});

const webhookSchema = z.object({
  id: z.string().min(1),
  event: z.enum(["payment_success", "order_updated", "delivery_updated"]),
  url: z.string().url().or(z.literal("")),
  enabled: z.boolean(),
  retryFailed: z.boolean(),
  maxRetries: z.number().int().min(0).max(10),
  lastStatus: z.enum(["idle", "success", "failed"]),
  lastTriggeredAt: z.string().datetime().optional(),
});

export const storeSettingsSchema = z.object({
  storeName: z.string().min(2),
  brandPrefix: z.string().max(30).optional(),
  brandTagline: z.string().max(180).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  supportEmail: z.string().email(),
  supportPhone: z.string().min(8),
  taxRate: z.number().min(0).max(100),
  deliveryFee: z.number().min(0).max(10000),
  currency: z.string().min(2),
  themeColor: z.string().min(3),
  delivery: z.object({
    enabled: z.boolean(),
    expressEnabled: z.boolean(),
    sameDayEnabled: z.boolean(),
    maxRadiusKm: z.number().min(1).max(10000),
    slaStandardHours: z.number().int().min(1).max(720),
    slaExpressHours: z.number().int().min(1).max(720),
    blockedPincodes: z.array(z.string()),
    baseFee: z.number().min(0),
    expressSurcharge: z.number().min(0),
    sameDaySurcharge: z.number().min(0),
    pricingRules: z.array(deliveryPricingRuleSchema),
    freeDeliveryRules: z.array(freeDeliveryRuleSchema),
    zones: z.array(deliveryZoneSchema),
  }),
  payments: z.object({
    systemEnabled: z.boolean(),
    methods: paymentMethodsSchema,
    rules: paymentRulesSchema,
  }),
  integrations: z.object({
    defaultMode: z.enum(["test", "live"]),
    providers: z.array(integrationProviderSchema),
    webhooks: z.array(webhookSchema),
  }),
  operations: z.object({
    maintenanceMode: z.boolean(),
    checkoutEnabled: z.boolean(),
    taxEnabled: z.boolean(),
    autoOrderConfirm: z.boolean(),
    autoDeliveryAssignment: z.boolean(),
  }),
  alerts: z.object({
    paymentFailureRateThreshold: z.number().min(1).max(100),
    deliveryDelayThreshold: z.number().min(1).max(100),
    apiLatencyThresholdMs: z.number().min(100).max(60000),
    refundRateThreshold: z.number().min(1).max(100),
  }),
});

export const twoFactorRequestSchema = z.object({
  purpose: z.enum(["admin_login", "admin_sensitive_action"]).default("admin_login"),
});

export const twoFactorVerifySchema = z.object({
  code: z.string().length(6),
});

export const pluginAppSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  provider: z.string().min(2),
  version: z.string().min(1),
  category: z.enum(["marketing", "shipping", "payments", "analytics", "operations", "other"]),
  status: z.enum(["installed", "disabled", "uninstalled"]).optional(),
  apiEndpoint: z.string().url().optional(),
  webhookEndpoint: z.string().url().optional(),
});

export const pluginAppUpdateSchema = z.object({
  status: z.enum(["installed", "disabled", "uninstalled"]).optional(),
  version: z.string().min(1).optional(),
  apiEndpoint: z.string().url().optional(),
  webhookEndpoint: z.string().url().optional(),
});

export const mobileAppControlSchema = z.object({
  appEnabled: z.boolean(),
  pushNotificationsEnabled: z.boolean(),
  forceUpdateAndroidVersion: z.string().optional(),
  forceUpdateIosVersion: z.string().optional(),
  showWishlist: z.boolean(),
  showWallet: z.boolean(),
  showReferrals: z.boolean(),
  homeLayoutPreset: z.enum(["classic", "sale-first", "minimal"]),
});

export const automationCenterSchema = z.object({
  aiDemandForecastingEnabled: z.boolean(),
  aiFraudDetectionEnabled: z.boolean(),
  aiSmartPricingEnabled: z.boolean(),
  aiRecommendationsEnabled: z.boolean(),
  sandboxMode: z.boolean(),
  abTestingEnabled: z.boolean(),
  automationRules: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(2),
      enabled: z.boolean(),
      condition: z.string().min(2),
      action: z.string().min(2),
      priority: z.number().int().min(0),
    }),
  ),
});

export const cmsPageSchema = z.object({
  title: z.string().min(2),
  slug: z.string().min(2),
  status: z.enum(["draft", "published"]),
  seo: z
    .object({
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
    })
    .optional(),
});

export const bulkImportRowsSchema = z.object({
  rows: z.array(z.record(z.unknown())).min(1),
  dryRun: z.boolean().optional(),
  forceImport: z.boolean().optional(),
});

export const bulkProductActionSchema = z.object({
  action: z.enum(["update_price", "update_discount", "change_category", "delete", "set_status", "update_stock"]),
  productIds: z.array(z.string()).min(1),
  value: z.unknown().optional(),
});

export const metaAdsConfigSchema = z.object({
  connected: z.boolean(),
  adAccountId: z.string().optional(),
  businessId: z.string().optional(),
  catalogId: z.string().optional(),
  pixelId: z.string().optional(),
  accessTokenRef: z.string().optional(),
  syncEnabled: z.boolean(),
  testMode: z.boolean(),
});

export const metaAdsCampaignSchema = z.object({
  name: z.string().min(2),
  type: z.enum(["conversion", "retargeting", "catalog"]),
  status: z.enum(["draft", "active", "paused", "completed"]).optional(),
  productIds: z.array(z.string()).min(1),
  dailyBudget: z.number().min(100),
});

export const seoPlatformConfigSchema = z.object({
  sitemapEnabled: z.boolean(),
  robotsPolicy: z.enum(["index_follow", "index_nofollow", "noindex_follow", "noindex_nofollow"]),
  pageSpeedMode: z.enum(["balanced", "performance", "quality"]),
  schemaProductEnabled: z.boolean(),
  schemaOrganizationEnabled: z.boolean(),
  noindexCategorySlugs: z.array(z.string()),
});

export const socialShareConfigSchema = z.object({
  whatsappEnabled: z.boolean(),
  instagramEnabled: z.boolean(),
  facebookEnabled: z.boolean(),
  twitterEnabled: z.boolean(),
  referralRewardsEnabled: z.boolean(),
  rewardPointsPerReferral: z.number().min(0).max(10000),
});

export const createSocialShareLinkSchema = z.object({
  productId: z.string().optional(),
  platform: z.enum(["whatsapp", "instagram", "facebook", "twitter"]),
});

export const trackSocialShareClickSchema = z.object({
  shareId: z.string().min(1),
  converted: z.boolean().optional(),
  revenue: z.number().min(0).optional(),
});
