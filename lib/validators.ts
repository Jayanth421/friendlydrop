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
  paymentMethod: z.enum(["razorpay", "stripe"]),
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
  images: z.array(z.string().url()).min(1),
  category: z.enum(["photo-prints", "stickers", "personalized-gifts"]),
  subcategory: z.string().optional(),
  stock: z.number().int().min(0),
  sku: z.string().optional(),
  variants: z.array(productVariantSchema).optional(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  popularity: z.number().int().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  visibility: z.enum(["public", "private"]).optional(),
  seo: z
    .object({
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
    })
    .optional(),
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
  role: z.enum(["user", "staff", "admin", "super_admin"]),
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
});

export const financeExpenseSchema = z.object({
  category: z.enum(["shipping", "marketing", "operations", "other"]),
  amount: z.number().positive(),
  note: z.string().max(240).optional(),
});

export const storeSettingsSchema = z.object({
  storeName: z.string().min(2),
  supportEmail: z.string().email(),
  supportPhone: z.string().min(8),
  taxRate: z.number().min(0).max(100),
  deliveryFee: z.number().min(0).max(10000),
  currency: z.string().min(2),
  themeColor: z.string().min(3),
});

export const twoFactorRequestSchema = z.object({
  purpose: z.enum(["admin_login", "admin_sensitive_action"]).default("admin_login"),
});

export const twoFactorVerifySchema = z.object({
  code: z.string().length(6),
});
