import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { createOrderSchema, couponValidationSchema } from "@/lib/validators";
import { getCouponByCode, getProductById, getStoreSettings } from "@/lib/firebase/firestore";
import { getRazorpayInstance } from "@/lib/payments/razorpay";
import { getStripeInstance } from "@/lib/payments/stripe";
import { getAdminDb } from "@/lib/firebase/admin";
import { nanoid } from "nanoid";
import { calculateCheckoutSummary } from "@/lib/checkout-pricing";
import { publishSystemEvent } from "@/lib/system-events";

export const runtime = "nodejs";

async function buildSecureItems(items: Array<{ productId: string; quantity: number; customImageUrl?: string }>) {
  const secureItems: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
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
      customImageUrl: item.customImageUrl,
    });
  }

  return secureItems;
}

async function calculateTotal(items: Array<{ productId: string; quantity: number; customImageUrl?: string }>, couponCode?: string) {
  const secureItems = await buildSecureItems(items);
  const subtotal = secureItems.reduce((total, item) => total + item.price * item.quantity, 0);
  let discountAmount = 0;

  if (couponCode) {
    const normalized = couponValidationSchema.parse({ code: couponCode }).code;
    const coupon = await getCouponByCode(normalized);
    const isExpired = coupon?.expiresAt ? new Date(coupon.expiresAt).getTime() < Date.now() : false;

    if (coupon && coupon.active && !isExpired) {
      discountAmount = coupon.type === "percent" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
    }
  }

  const settings = await getStoreSettings();
  const summary = calculateCheckoutSummary({
    subtotal,
    discountAmount,
    taxRate: settings.taxRate,
    deliveryFee: settings.deliveryFee,
  });

  return {
    secureItems,
    ...summary,
  };
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    const payload = createOrderSchema.parse(await request.json());
    const totals = await calculateTotal(payload.items, payload.couponCode);

    await publishSystemEvent({
      type: "checkout_initiated",
      module: "orders",
      source: "api:create-order",
      userId: user.uid,
      payload: {
        paymentMethod: payload.paymentMethod,
        priority: payload.priority ?? "normal",
        subtotal: totals.subtotal,
        total: totals.total,
      },
    });

    if (payload.paymentMethod === "razorpay") {
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
