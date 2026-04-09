import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { couponValidationSchema, upiOfflinePaymentSchema } from "@/lib/validators";
import { createOrder, getCouponByCode, getProductById, getStoreSettings, getUserById, saveCart } from "@/lib/firebase/firestore";
import { calculateCheckoutSummary } from "@/lib/checkout-pricing";
import { calculateDeliveryQuote, canUseGateway } from "@/lib/settings-engine";
import { publishSystemEvent } from "@/lib/system-events";

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
  const gatewayCheck = canUseGateway(settings, "upi_offline", {
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
    const payload = upiOfflinePaymentSchema.parse(await request.json());

    if (payload.orderDraft.paymentMethod !== "upi-offline") {
      return NextResponse.json({ error: "Invalid payment method for UPI route" }, { status: 400 });
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

    const generatedPaymentId = payload.transactionId?.trim() || `UPI-${Date.now()}-${nanoid(5)}`;
    const order = await createOrder({
      userId: user.uid,
      items: totals.secureItems,
      priority: payload.orderDraft.priority ?? "normal",
      totalAmount: totals.total,
      subtotalAmount: totals.subtotal,
      taxRate: totals.taxRate,
      taxAmount: totals.taxAmount,
      deliveryFee: totals.deliveryFee,
      paymentId: generatedPaymentId,
      status: "pending",
      address: payload.orderDraft.address,
      couponCode: payload.orderDraft.couponCode,
      discountAmount: totals.discountAmount,
      payment: {
        provider: "upi_offline",
        paymentId: generatedPaymentId,
        orderId: `upi-${Date.now()}`,
        transactionId: payload.transactionId?.trim() || undefined,
        status: "pending",
        proofImageUrl: payload.proofImageUrl,
        proofStatus: "pending",
        upiVpa: payload.upiVpa.trim(),
      },
    });

    await saveCart(user.uid, []);

    await publishSystemEvent({
      type: "checkout_initiated",
      module: "payments",
      source: "api:payments-upi",
      userId: user.uid,
      payload: {
        provider: "upi_offline",
        orderId: order.id,
        amount: totals.total,
        proofStatus: "pending",
      },
    });

    return NextResponse.json({
      ok: true,
      order,
      message: "UPI payment proof submitted. Your order is pending admin verification.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not submit UPI payment proof" }, { status: 400 });
  }
}
