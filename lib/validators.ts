import { z } from "zod";

const mediaReferenceSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => /^https?:\/\//i.test(value) || value.includes("/"), "Invalid media reference");

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
  image: mediaReferenceSchema,
  variantId: z.string().optional(),
  customImageUrl: mediaReferenceSchema.optional(),
});

const checkoutCartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
  variantId: z.string().optional(),
  customImageUrl: mediaReferenceSchema.optional(),
});

export const createOrderSchema = z.object({
  items: z.array(checkoutCartItemSchema).min(1),
  address: addressSchema,
  couponCode: z.string().trim().optional(),
  paymentMethod: z.enum(["cashfree", "upi-offline", "cod", "razorpay", "stripe"]),
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
  color: z.string().optional(),
  type: z.string().optional(),
  material: z.string().optional(),
  sku: z.string().min(2),
  price: z.number().min(1),
  stock: z.number().int().min(0),
});

export const productSchema = z.object({
  name: z.string().min(2),
  subtitle: z.string().max(180).optional(),
  shortDescription: z.string().max(320).optional(),
  description: z.string().min(10),
  price: z.number().min(1),
  discountPercent: z.number().min(0).max(90).optional(),
  primaryImage: mediaReferenceSchema.optional(),
  images: z.array(mediaReferenceSchema).min(1),
  videoUrl: mediaReferenceSchema.optional(),
  category: z.string().min(1),
  subcategory: z.string().optional(),
  stock: z.number().int().min(0),
  sku: z.string().optional(),
  brand: z.string().optional(),
  costPrice: z.number().min(0).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  weightGrams: z.number().min(0).optional(),
  dimensions: z
    .object({
      widthCm: z.number().min(0).optional(),
      heightCm: z.number().min(0).optional(),
      depthCm: z.number().min(0).optional(),
    })
    .optional(),
  attributes: z.record(z.string()).optional(),
  variants: z.array(productVariantSchema).optional(),
  tags: z.array(z.string()).optional(),
  badges: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  recommended: z.boolean().optional(),
  popularity: z.number().int().optional(),
  deliveryTime: z.string().max(140).optional(),
  shippingInfo: z.string().max(320).optional(),
  trustBadges: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  ingredients: z.array(z.string()).optional(),
  usageInstructions: z.array(z.string()).optional(),
  routineProductIds: z.array(z.string()).optional(),
  comboProductIds: z.array(z.string()).optional(),
  frequentlyBoughtTogetherIds: z.array(z.string()).optional(),
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
  proofImageUrl: mediaReferenceSchema,
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
  attachments: z
    .array(
      z.object({
        url: mediaReferenceSchema,
        type: z.enum(["image", "video", "pdf", "file"]),
        name: z.string().optional(),
        sizeBytes: z.number().optional(),
      }),
    )
    .optional(),
});

export const supportTicketUpdateSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved"]).optional(),
  assignedTo: z.string().optional(),
  agentConnected: z.boolean().optional(),
  message: z.string().min(1).optional(),
  attachments: z
    .array(
      z.object({
        url: mediaReferenceSchema,
        type: z.enum(["image", "video", "pdf", "file"]),
        name: z.string().optional(),
        sizeBytes: z.number().optional(),
      }),
    )
    .optional(),
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
  imageDesktop: mediaReferenceSchema,
  imageMobile: mediaReferenceSchema.optional(),
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
  image: mediaReferenceSchema.optional(),
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
  cashfree: z.boolean().optional(),
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
  endpoint: z.string().url().optional().or(z.literal("")),
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

const storeMenuLinkSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  href: z.string().min(1),
  badge: z.string().optional(),
});

const storeMegaMenuEntrySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  href: z.string().min(1),
  badge: z.string().optional(),
});

const storeMegaMenuColumnSchema = z.object({
  id: z.string().min(1),
  heading: z.string().min(1),
  links: z.array(storeMegaMenuEntrySchema),
  imageUrl: mediaReferenceSchema.optional().or(z.literal("")),
  imageAlt: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional().or(z.literal("")),
});

const storeMegaMenuPromoCardSchema = z.object({
  enabled: z.boolean().optional(),
  imageUrl: mediaReferenceSchema.optional().or(z.literal("")),
  title: z.string().optional(),
  text: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional().or(z.literal("")),
});

const storeMegaMenuConfigSchema = z.object({
  id: z.string().min(1),
  key: z.string().min(1),
  title: z.string().min(1),
  columns: z.array(storeMegaMenuColumnSchema),
  promoCard: storeMegaMenuPromoCardSchema.optional(),
});

const storeDesktopMenuItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  href: z.string().min(1),
  badge: z.string().optional(),
  showMegaMenu: z.boolean().optional(),
  megaMenuKey: z.string().optional(),
});

const storeMenuPopupStyleSchema = z.object({
  widthPx: z.number().int().min(480).max(2600),
  maxColumns: z.number().int().min(1).max(8),
  borderRadiusPx: z.number().int().min(0).max(40),
  backgroundColor: z.string().min(3),
  textColor: z.string().min(3),
  headingColor: z.string().min(3),
  cardBackgroundColor: z.string().min(3),
  animation: z.enum(["none", "fade", "slide"]),
  showPromoCard: z.boolean(),
  promoImageUrl: mediaReferenceSchema.optional().or(z.literal("")),
  promoTitle: z.string().optional(),
  promoText: z.string().optional(),
  promoCtaLabel: z.string().optional(),
  promoCtaHref: z.string().optional().or(z.literal("")),
});

export const storeSettingsSchema = z.object({
  storeName: z.string().min(2),
  brandPrefix: z.string().max(30).optional(),
  brandTagline: z.string().max(180).optional(),
  logoUrl: mediaReferenceSchema.optional().or(z.literal("")),
  loginLeftImageUrl: mediaReferenceSchema.optional().or(z.literal("")),
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
    cashfreeAppId: z.string().optional().or(z.literal("")),
    cashfreeSecretKey: z.string().optional().or(z.literal("")),
    cashfreeWebhookSecret: z.string().optional().or(z.literal("")),
    cashfreeSandboxMode: z.boolean().optional(),
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
  menuEditor: z.object({
    desktopLinks: z.array(storeDesktopMenuItemSchema),
    mobileShopLinks: z.array(storeMenuLinkSchema),
    mobileMiscLinks: z.array(storeMenuLinkSchema),
    megaMenus: z.array(storeMegaMenuConfigSchema),
    popupStyle: storeMenuPopupStyleSchema,
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
  zipFileUrl: z.string().url().optional(),
});

export const pluginAppUpdateSchema = z.object({
  status: z.enum(["installed", "disabled", "uninstalled"]).optional(),
  version: z.string().min(1).optional(),
  apiEndpoint: z.string().url().optional(),
  webhookEndpoint: z.string().url().optional(),
  zipFileUrl: z.string().url().optional(),
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
  id: z.string().optional(),
  title: z.string().min(2),
  slug: z.string().min(2),
  status: z.enum(["draft", "published"]),
  content: z.string().max(50000).optional(),
  heroImageUrl: mediaReferenceSchema.optional().or(z.literal("")),
  template: z.enum(["default", "landing", "policy", "contact"]).optional(),
  showInFooter: z.boolean().optional(),
  excerpt: z.string().max(280).optional(),
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
