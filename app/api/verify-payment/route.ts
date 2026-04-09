import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { verifyRazorpaySchema, couponValidationSchema } from "@/lib/validators";
import { createOrder, getCouponByCode, getProductById, getStoreSettings, getUserById, saveCart } from "@/lib/firebase/firestore";
import { sendOrderEmail } from "@/lib/email";
import { calculateCheckoutSummary } from "@/lib/checkout-pricing";
import { publishSystemEvent } from "@/lib/system-events";
import { runPostPaymentAutomation } from "@/lib/automation-engine";
import { calculateDeliveryQuote, canUseGateway } from "@/lib/settings-engine";

export const runtime = "nodejs";

async function buildSecureItems(items: Array<{ productId: string; quantity: number; customImageUrl?: string }>) {
  const secureItems: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
    category: string;
    weightKg: number;
    customImageUrl?: string;
  }> = [];

  for (const item of items) {
    const product = await getProductById(item.productId);

    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    secureItems.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      image: product.images[0],
      category: product.category,
      weightKg: Math.max(Number(product.weightGrams ?? 500) / 1000, 0.1),
      customImageUrl: item.customImageUrl,
    });
  }

  return secureItems;
}

async function calculateTotal(input: {
  userId: string;
  items: Array<{ productId: string; quantity: number; customImageUrl?: string }>;
  couponCode?: string;
  priority?: "normal" | "express";
  address: { postalCode?: string; city?: string };
}) {
  const secureItems = await buildSecureItems(input.items);
  const subtotal = secureItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  let discountAmount = 0;

  if (input.couponCode) {
    const normalized = couponValidationSchema.parse({ code: input.couponCode }).code;
    const coupon = await getCouponByCode(normalized);
    const isExpired = coupon?.expiresAt ? new Date(coupon.expiresAt).getTime() < Date.now() : false;

    if (coupon && coupon.active && !isExpired) {
      discountAmount = coupon.type === "percent" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
    }
  }

  const [settings, profile] = await Promise.all([getStoreSettings(), getUserById(input.userId)]);
  const isFirstOrder = (profile?.orderCount ?? 0) === 0;
  const gatewayCheck = canUseGateway(settings, "razorpay", {
    subtotal,
    postalCode: input.address.postalCode,
    city: input.address.city,
    speed: input.priority === "express" ? "express" : "standard",
  });

  if (!gatewayCheck.allowed) {
    throw new Error(gatewayCheck.reason);
  }

  const deliveryQuote = calculateDeliveryQuote(settings, {
    subtotal: Math.max(subtotal - discountAmount, 0),
    postalCode: input.address.postalCode,
    city: input.address.city,
    speed: input.priority === "express" ? "express" : "standard",
    customerSegment: profile?.segment,
    isFirstOrder,
    productIds: secureItems.map((item) => item.productId),
    categoryIds: secureItems.map((item) => item.category),
    weightKg: secureItems.reduce((sum, item) => sum + item.weightKg * item.quantity, 0),
  });

  const summary = calculateCheckoutSummary({
    subtotal,
    discountAmount,
    taxRate: settings.operations.taxEnabled ? settings.taxRate : 0,
    deliveryFee: deliveryQuote.allowed ? deliveryQuote.fee : 0,
  });

  return {
    secureItems,
    deliveryQuote,
    ...summary,
  };
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    const payload = verifyRazorpaySchema.parse(await request.json());

    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      return NextResponse.json({ error: "Razorpay secret not configured" }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${payload.razorpayOrderId}|${payload.razorpayPaymentId}`)
      .digest("hex");

    if (expectedSignature !== payload.razorpaySignature) {
      await publishSystemEvent({
        type: "payment_failed",
        module: "payments",
        source: "api:verify-payment",
        severity: "warning",
        userId: user.uid,
        payload: {
          provider: "razorpay",
          reason: "invalid_signature",
          razorpayOrderId: payload.razorpayOrderId,
        },
      });
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 401 });
    }

    const totals = await calculateTotal({
      userId: user.uid,
      items: payload.orderDraft.items,
      couponCode: payload.orderDraft.couponCode,
      priority: payload.orderDraft.priority,
      address: {
        postalCode: payload.orderDraft.address.postalCode,
        city: payload.orderDraft.address.city,
      },
    });

    const settings = await getStoreSettings();
    const status = settings.operations.autoOrderConfirm ? "confirmed" : "pending";

    const order = await createOrder({
      userId: user.uid,
      items: totals.secureItems,
      priority: payload.orderDraft.priority ?? "normal",
      totalAmount: totals.total,
      subtotalAmount: totals.subtotal,
      taxRate: totals.taxRate,
      taxAmount: totals.taxAmount,
      deliveryFee: totals.deliveryFee,
      paymentId: payload.razorpayPaymentId,
      status,
      address: payload.orderDraft.address,
      couponCode: payload.orderDraft.couponCode,
      discountAmount: totals.discountAmount,
      payment: {
        provider: "razorpay",
        paymentId: payload.razorpayPaymentId,
        orderId: payload.razorpayOrderId,
        signature: payload.razorpaySignature,
        status: "success",
      },
    });

    await saveCart(user.uid, []);

    if (user.email) {
      await sendOrderEmail({
        to: user.email,
        customerName: user.name,
        orderId: order.id,
        amount: order.totalAmount,
        status: order.status,
      });
    }

    await runPostPaymentAutomation(order, { provider: "razorpay" });

    return NextResponse.json({ ok: true, order });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }
}
