import {
  CustomerSegment,
  DeliveryPricingRule,
  DeliverySpeed,
  DeliveryZone,
  PaymentProvider,
  StoreMegaMenuColumn,
  StoreMegaMenuConfig,
  StoreMegaMenuEntry,
  StoreMegaMenuPromoCard,
  StoreSettings,
} from "@/types";

export interface DeliveryQuoteInput {
  subtotal: number;
  postalCode?: string;
  city?: string;
  speed?: DeliverySpeed;
  distanceKm?: number;
  weightKg?: number;
  customerSegment?: CustomerSegment;
  isFirstOrder?: boolean;
  productIds?: string[];
  categoryIds?: string[];
  campaignIds?: string[];
}

export interface DeliveryQuote {
  allowed: boolean;
  fee: number;
  zoneId?: string;
  zoneName?: string;
  pricingRuleId?: string;
  freeRuleId?: string;
  speed: DeliverySpeed;
  slaHours: number;
  message?: string;
}

export interface CheckoutControlSnapshot {
  taxRate: number;
  delivery: DeliveryQuote;
  payments: {
    enabled: boolean;
    availableGateways: Record<PaymentProvider, boolean>;
    availableMethods: StoreSettings["payments"]["methods"];
    fallbackGateway?: PaymentProvider;
    message?: string;
  };
  operations: {
    maintenanceMode: boolean;
    checkoutEnabled: boolean;
  };
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeCsv(values?: string[]) {
  return (values ?? [])
    .map((value) => value.trim())
    .filter(Boolean);
}

function getDefaultCashfreeSandboxMode() {
  return process.env.CASHFREE_ENV !== "production";
}

function normalizeMenuEntry(entry: unknown, index: number): StoreMegaMenuEntry | null {
  if (typeof entry === "string") {
    const label = entry.trim();
    if (!label) return null;
    return {
      id: `menu-entry-${index + 1}`,
      label,
      href: `/search?q=${encodeURIComponent(label)}`,
    };
  }

  if (!entry || typeof entry !== "object") {
    return null;
  }

  const raw = entry as Partial<StoreMegaMenuEntry>;
  const label = raw.label?.trim();
  const href = raw.href?.trim();
  if (!label || !href) return null;
  const badge = raw.badge?.trim();

  return {
    id: raw.id?.trim() || `menu-entry-${index + 1}`,
    label,
    href,
    ...(badge ? { badge } : {}),
  };
}

function normalizeMenuColumn(column: unknown, index: number): StoreMegaMenuColumn {
  if (!column || typeof column !== "object") {
    return {
      id: `menu-col-${index + 1}`,
      heading: "Category",
      links: [],
    };
  }

  const raw = column as Partial<StoreMegaMenuColumn> & { links?: unknown[] };
  const normalizedLinks = Array.isArray(raw.links)
    ? raw.links
        .map((entry, entryIndex) => normalizeMenuEntry(entry, entryIndex))
        .filter((entry): entry is StoreMegaMenuEntry => Boolean(entry))
    : [];
  const imageUrl = raw.imageUrl?.trim();
  const imageAlt = raw.imageAlt?.trim();
  const ctaLabel = raw.ctaLabel?.trim();
  const ctaHref = raw.ctaHref?.trim();

  return {
    id: raw.id?.trim() || `menu-col-${index + 1}`,
    heading: raw.heading?.trim() || "Category",
    links: normalizedLinks,
    ...(imageUrl ? { imageUrl } : {}),
    ...(imageAlt ? { imageAlt } : {}),
    ...(ctaLabel ? { ctaLabel } : {}),
    ...(ctaHref ? { ctaHref } : {}),
  };
}

function normalizeMenuPromoCard(promoCard: unknown): StoreMegaMenuPromoCard | undefined {
  if (!promoCard || typeof promoCard !== "object") {
    return undefined;
  }

  const raw = promoCard as StoreMegaMenuPromoCard;
  const imageUrl = raw.imageUrl?.trim();
  const title = raw.title?.trim();
  const text = raw.text?.trim();
  const ctaLabel = raw.ctaLabel?.trim();
  const ctaHref = raw.ctaHref?.trim();
  const enabled = typeof raw.enabled === "boolean" ? raw.enabled : undefined;

  const normalized: StoreMegaMenuPromoCard = {
    ...(typeof enabled === "boolean" ? { enabled } : {}),
    ...(imageUrl ? { imageUrl } : {}),
    ...(title ? { title } : {}),
    ...(text ? { text } : {}),
    ...(ctaLabel ? { ctaLabel } : {}),
    ...(ctaHref ? { ctaHref } : {}),
  };

  return Object.keys(normalized).length ? normalized : undefined;
}

function normalizeMegaMenus(menus: unknown[] | undefined, fallback: StoreMegaMenuConfig[]): StoreMegaMenuConfig[] {
  if (!Array.isArray(menus)) return fallback;

  return menus.map((menu, index) => {
    const raw = (menu ?? {}) as Partial<StoreMegaMenuConfig> & { columns?: unknown[]; promoCard?: unknown };
    const normalizedColumns = Array.isArray(raw.columns)
      ? raw.columns.map((column, columnIndex) => normalizeMenuColumn(column, columnIndex))
      : [];
    const normalizedPromoCard = normalizeMenuPromoCard(raw.promoCard);

    return {
      id: raw.id?.trim() || `mega-${index + 1}`,
      key: raw.key?.trim() || `mega-${index + 1}`,
      title: raw.title?.trim() || "Menu",
      columns: normalizedColumns,
      ...(normalizedPromoCard ? { promoCard: normalizedPromoCard } : {}),
    };
  });
}

function matchesZone(zone: DeliveryZone, input: DeliveryQuoteInput) {
  const normalizedPostal = input.postalCode?.trim() ?? "";
  const normalizedCity = input.city?.trim().toLowerCase() ?? "";
  const prefixes = normalizeCsv(zone.pincodePrefixes);
  const cities = normalizeCsv(zone.cities).map((city) => city.toLowerCase());

  const postalMatch = prefixes.length > 0 && normalizedPostal.length > 0 ? prefixes.some((prefix) => normalizedPostal.startsWith(prefix)) : false;
  const cityMatch = cities.length > 0 && normalizedCity.length > 0 ? cities.includes(normalizedCity) : false;

  return postalMatch || cityMatch;
}

function resolveZone(settings: StoreSettings, input: DeliveryQuoteInput) {
  const enabledZones = settings.delivery.zones.filter((zone) => zone.enabled);

  if (!enabledZones.length) {
    return null;
  }

  const strictMatch = enabledZones.find((zone) => matchesZone(zone, input));
  if (strictMatch) {
    return strictMatch;
  }

  return enabledZones.find((zone) => zone.type === "national") ?? enabledZones[0];
}

function ruleMatches(rule: DeliveryPricingRule, input: DeliveryQuoteInput, zoneId?: string) {
  const distanceKm = input.distanceKm ?? 0;
  const weightKg = input.weightKg ?? 0;
  const speed = input.speed ?? "standard";

  if (!rule.enabled) {
    return false;
  }

  if (rule.speed && rule.speed !== speed) {
    return false;
  }

  if (typeof rule.minDistanceKm === "number" && distanceKm < rule.minDistanceKm) {
    return false;
  }

  if (typeof rule.maxDistanceKm === "number" && distanceKm > rule.maxDistanceKm) {
    return false;
  }

  if (typeof rule.minOrderValue === "number" && input.subtotal < rule.minOrderValue) {
    return false;
  }

  if (typeof rule.maxOrderValue === "number" && input.subtotal > rule.maxOrderValue) {
    return false;
  }

  if (typeof rule.minWeightKg === "number" && weightKg < rule.minWeightKg) {
    return false;
  }

  if (typeof rule.maxWeightKg === "number" && weightKg > rule.maxWeightKg) {
    return false;
  }

  if (zoneId && rule.zoneIds?.length && !rule.zoneIds.includes(zoneId)) {
    return false;
  }

  return true;
}

function isRuleTimeActive(startsAt?: string, endsAt?: string) {
  const now = Date.now();
  const startTime = startsAt ? new Date(startsAt).getTime() : null;
  const endTime = endsAt ? new Date(endsAt).getTime() : null;

  if (startTime && Number.isFinite(startTime) && now < startTime) {
    return false;
  }

  if (endTime && Number.isFinite(endTime) && now > endTime) {
    return false;
  }

  return true;
}

export function calculateDeliveryQuote(settings: StoreSettings, input: DeliveryQuoteInput): DeliveryQuote {
  const speed = input.speed ?? "standard";
  const baseSla = speed === "express" ? settings.delivery.slaExpressHours : settings.delivery.slaStandardHours;

  if (!settings.delivery.enabled) {
    return {
      allowed: false,
      fee: 0,
      speed,
      slaHours: baseSla,
      message: "Delivery is temporarily disabled by admin.",
    };
  }

  if (input.postalCode && settings.delivery.blockedPincodes.includes(input.postalCode)) {
    return {
      allowed: false,
      fee: 0,
      speed,
      slaHours: baseSla,
      message: "Delivery is not available for this pincode.",
    };
  }

  if (speed === "express" && !settings.delivery.expressEnabled) {
    return {
      allowed: false,
      fee: 0,
      speed,
      slaHours: baseSla,
      message: "Express delivery is currently disabled.",
    };
  }

  if (speed === "same_day" && !settings.delivery.sameDayEnabled) {
    return {
      allowed: false,
      fee: 0,
      speed,
      slaHours: baseSla,
      message: "Same-day delivery is currently disabled.",
    };
  }

  const zone = resolveZone(settings, input);
  const distanceKm = Math.max(input.distanceKm ?? 0, 0);
  const sortedRules = [...settings.delivery.pricingRules].sort((a, b) => a.priority - b.priority);
  const matchingRule = sortedRules.find((rule) => ruleMatches(rule, input, zone?.id));

  let fee = zone?.baseFee ?? settings.delivery.baseFee;
  if (speed === "express") {
    fee += (zone?.expressSurcharge ?? 0) + settings.delivery.expressSurcharge;
  }
  if (speed === "same_day") {
    fee += settings.delivery.sameDaySurcharge;
  }

  if (matchingRule) {
    fee = matchingRule.flatFee + matchingRule.perKmFee * distanceKm;
  }

  const freeRule = settings.delivery.freeDeliveryRules.find((rule) => {
    if (!rule.enabled || !isRuleTimeActive(rule.startsAt, rule.endsAt)) {
      return false;
    }

    if (typeof rule.minOrderValue === "number" && input.subtotal < rule.minOrderValue) {
      return false;
    }

    if (rule.firstOrderOnly && !input.isFirstOrder) {
      return false;
    }

    if (rule.customerSegments?.length && input.customerSegment && !rule.customerSegments.includes(input.customerSegment)) {
      return false;
    }

    if (rule.customerSegments?.length && !input.customerSegment) {
      return false;
    }

    if (rule.productIds?.length && !rule.productIds.some((id) => input.productIds?.includes(id))) {
      return false;
    }

    if (rule.categoryIds?.length && !rule.categoryIds.some((id) => input.categoryIds?.includes(id))) {
      return false;
    }

    if (rule.campaignIds?.length && !rule.campaignIds.some((id) => input.campaignIds?.includes(id))) {
      return false;
    }

    return true;
  });

  if (freeRule) {
    fee = 0;
  }

  return {
    allowed: true,
    fee: Math.max(Math.round(fee), 0),
    zoneId: zone?.id,
    zoneName: zone?.name,
    pricingRuleId: matchingRule?.id,
    freeRuleId: freeRule?.id,
    speed,
    slaHours: baseSla,
  };
}

function gatewayEnabled(settings: StoreSettings, gateway: PaymentProvider) {
  if (gateway === "cashfree") {
    return Boolean(
      (settings.payments.methods.cashfree ?? false) &&
        (settings.payments.cashfreeAppId || process.env.CASHFREE_APP_ID) &&
        (settings.payments.cashfreeSecretKey || process.env.CASHFREE_SECRET_KEY),
    );
  }

  if (gateway === "cod") {
    return settings.payments.methods.cod;
  }

  if (gateway === "razorpay") {
    return settings.payments.methods.razorpay;
  }

  if (gateway === "stripe") {
    return settings.payments.methods.stripe;
  }

  return settings.payments.methods.upi;
}

function getFallbackGateway(availableGateways: Record<PaymentProvider, boolean>) {
  if (availableGateways.cashfree) {
    return "cashfree";
  }

  if (availableGateways.razorpay) {
    return "razorpay";
  }

  if (availableGateways.stripe) {
    return "stripe";
  }

  return undefined;
}

export function evaluateCheckoutControls(
  settings: StoreSettings,
  input: {
    subtotal: number;
    postalCode?: string;
    city?: string;
    speed?: DeliverySpeed;
    customerSegment?: CustomerSegment;
    isFirstOrder?: boolean;
    productIds?: string[];
    categoryIds?: string[];
  },
): CheckoutControlSnapshot {
  const normalizedSubtotal = Math.max(Math.round(input.subtotal), 0);
  const delivery = calculateDeliveryQuote(settings, {
    subtotal: normalizedSubtotal,
    postalCode: input.postalCode,
    city: input.city,
    speed: input.speed,
    customerSegment: input.customerSegment,
    isFirstOrder: input.isFirstOrder,
    productIds: input.productIds,
    categoryIds: input.categoryIds,
  });

  const inOrderRange =
    normalizedSubtotal >= settings.payments.rules.minOrderValue && normalizedSubtotal <= settings.payments.rules.maxOrderValue;
  const normalizedPostalCode = input.postalCode?.trim() ?? "";
  const codAllowed =
    normalizedSubtotal <= settings.payments.rules.codMaxOrderValue &&
    (!normalizedPostalCode || !settings.payments.rules.codBlockedPincodes.includes(normalizedPostalCode));

  const paymentEnabled = settings.payments.systemEnabled && settings.operations.checkoutEnabled && !settings.operations.maintenanceMode;
  const availableGateways: Record<PaymentProvider, boolean> = {
    cashfree: paymentEnabled && gatewayEnabled(settings, "cashfree") && inOrderRange,
    upi_offline: paymentEnabled && gatewayEnabled(settings, "upi_offline") && inOrderRange,
    cod: paymentEnabled && gatewayEnabled(settings, "cod") && inOrderRange && codAllowed,
    razorpay: false,
    stripe: false,
  };

  let paymentMessage: string | undefined;
  if (!settings.operations.checkoutEnabled || settings.operations.maintenanceMode) {
    paymentMessage = "Checkout is in maintenance mode.";
  } else if (!settings.payments.systemEnabled) {
    paymentMessage = "Payments are temporarily disabled by admin.";
  } else if (!inOrderRange) {
    paymentMessage = `Orders must be between ${settings.payments.rules.minOrderValue} and ${settings.payments.rules.maxOrderValue}.`;
  } else if (!availableGateways.cashfree && !availableGateways.upi_offline && !availableGateways.cod) {
    paymentMessage = (settings.payments.methods.cashfree ?? false) && !gatewayEnabled(settings, "cashfree")
      ? "Cashfree credentials are missing. Configure App ID and Secret Key in Admin Payment Settings."
      : "No payment gateway is currently available.";
  }

  return {
    taxRate: settings.operations.taxEnabled ? settings.taxRate : 0,
    delivery,
    payments: {
      enabled: paymentEnabled,
      availableGateways,
      availableMethods: settings.payments.methods,
      fallbackGateway: getFallbackGateway(availableGateways),
      message: paymentMessage,
    },
    operations: {
      maintenanceMode: settings.operations.maintenanceMode,
      checkoutEnabled: settings.operations.checkoutEnabled,
    },
  };
}

export function canUseGateway(
  settings: StoreSettings,
  gateway: PaymentProvider,
  input: { subtotal: number; postalCode?: string; city?: string; speed?: DeliverySpeed },
) {
  const snapshot = evaluateCheckoutControls(settings, {
    subtotal: input.subtotal,
    postalCode: input.postalCode,
    city: input.city,
    speed: input.speed,
  });

  if (!snapshot.operations.checkoutEnabled || snapshot.operations.maintenanceMode) {
    return { allowed: false, reason: "Checkout is unavailable right now." };
  }

  if (!snapshot.delivery.allowed) {
    return { allowed: false, reason: snapshot.delivery.message ?? "Delivery is unavailable for this order." };
  }

  if (!snapshot.payments.availableGateways[gateway]) {
    return { allowed: false, reason: snapshot.payments.message ?? "Selected payment method is unavailable." };
  }

  return { allowed: true as const };
}

export function withIntegrationHealth(settings: StoreSettings): StoreSettings {
  const updatedProviders = settings.integrations.providers.map((provider) => {
    if (!provider.enabled) {
      return {
        ...provider,
        healthStatus: "disabled" as const,
      };
    }

    const keyExists = provider.keyRef ? Boolean(process.env[provider.keyRef]) : false;
    const secretExists = provider.secretRef ? Boolean(process.env[provider.secretRef]) : true;
    const healthy = keyExists && secretExists;

    return {
      ...provider,
      healthStatus: healthy ? ("active" as const) : ("failed" as const),
      lastCheckedAt: nowIso(),
      lastError: healthy ? undefined : `Missing env for ${provider.keyRef}${provider.secretRef ? ` or ${provider.secretRef}` : ""}`,
    };
  });

  return {
    ...settings,
    integrations: {
      ...settings.integrations,
      providers: updatedProviders,
    },
  };
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  id: "default",
  storeName: "FriendlyDrop",
  brandPrefix: "Maison",
  brandTagline: "Luxury-ready fashion commerce with AI styling.",
  logoUrl: "",
  loginLeftImageUrl: "",
  supportEmail: "help@friendlydrop.in",
  supportPhone: "+91 98765 43210",
  taxRate: 18,
  deliveryFee: 60,
  currency: "INR",
  themeColor: "#ff6f3d",
  delivery: {
    enabled: true,
    expressEnabled: true,
    sameDayEnabled: false,
    maxRadiusKm: 120,
    slaStandardHours: 72,
    slaExpressHours: 24,
    blockedPincodes: [],
    baseFee: 60,
    expressSurcharge: 49,
    sameDaySurcharge: 99,
    zones: [
      {
        id: "zone-local",
        name: "Local",
        type: "local",
        enabled: true,
        cities: ["bengaluru"],
        pincodePrefixes: ["560"],
        baseFee: 40,
        expressSurcharge: 35,
      },
      {
        id: "zone-regional",
        name: "Regional",
        type: "regional",
        enabled: true,
        cities: ["chennai", "hyderabad", "mumbai"],
        pincodePrefixes: ["400", "500", "600"],
        baseFee: 60,
        expressSurcharge: 49,
      },
      {
        id: "zone-national",
        name: "National",
        type: "national",
        enabled: true,
        cities: [],
        pincodePrefixes: [],
        baseFee: 80,
        expressSurcharge: 69,
      },
    ],
    pricingRules: [
      {
        id: "rule-standard-distance",
        name: "Distance-based standard shipping",
        enabled: true,
        priority: 10,
        speed: "standard",
        minDistanceKm: 0,
        maxDistanceKm: 120,
        flatFee: 40,
        perKmFee: 0.8,
      },
      {
        id: "rule-express-distance",
        name: "Distance-based express shipping",
        enabled: true,
        priority: 20,
        speed: "express",
        minDistanceKm: 0,
        maxDistanceKm: 120,
        flatFee: 70,
        perKmFee: 1.1,
      },
    ],
    freeDeliveryRules: [
      {
        id: "free-above-999",
        name: "Free delivery above 999",
        enabled: true,
        minOrderValue: 999,
      },
      {
        id: "free-vip-above-699",
        name: "VIP free delivery above 699",
        enabled: true,
        minOrderValue: 699,
        customerSegments: ["vip"],
      },
    ],
  },
  payments: {
    systemEnabled: true,
    methods: {
      upi: true,
      cards: true,
      netBanking: true,
      cod: true,
      wallet: true,
      razorpay: false,
      stripe: false,
      paypal: false,
      cashfree: true,
    },
    rules: {
      minOrderValue: 99,
      maxOrderValue: 100000,
      codMaxOrderValue: 4999,
      codBlockedPincodes: [],
      retryEnabled: true,
      maxRetries: 2,
      smartFallbackEnabled: true,
      autoRefundOnReturnApproval: true,
      partialRefundsEnabled: true,
    },
    cashfreeAppId: "",
    cashfreeSecretKey: "",
    cashfreeWebhookSecret: "",
    cashfreeSandboxMode: getDefaultCashfreeSandboxMode(),
  },
  integrations: {
    defaultMode: "live",
    providers: [
      {
        id: "provider-razorpay",
        name: "Razorpay",
        type: "payment",
        enabled: true,
        mode: "live",
        keyRef: "RAZORPAY_KEY_ID",
        secretRef: "RAZORPAY_KEY_SECRET",
        healthStatus: "unknown",
      },
      {
        id: "provider-stripe",
        name: "Stripe",
        type: "payment",
        enabled: true,
        mode: "live",
        keyRef: "STRIPE_SECRET_KEY",
        secretRef: "STRIPE_WEBHOOK_SECRET",
        healthStatus: "unknown",
      },
      {
        id: "provider-shiprocket",
        name: "Shiprocket",
        type: "shipping",
        enabled: false,
        mode: "live",
        keyRef: "SHIPROCKET_API_TOKEN",
        healthStatus: "unknown",
      },
      {
        id: "provider-twilio",
        name: "Twilio",
        type: "notification",
        enabled: false,
        mode: "live",
        keyRef: "TWILIO_ACCOUNT_SID",
        secretRef: "TWILIO_AUTH_TOKEN",
        healthStatus: "unknown",
      },
    ],
    webhooks: [
      {
        id: "wh-payment-success",
        event: "payment_success",
        url: "",
        enabled: false,
        retryFailed: true,
        maxRetries: 3,
        lastStatus: "idle",
      },
      {
        id: "wh-order-updated",
        event: "order_updated",
        url: "",
        enabled: false,
        retryFailed: true,
        maxRetries: 3,
        lastStatus: "idle",
      },
      {
        id: "wh-delivery-updated",
        event: "delivery_updated",
        url: "",
        enabled: false,
        retryFailed: true,
        maxRetries: 3,
        lastStatus: "idle",
      },
    ],
  },
  operations: {
    maintenanceMode: false,
    checkoutEnabled: true,
    taxEnabled: true,
    autoOrderConfirm: true,
    autoDeliveryAssignment: true,
  },
  alerts: {
    paymentFailureRateThreshold: 15,
    deliveryDelayThreshold: 20,
    apiLatencyThresholdMs: 1500,
    refundRateThreshold: 12,
  },
  menuEditor: {
    desktopLinks: [
      { id: "menu-men", label: "MEN", href: "/products?section=men" },
      { id: "menu-women", label: "WOMEN", href: "/products?section=women" },
      { id: "menu-kids", label: "KIDS", href: "/products?section=kids" },
      { id: "menu-home", label: "HOME", href: "/products?section=home", showMegaMenu: true, megaMenuKey: "home" },
      { id: "menu-beauty", label: "BEAUTY", href: "/products?section=beauty" },
      { id: "menu-genz", label: "GENZ", href: "/products?section=genz" },
      { id: "menu-studio", label: "STUDIO", href: "/products?section=studio", badge: "NEW" },
    ],
    mobileShopLinks: [
      { id: "m-men", label: "Men", href: "/products?section=men" },
      { id: "m-women", label: "Women", href: "/products?section=women" },
      { id: "m-kids", label: "Kids", href: "/products?section=kids" },
      { id: "m-home", label: "Home", href: "/products?section=home" },
      { id: "m-beauty", label: "Beauty", href: "/products?section=beauty" },
      { id: "m-genz", label: "Genz", href: "/products?section=genz" },
    ],
    mobileMiscLinks: [
      { id: "mm-orders", label: "Orders", href: "/orders" },
      { id: "mm-wishlist", label: "Wishlist", href: "/wishlist" },
      { id: "mm-credit", label: "Gift Cards", href: "/account?panel=credit" },
      { id: "mm-contact", label: "Contact Us", href: "/contact" },
      { id: "mm-about", label: "Brand Story", href: "/about-brand" },
    ],
    megaMenus: [
      {
        id: "mega-home",
        key: "home",
        title: "Home",
        columns: [
          {
            id: "home-col-1",
            heading: "Bed Linen & Furnishing",
            links: [
              { id: "home-col-1-link-1", label: "Bed Runners", href: "/products?category=bed-runners" },
              { id: "home-col-1-link-2", label: "Mattress Protectors", href: "/products?category=mattress-protectors" },
              { id: "home-col-1-link-3", label: "Bedsheets", href: "/products?category=bedsheets" },
              { id: "home-col-1-link-4", label: "Bedding Sets", href: "/products?category=bedding-sets" },
            ],
            ctaLabel: "View All",
            ctaHref: "/products?section=home",
          },
          {
            id: "home-col-2",
            heading: "Bath",
            links: [
              { id: "home-col-2-link-1", label: "Bath Towels", href: "/products?category=bath-towels" },
              { id: "home-col-2-link-2", label: "Hand & Face Towels", href: "/products?category=hand-face-towels" },
              { id: "home-col-2-link-3", label: "Bath Rugs", href: "/products?category=bath-rugs" },
              { id: "home-col-2-link-4", label: "Bath Robes", href: "/products?category=bath-robes" },
            ],
          },
          {
            id: "home-col-3",
            heading: "Home Decor",
            links: [
              { id: "home-col-3-link-1", label: "Plants & Planters", href: "/products?category=plants-planters" },
              { id: "home-col-3-link-2", label: "Aromas & Candles", href: "/products?category=aromas-candles" },
              { id: "home-col-3-link-3", label: "Clocks", href: "/products?category=clocks" },
              { id: "home-col-3-link-4", label: "Mirrors", href: "/products?category=mirrors" },
            ],
          },
          {
            id: "home-col-4",
            heading: "Furniture",
            links: [
              { id: "home-col-4-link-1", label: "Home Gift Sets", href: "/products?category=home-gift-sets" },
              { id: "home-col-4-link-2", label: "Kitchen & Table", href: "/products?category=kitchen-table" },
              { id: "home-col-4-link-3", label: "Table Runners", href: "/products?category=table-runners" },
              { id: "home-col-4-link-4", label: "Dinnerware & Serveware", href: "/products?category=dinnerware-serveware" },
            ],
          },
          {
            id: "home-col-5",
            heading: "Storage",
            links: [
              { id: "home-col-5-link-1", label: "Bins", href: "/products?category=bins" },
              { id: "home-col-5-link-2", label: "Hangers", href: "/products?category=hangers" },
              { id: "home-col-5-link-3", label: "Organisers", href: "/products?category=organisers" },
              { id: "home-col-5-link-4", label: "Hooks & Holders", href: "/products?category=hooks-holders" },
            ],
          },
        ],
      },
    ],
    popupStyle: {
      widthPx: 1500,
      maxColumns: 5,
      borderRadiusPx: 16,
      backgroundColor: "#ffffff",
      textColor: "#222a3f",
      headingColor: "#16a34a",
      cardBackgroundColor: "#fbfbfc",
      animation: "fade",
      showPromoCard: false,
      promoImageUrl: "",
      promoTitle: "Season Edit",
      promoCtaLabel: "Shop Edit",
      promoCtaHref: "/products",
      promoText: "Add campaign visuals here from Settings -> Site Builder -> Menu.",
    },
  },
  updatedAt: nowIso(),
};

export function normalizeStoreSettings(input?: Partial<StoreSettings>): StoreSettings {
  return {
    ...DEFAULT_STORE_SETTINGS,
    ...(input ?? {}),
    loginLeftImageUrl: input?.loginLeftImageUrl?.trim() ?? DEFAULT_STORE_SETTINGS.loginLeftImageUrl,
    delivery: {
      ...DEFAULT_STORE_SETTINGS.delivery,
      ...(input?.delivery ?? {}),
      pricingRules: input?.delivery?.pricingRules ?? DEFAULT_STORE_SETTINGS.delivery.pricingRules,
      freeDeliveryRules: input?.delivery?.freeDeliveryRules ?? DEFAULT_STORE_SETTINGS.delivery.freeDeliveryRules,
      zones: input?.delivery?.zones ?? DEFAULT_STORE_SETTINGS.delivery.zones,
      blockedPincodes: normalizeCsv(input?.delivery?.blockedPincodes ?? DEFAULT_STORE_SETTINGS.delivery.blockedPincodes),
    },
    payments: {
      ...DEFAULT_STORE_SETTINGS.payments,
      ...(input?.payments ?? {}),
      methods: {
        ...DEFAULT_STORE_SETTINGS.payments.methods,
        ...(input?.payments?.methods ?? {}),
      },
      rules: {
        ...DEFAULT_STORE_SETTINGS.payments.rules,
        ...(input?.payments?.rules ?? {}),
        codBlockedPincodes: normalizeCsv(
          input?.payments?.rules?.codBlockedPincodes ?? DEFAULT_STORE_SETTINGS.payments.rules.codBlockedPincodes,
        ),
      },
      cashfreeAppId: input?.payments?.cashfreeAppId?.trim() ?? DEFAULT_STORE_SETTINGS.payments.cashfreeAppId,
      cashfreeSecretKey: input?.payments?.cashfreeSecretKey?.trim() ?? DEFAULT_STORE_SETTINGS.payments.cashfreeSecretKey,
      cashfreeWebhookSecret: input?.payments?.cashfreeWebhookSecret?.trim() ?? DEFAULT_STORE_SETTINGS.payments.cashfreeWebhookSecret,
      cashfreeSandboxMode: typeof input?.payments?.cashfreeSandboxMode === "boolean" ? input.payments.cashfreeSandboxMode : getDefaultCashfreeSandboxMode(),
    },
    integrations: {
      ...DEFAULT_STORE_SETTINGS.integrations,
      ...(input?.integrations ?? {}),
      providers: input?.integrations?.providers ?? DEFAULT_STORE_SETTINGS.integrations.providers,
      webhooks: input?.integrations?.webhooks ?? DEFAULT_STORE_SETTINGS.integrations.webhooks,
    },
    operations: {
      ...DEFAULT_STORE_SETTINGS.operations,
      ...(input?.operations ?? {}),
    },
    alerts: {
      ...DEFAULT_STORE_SETTINGS.alerts,
      ...(input?.alerts ?? {}),
    },
    menuEditor: {
      ...DEFAULT_STORE_SETTINGS.menuEditor,
      ...(input?.menuEditor ?? {}),
      desktopLinks: input?.menuEditor?.desktopLinks ?? DEFAULT_STORE_SETTINGS.menuEditor.desktopLinks,
      mobileShopLinks: input?.menuEditor?.mobileShopLinks ?? DEFAULT_STORE_SETTINGS.menuEditor.mobileShopLinks,
      mobileMiscLinks: input?.menuEditor?.mobileMiscLinks ?? DEFAULT_STORE_SETTINGS.menuEditor.mobileMiscLinks,
      megaMenus: normalizeMegaMenus(input?.menuEditor?.megaMenus as unknown[] | undefined, DEFAULT_STORE_SETTINGS.menuEditor.megaMenus),
      popupStyle: {
        ...DEFAULT_STORE_SETTINGS.menuEditor.popupStyle,
        ...(input?.menuEditor?.popupStyle ?? {}),
      },
    },
    id: "default",
    updatedAt: input?.updatedAt ?? DEFAULT_STORE_SETTINGS.updatedAt,
  };
}



