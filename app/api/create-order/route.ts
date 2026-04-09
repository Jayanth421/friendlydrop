import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { createOrderSchema, couponValidationSchema } from "@/lib/validators";
import { getCouponByCode, getProductById, getStoreSettings, getUserById } from "@/lib/firebase/firestore";
import { getRazorpayInstance } from "@/lib/payments/razorpay";
import { getStripeInstance } from "@/lib/payments/stripe";
import { getAdminDb } from "@/lib/firebase/admin";
import { nanoid } from "nanoid";
import { calculateCheckoutSummary } from "@/lib/checkout-pricing";
import { publishSystemEvent } from "@/lib/system-events";
import { canUseGateway, calculateDeliveryQuote, evaluateCheckoutControls } from "@/lib/settings-engine";

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

async function calculateTotal(
  input: {
    userId: string;
    items: Array<{ productId: string; quantity: number; customImageUrl?: string }>;
    couponCode?: string;
    priority?: "normal" | "express";
    address: { postalCode?: string; city?: string };
    paymentMethod: "razorpay" | "stripe";
  },
) {
  const secureItems = await buildSecureItems(input.items);
  const subtotal = secureItems.reduce((total, item) => total + item.price * item.quantity, 0);
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

  const gatewayCheck = canUseGateway(settings, input.paymentMethod, {
    subtotal,
    postalCode: input.address.postalCode,
    city: input.address.city,
    speed: input.priority === "express" ? "express" : "standard",
  });

  let selectedGateway: "razorpay" | "stripe" = input.paymentMethod;
  if (!gatewayCheck.allowed) {
    const checkoutControls = evaluateCheckoutControls(settings, {
      subtotal,
      postalCode: input.address.postalCode,
      city: input.address.city,
      speed: input.priority === "express" ? "express" : "standard",
      customerSegment: profile?.segment,
      isFirstOrder,
      productIds: secureItems.map((item) => item.productId),
      categoryIds: secureItems.map((item) => item.category),
    });

    const fallbackGateway = checkoutControls.payments.fallbackGateway;
    const fallback = fallbackGateway === "razorpay" || fallbackGateway === "stripe" ? fallbackGateway : undefined;
    const shouldFallback =
      settings.payments.rules.smartFallbackEnabled &&
      fallback &&
      fallback !== input.paymentMethod;

    if (!shouldFallback) {
      throw new Error(gatewayCheck.reason);
    }

    const fallbackCheck = canUseGateway(settings, fallback, {
      subtotal,
      postalCode: input.address.postalCode,
      city: input.address.city,
      speed: input.priority === "express" ? "express" : "standard",
    });

    if (!fallbackCheck.allowed) {
      throw new Error(fallbackCheck.reason);
    }

    selectedGateway = fallback;
  }

  const summary = calculateCheckoutSummary({
    subtotal,
    discountAmount,
    taxRate: settings.operations.taxEnabled ? settings.taxRate : 0,
    deliveryFee: deliveryQuote.allowed ? deliveryQuote.fee : 0,
  });

  const checkoutControls = evaluateCheckoutControls(settings, {
    subtotal,
    postalCode: input.address.postalCode,
    city: input.address.city,
    speed: input.priority === "express" ? "express" : "standard",
    customerSegment: profile?.segment,
    isFirstOrder,
    productIds: secureItems.map((item) => item.productId),
    categoryIds: secureItems.map((item) => item.category),
  });

  return {
    secureItems,
    deliveryQuote,
    checkoutControls,
    selectedGateway,
    ...summary,
  };
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    const payload = createOrderSchema.parse(await request.json());

    if (payload.paymentMethod === "upi-offline") {
      return NextResponse.json({ error: "Use /api/payments/upi for offline UPI submissions" }, { status: 400 });
    }

    const totals = await calculateTotal({
      userId: user.uid,
      items: payload.items,
      couponCode: payload.couponCode,
      priority: payload.priority,
      address: {
        postalCode: payload.address.postalCode,
        city: payload.address.city,
      },
      paymentMethod: payload.paymentMethod as "razorpay" | "stripe",
    });

    await publishSystemEvent({
      type: "checkout_initiated",
      module: "orders",
      source: "api:create-order",
      userId: user.uid,
      payload: {
        paymentMethod: payload.paymentMethod,
        selectedGateway: totals.selectedGateway,
        priority: payload.priority ?? "normal",
        subtotal: totals.subtotal,
        total: totals.total,
        deliveryFee: totals.deliveryFee,
        deliveryZone: totals.deliveryQuote.zoneName,
        freeDeliveryRule: totals.deliveryQuote.freeRuleId,
      },
    });

    if (totals.selectedGateway === "razorpay") {
      const razorpayOrder = await getRazorpayInstance().orders.create({
        amount: totals.total * 100,
        currency: "INR",
        receipt: `fd_${Date.now()}`,
        notes: {
          userId: user.uid,
        },
      });

      return NextResponse.json({
        provider: "razorpay",
        key: process.env.RAZORPAY_KEY_ID,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      });
    }

    const pendingOrderId = nanoid(14);

    await getAdminDb().collection("pendingOrders").doc(pendingOrderId).set({
      id: pendingOrderId,
      userId: user.uid,
      userEmail: user.email,
      userName: user.name,
      orderDraft: {
        ...payload,
        paymentMethod: totals.selectedGateway,
        items: totals.secureItems,
      },
      totals,
      createdAt: new Date().toISOString(),
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await getStripeInstance().checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "inr",
            product_data: {
              name: "FriendlyDrop Order",
              description: `Includes GST ${totals.taxRate}% and delivery charges`,
            },
            unit_amount: totals.total * 100,
          },
        },
      ],
      success_url: `${appUrl}/checkout/stripe-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout?cancelled=true`,
      metadata: {
        pendingOrderId,
        userId: user.uid,
      },
    });

    return NextResponse.json({ provider: "stripe", url: session.url });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not create order" }, { status: 400 });
  }
}
